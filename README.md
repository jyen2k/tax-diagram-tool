# Tax Structure Chart Builder

A lightweight browser app for tax lawyers to create entity structure diagrams with ownership lines and transaction arrows.

## Current Features

- Tax-specific entity palette for corporations, partnerships, hybrid/disregarded entities, trusts or non-entities, and individuals
- Drag-and-drop SVG canvas
- Separate relationship modes for ownership lines and transaction arrows
- Inspector panel for editing entity and relationship details
- Narrative drafting for simple plain-English structure descriptions
- Browser saves plus SVG, PNG, and editable PPTX export
- Internal feedback form with diagram snapshot capture

## Run Locally

Run the lightweight Python server:

```bash
python3 server.py
```

Then open `http://localhost:8000`.

If `DATABASE_URL` is not set, feedback submissions are stored locally under `/tmp/tax-flow-chart-feedback`.

## Deploy To App Garden

This project includes an App Garden-ready `Dockerfile` that runs the web app plus a small feedback
API on the `PORT` provided by the platform.

The repo metadata lives in [`.appgarden.json`](./.appgarden.json) and uses the app name
`tax-flow-chart-tool`.

To use shared internal feedback storage in App Garden:

1. Provision a managed Postgres database for the app so App Garden sets `DATABASE_URL`.
2. Deploy the current code.
3. Keep auth enabled so teammate feedback is internal.

The feedback form stores:
- submitter name
- free-text comment
- PNG snapshot of the current diagram
- authenticated user email when App Garden provides `X-Authenticated-User`

## Example Narrative

```text
USP owns 100% of HoldCo.
HoldCo owns 100% of US LLC.
US LLC sells IP to CFC1.
CFC1 loans cash to USP.
```

## Good Next Steps

- PPTX export for PowerPoint-heavy workflows
- Better narrative parsing with structured prompts and suggestions
- Swimlanes or jurisdiction grouping
- Undo/redo and multi-select
- Shared links backed by a small database
