from __future__ import annotations

import base64
import json
import os
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

try:
    import psycopg
except ImportError:  # pragma: no cover - local dev fallback
    psycopg = None


APP_ROOT = Path(__file__).resolve().parent
LOCAL_FEEDBACK_DIR = Path(os.getenv("LOCAL_FEEDBACK_DIR", "/tmp/tax-flow-chart-feedback"))
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

CREATE_FEEDBACK_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS feedback_submissions (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitter_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    diagram_png BYTEA NOT NULL,
    diagram_mime_type TEXT NOT NULL DEFAULT 'image/png',
    diagram_width INTEGER,
    diagram_height INTEGER,
    authenticated_user TEXT
)
"""


def json_response(handler: "TaxChartHandler", status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def ensure_feedback_table() -> None:
    if not DATABASE_URL:
        return
    if psycopg is None:
        raise RuntimeError("DATABASE_URL is set, but psycopg is not installed.")

    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(CREATE_FEEDBACK_TABLE_SQL)
        connection.commit()


def store_feedback_in_database(
    *,
    submitter_name: str,
    comment: str,
    image_bytes: bytes,
    image_mime_type: str,
    image_width: int | None,
    image_height: int | None,
    authenticated_user: str | None,
) -> dict[str, Any]:
    ensure_feedback_table()
    assert psycopg is not None

    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO feedback_submissions (
                    submitter_name,
                    comment,
                    diagram_png,
                    diagram_mime_type,
                    diagram_width,
                    diagram_height,
                    authenticated_user
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (
                    submitter_name,
                    comment,
                    image_bytes,
                    image_mime_type,
                    image_width,
                    image_height,
                    authenticated_user,
                ),
            )
            record_id, created_at = cursor.fetchone()
        connection.commit()

    return {
        "storage": "database",
        "id": record_id,
        "created_at": created_at.isoformat() if created_at else None,
    }


def store_feedback_locally(
    *,
    submitter_name: str,
    comment: str,
    image_bytes: bytes,
    image_mime_type: str,
    image_width: int | None,
    image_height: int | None,
    authenticated_user: str | None,
) -> dict[str, Any]:
    LOCAL_FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
    submission_id = uuid.uuid4().hex
    timestamp = datetime.now(timezone.utc).isoformat()
    image_path = LOCAL_FEEDBACK_DIR / f"{submission_id}.png"
    metadata_path = LOCAL_FEEDBACK_DIR / f"{submission_id}.json"

    image_path.write_bytes(image_bytes)
    metadata_path.write_text(
        json.dumps(
            {
                "id": submission_id,
                "created_at": timestamp,
                "submitter_name": submitter_name,
                "comment": comment,
                "diagram_mime_type": image_mime_type,
                "diagram_width": image_width,
                "diagram_height": image_height,
                "authenticated_user": authenticated_user,
                "image_path": str(image_path),
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    return {
        "storage": "local",
        "id": submission_id,
        "created_at": timestamp,
        "image_path": str(image_path),
    }


def list_feedback_from_database(limit: int = 25) -> list[dict[str, Any]]:
    ensure_feedback_table()
    assert psycopg is not None

    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    created_at,
                    submitter_name,
                    comment,
                    diagram_mime_type,
                    encode(diagram_png, 'base64') AS diagram_base64
                FROM feedback_submissions
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    entries = []
    for row in rows:
        record_id, created_at, submitter_name, comment, diagram_mime_type, diagram_base64 = row
        entries.append(
            {
                "id": record_id,
                "created_at": created_at.isoformat() if created_at else None,
                "submitter_name": submitter_name,
                "comment": comment,
                "snapshot_data_url": f"data:{diagram_mime_type};base64,{diagram_base64}",
            }
        )
    return entries


def list_feedback_locally(limit: int = 25) -> list[dict[str, Any]]:
    if not LOCAL_FEEDBACK_DIR.exists():
        return []

    entries = []
    for metadata_path in LOCAL_FEEDBACK_DIR.glob("*.json"):
        try:
            payload = json.loads(metadata_path.read_text(encoding="utf-8"))
            image_path = Path(payload.get("image_path", ""))
            if not image_path.exists():
                continue
            image_base64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
            entries.append(
                {
                    "id": payload.get("id"),
                    "created_at": payload.get("created_at"),
                    "submitter_name": payload.get("submitter_name"),
                    "comment": payload.get("comment"),
                    "snapshot_data_url": f"data:{payload.get('diagram_mime_type', 'image/png')};base64,{image_base64}",
                }
            )
        except Exception as error:  # pragma: no cover - local corruption safeguard
            print(f"Skipping unreadable feedback file {metadata_path}: {error}")

    entries.sort(key=lambda entry: entry.get("created_at") or "", reverse=True)
    return entries[:limit]


def delete_feedback_from_database(entry_id: str) -> bool:
    ensure_feedback_table()
    assert psycopg is not None

    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM feedback_submissions WHERE id = %s RETURNING id", (entry_id,))
            deleted = cursor.fetchone()
        connection.commit()

    return bool(deleted)


def delete_feedback_locally(entry_id: str) -> bool:
    metadata_path = LOCAL_FEEDBACK_DIR / f"{entry_id}.json"
    image_path = LOCAL_FEEDBACK_DIR / f"{entry_id}.png"
    deleted = False

    if metadata_path.exists():
      metadata_path.unlink()
      deleted = True
    if image_path.exists():
      image_path.unlink()
      deleted = True

    return deleted


class TaxChartHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(APP_ROOT), **kwargs)

    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/api/feedback":
            try:
                entries = list_feedback_from_database() if DATABASE_URL else list_feedback_locally()
                json_response(self, HTTPStatus.OK, {"ok": True, "entries": entries})
            except Exception as error:  # pragma: no cover - runtime safeguard
                print(f"Feedback inbox load failed: {error}")
                json_response(
                    self,
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    {"ok": False, "error": "Could not load feedback right now."},
                )
            return

        if self.path in {"", "/"}:
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/api/feedback":
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown API endpoint.")
            return

        try:
            self.handle_feedback_submission()
        except ValueError as error:
            json_response(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(error)})
        except Exception as error:  # pragma: no cover - runtime safeguard
            print(f"Feedback submission failed: {error}")
            json_response(
                self,
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"ok": False, "error": "Could not store feedback right now."},
            )

    def do_DELETE(self) -> None:
        if self.path.rstrip("/").split("?")[0] != "/api/feedback":
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown API endpoint.")
            return

        try:
            self.handle_feedback_delete()
        except ValueError as error:
            json_response(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(error)})
        except Exception as error:  # pragma: no cover - runtime safeguard
            print(f"Feedback delete failed: {error}")
            json_response(
                self,
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"ok": False, "error": "Could not delete feedback right now."},
            )

    def handle_feedback_delete(self) -> None:
        request_path = self.path.split("?", 1)
        query = request_path[1] if len(request_path) > 1 else ""
        params = {}
        for pair in query.split("&"):
            if "=" not in pair:
                continue
            key, value = pair.split("=", 1)
            params[key] = value

        entry_id = params.get("id", "").strip()
        if not entry_id:
            raise ValueError("Feedback id is required.")

        deleted = (
            delete_feedback_from_database(entry_id)
            if DATABASE_URL
            else delete_feedback_locally(entry_id)
        )

        if not deleted:
            json_response(self, HTTPStatus.NOT_FOUND, {"ok": False, "error": "Feedback item not found."})
            return

        json_response(self, HTTPStatus.OK, {"ok": True, "message": "Feedback deleted."})

    def handle_feedback_submission(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length <= 0:
            raise ValueError("Missing feedback payload.")
        if content_length > 20_000_000:
            raise ValueError("Feedback payload is too large.")

        raw_body = self.rfile.read(content_length)
        payload = json.loads(raw_body.decode("utf-8"))

        submitter_name = str(payload.get("name", "")).strip()
        comment = str(payload.get("comment", "")).strip()
        snapshot_base64 = str(payload.get("snapshotBase64", "")).strip()
        snapshot_mime_type = str(payload.get("snapshotMimeType", "image/png")).strip() or "image/png"
        snapshot_width = payload.get("snapshotWidth")
        snapshot_height = payload.get("snapshotHeight")
        authenticated_user = self.headers.get("X-Authenticated-User", "").strip() or None

        if not submitter_name:
            raise ValueError("Name is required.")
        if not comment:
            raise ValueError("Comment is required.")
        if not snapshot_base64:
            raise ValueError("Diagram snapshot is required.")

        try:
            image_bytes = base64.b64decode(snapshot_base64, validate=True)
        except Exception as error:
            raise ValueError("Diagram snapshot could not be decoded.") from error

        if DATABASE_URL:
            result = store_feedback_in_database(
                submitter_name=submitter_name,
                comment=comment,
                image_bytes=image_bytes,
                image_mime_type=snapshot_mime_type,
                image_width=snapshot_width,
                image_height=snapshot_height,
                authenticated_user=authenticated_user,
            )
        else:
            result = store_feedback_locally(
                submitter_name=submitter_name,
                comment=comment,
                image_bytes=image_bytes,
                image_mime_type=snapshot_mime_type,
                image_width=snapshot_width,
                image_height=snapshot_height,
                authenticated_user=authenticated_user,
            )

        json_response(
            self,
            HTTPStatus.OK,
            {
                "ok": True,
                "message": "Feedback saved.",
                **result,
            },
        )


def main() -> None:
    port = int(os.getenv("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), TaxChartHandler)
    print(f"Serving tax chart tool on http://0.0.0.0:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
