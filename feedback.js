const refreshFeedbackInboxButton = document.getElementById("refreshFeedbackInbox");
const feedbackInboxStatus = document.getElementById("feedbackInboxStatus");
const feedbackInboxList = document.getElementById("feedbackInboxList");
const feedbackUnavailablePanel = document.getElementById("feedbackUnavailablePanel");
const feedbackInboxPanel = document.getElementById("feedbackInboxPanel");
let pendingDeleteId = null;

function isPublicStaticSite() {
  return window.location.protocol === "file:" || window.location.hostname.endsWith(".github.io");
}

function setFeedbackInboxStatus(message, tone = "") {
  feedbackInboxStatus.textContent = message;
  feedbackInboxStatus.className = "subtle small";
  if (tone) {
    feedbackInboxStatus.classList.add(tone);
  }
}

function formatFeedbackTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderFeedbackInbox(entries) {
  feedbackInboxList.innerHTML = "";

  if (!entries || entries.length === 0) {
    setFeedbackInboxStatus("No feedback yet.");
    return;
  }

  setFeedbackInboxStatus(`${entries.length} recent submission${entries.length === 1 ? "" : "s"}.`);

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "feedback-inbox-item";

    const head = document.createElement("div");
    head.className = "feedback-inbox-head";

    const headMain = document.createElement("div");
    headMain.className = "feedback-inbox-head-main";

    const name = document.createElement("div");
    name.className = "feedback-inbox-name";
    name.textContent = entry.submitter_name || "Unknown";

    const time = document.createElement("div");
    time.className = "feedback-inbox-time";
    time.textContent = formatFeedbackTimestamp(entry.created_at);

    headMain.appendChild(name);
    headMain.appendChild(time);
    head.appendChild(headMain);

    const actions = document.createElement("div");
    actions.className = "feedback-inbox-actions";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button compact-button";
    deleteButton.textContent = pendingDeleteId === entry.id ? "Confirm Delete" : "Delete";
    deleteButton.addEventListener("click", () => handleDeleteClick(entry.id));
    actions.appendChild(deleteButton);

    if (pendingDeleteId === entry.id) {
      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "secondary-button compact-button";
      cancelButton.textContent = "Cancel";
      cancelButton.addEventListener("click", () => {
        pendingDeleteId = null;
        renderFeedbackInbox(entries);
      });
      actions.appendChild(cancelButton);
    }

    head.appendChild(actions);
    card.appendChild(head);

    const comment = document.createElement("p");
    comment.className = "feedback-inbox-comment";
    comment.textContent = entry.comment || "";
    card.appendChild(comment);

    if (entry.snapshot_data_url) {
      const image = document.createElement("img");
      image.className = "feedback-inbox-image";
      image.src = entry.snapshot_data_url;
      image.alt = `Diagram snapshot from ${entry.submitter_name || "feedback submission"}`;
      card.appendChild(image);
    }

    feedbackInboxList.appendChild(card);
  });
}

function handleDeleteClick(id) {
  if (!id) return;
  if (pendingDeleteId !== id) {
    pendingDeleteId = id;
    loadFeedbackInbox();
    return;
  }
  deleteFeedback(id);
}

async function deleteFeedback(id) {
  if (!id) return;

  try {
    const response = await fetch(`/api/feedback?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Could not delete feedback.");
    }
    pendingDeleteId = null;
    loadFeedbackInbox();
  } catch (error) {
    console.error(error);
    pendingDeleteId = null;
    setFeedbackInboxStatus(error.message || "Could not delete feedback right now.", "error");
  }
}

async function loadFeedbackInbox() {
  refreshFeedbackInboxButton.disabled = true;
  setFeedbackInboxStatus("Loading recent feedback...");

  try {
    const response = await fetch("/api/feedback");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Could not load feedback.");
    }
    renderFeedbackInbox(payload.entries || []);
  } catch (error) {
    console.error(error);
    feedbackInboxList.innerHTML = "";
    setFeedbackInboxStatus(error.message || "Could not load feedback right now.", "error");
  } finally {
    refreshFeedbackInboxButton.disabled = false;
  }
}

if (isPublicStaticSite()) {
  feedbackInboxPanel.classList.add("hidden");
  feedbackUnavailablePanel.classList.remove("hidden");
} else {
  refreshFeedbackInboxButton.addEventListener("click", loadFeedbackInbox);
  loadFeedbackInbox();
}
