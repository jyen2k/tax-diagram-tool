const ENTITY_TYPES = [
  { key: "corporation", label: "Corporation", shortLabel: "Corporation", color: "#d8c2a8" },
  { key: "partnership", label: "Partnership", shortLabel: "Pship", color: "#d8e5d2" },
  {
    key: "dreg",
    label: "Disregarded / Hybrid Entity",
    shortLabel: "D/H Entity",
    color: "#d6d0ef",
  },
  { key: "hybrid-partnership", label: "Hybrid Partnership", shortLabel: "Hybrid Partnership", color: "#d5e4df" },
  { key: "reverse-hybrid", label: "Reverse Hybrid", shortLabel: "Reverse Hybrid", color: "#c8ddd7" },
  { key: "individual", label: "Individual", shortLabel: "Individual", color: "#f2d3c2" },
  { key: "trust", label: "Trust or other Non-Entity", shortLabel: "Trust / Non-Entity", color: "#e3ddcf" },
];

const svgNs = "http://www.w3.org/2000/svg";
const canvas = document.getElementById("diagramCanvas");
const canvasCard = document.querySelector(".canvas-card");
const entityPalette = document.getElementById("entityPalette");
const entityTypeSelect = document.getElementById("entityType");
const entityJurisdictionSelect = document.getElementById("entityJurisdiction");
const savedDiagramList = document.getElementById("savedDiagramList");
const selectionType = document.getElementById("selectionType");
const modeStatus = document.getElementById("modeStatus");
const entityForm = document.getElementById("entityForm");
const edgeForm = document.getElementById("edgeForm");
const emptySelection = document.getElementById("emptySelection");
const narrativeInput = document.getElementById("narrativeInput");
const feedbackPanel = document.getElementById("feedbackPanel");
const feedbackAudienceLabel = document.getElementById("feedbackAudienceLabel");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackNameInput = document.getElementById("feedbackName");
const feedbackCommentInput = document.getElementById("feedbackComment");
const feedbackStatus = document.getElementById("feedbackStatus");
const feedbackSubmitButton = document.getElementById("submitFeedback");
const feedbackInboxLink = document.getElementById("feedbackInboxLink");

const state = {
  nodes: [],
  edges: [],
  workspaceWidth: 1400,
  workspaceHeight: 900,
  zoom: 1,
  transactionLegend: {
    enabled: false,
    arrowEndText: "",
    nonArrowEndText: "",
    x: 70,
    y: 760,
  },
  selection: null,
  selectedNodeIds: [],
  mode: "select",
  pendingConnection: null,
  drag: null,
  edgeDrag: null,
  labelDrag: null,
  legendDrag: null,
  pan: null,
  marquee: null,
  suppressBlankClick: false,
  suppressClickNodeId: null,
  nextNodeId: 1,
  nextEdgeId: 1,
};

const MIN_WORKSPACE_WIDTH = 1400;
const MIN_WORKSPACE_HEIGHT = 900;
const WORKSPACE_EXPAND_MARGIN = 240;
const WORKSPACE_EXPAND_STEP = 800;
const VIEWBOX = { width: MIN_WORKSPACE_WIDTH, height: MIN_WORKSPACE_HEIGHT };
const DISPLAY_GRID = 40;
const DISPLAY_SNAP_THRESHOLD = 10;
let GRID = DISPLAY_GRID;
let SNAP_THRESHOLD = DISPLAY_SNAP_THRESHOLD;
let BOX = { width: GRID * 3, height: GRID * 2 };
const RELATIONSHIP_VERBS = [
  "sells",
  "loans",
  "contributes",
  "distributes",
  "pays",
  "licenses",
  "transfers",
  "redeems",
];
const JURISDICTION_OPTIONS = [
  { value: "", label: "None", flag: "" },
  { value: "AR", label: "Argentina", flag: "🇦🇷" },
  { value: "AT", label: "Austria", flag: "🇦🇹" },
  { value: "AU", label: "Australia", flag: "🇦🇺" },
  { value: "BD", label: "Bangladesh", flag: "🇧🇩" },
  { value: "BE", label: "Belgium", flag: "🇧🇪" },
  { value: "BR", label: "Brazil", flag: "🇧🇷" },
  { value: "CA", label: "Canada", flag: "🇨🇦" },
  { value: "CH", label: "Switzerland", flag: "🇨🇭" },
  { value: "CN", label: "China", flag: "🇨🇳" },
  { value: "DE", label: "Germany", flag: "🇩🇪" },
  { value: "ES", label: "Spain", flag: "🇪🇸" },
  { value: "FR", label: "France", flag: "🇫🇷" },
  { value: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { value: "ID", label: "Indonesia", flag: "🇮🇩" },
  { value: "IE", label: "Ireland", flag: "🇮🇪" },
  { value: "IL", label: "Israel", flag: "🇮🇱" },
  { value: "IN", label: "India", flag: "🇮🇳" },
  { value: "IT", label: "Italy", flag: "🇮🇹" },
  { value: "JP", label: "Japan", flag: "🇯🇵" },
  { value: "KR", label: "South Korea", flag: "🇰🇷" },
  { value: "MX", label: "Mexico", flag: "🇲🇽" },
  { value: "NL", label: "Netherlands", flag: "🇳🇱" },
  { value: "NO", label: "Norway", flag: "🇳🇴" },
  { value: "PH", label: "Philippines", flag: "🇵🇭" },
  { value: "PL", label: "Poland", flag: "🇵🇱" },
  { value: "RU", label: "Russia", flag: "🇷🇺" },
  { value: "SA", label: "Saudi Arabia", flag: "🇸🇦" },
  { value: "SE", label: "Sweden", flag: "🇸🇪" },
  { value: "SG", label: "Singapore", flag: "🇸🇬" },
  { value: "TH", label: "Thailand", flag: "🇹🇭" },
  { value: "TR", label: "Turkey", flag: "🇹🇷" },
  { value: "TW", label: "Taiwan", flag: "🇹🇼" },
  { value: "US", label: "United States", flag: "🇺🇸" },
  { value: "AE", label: "United Arab Emirates", flag: "🇦🇪" },
  { value: "VN", label: "Vietnam", flag: "🇻🇳" },
  { value: "BM", label: "Bermuda", flag: "🇧🇲" },
  { value: "KY", label: "Cayman Islands", flag: "🇰🇾" },
  { value: "VG", label: "British Virgin Islands", flag: "🇻🇬" },
  { value: "JE", label: "Jersey", flag: "🇯🇪" },
  { value: "GG", label: "Guernsey", flag: "🇬🇬" },
  { value: "DK", label: "Denmark", flag: "🇩🇰" },
  { value: "FI", label: "Finland", flag: "🇫🇮" },
  { value: "GR", label: "Greece", flag: "🇬🇷" },
  { value: "LU", label: "Luxembourg", flag: "🇱🇺" },
  { value: "PT", label: "Portugal", flag: "🇵🇹" },
  { value: "CZ", label: "Czechia", flag: "🇨🇿" },
  { value: "RO", label: "Romania", flag: "🇷🇴" },
  { value: "HK", label: "Hong Kong", flag: "🇭🇰" },
  { value: "NZ", label: "New Zealand", flag: "🇳🇿" },
  { value: "ZA", label: "South Africa", flag: "🇿🇦" },
  { value: "__custom__", label: "Custom...", flag: "" },
];
const BROWSER_SAVE_KEY = "tax-structure-diagram-saves";
const MAX_BROWSER_SAVES = 5;
const PUBLIC_FEEDBACK_EMAIL = "jasony@openai.com";
const PUBLIC_API_BASE_URL = "https://tax-flow-chart-tool.app.openai.org";

function init() {
  configureFeedbackAvailability();
  applyCanvasDimensions();
  syncCanvasMetrics();
  buildPalette();
  buildTypeOptions();
  buildJurisdictionOptions();
  bindEvents();
  seedDemo();
  render();
}

function applyCanvasDimensions() {
  VIEWBOX.width = state.workspaceWidth;
  VIEWBOX.height = state.workspaceHeight;
  canvas.setAttribute("viewBox", `0 0 ${VIEWBOX.width} ${VIEWBOX.height}`);
  const zoomedWidth = Math.round(VIEWBOX.width * state.zoom);
  const zoomedHeight = Math.round(VIEWBOX.height * state.zoom);
  canvas.setAttribute("width", String(zoomedWidth));
  canvas.setAttribute("height", String(zoomedHeight));
  canvas.style.width = `${zoomedWidth}px`;
  canvas.style.height = `${zoomedHeight}px`;
}

function ensureWorkspaceFitsContent() {
  let requiredWidth = MIN_WORKSPACE_WIDTH;
  let requiredHeight = MIN_WORKSPACE_HEIGHT;

  state.nodes.forEach((node) => {
    requiredWidth = Math.max(requiredWidth, node.x + BOX.width + WORKSPACE_EXPAND_MARGIN);
    requiredHeight = Math.max(requiredHeight, node.y + BOX.height + WORKSPACE_EXPAND_MARGIN);
  });

  if (state.transactionLegend?.enabled) {
    requiredWidth = Math.max(
      requiredWidth,
      (state.transactionLegend.x || 0) + 340 + WORKSPACE_EXPAND_MARGIN,
    );
    requiredHeight = Math.max(
      requiredHeight,
      (state.transactionLegend.y || 0) + 96 + WORKSPACE_EXPAND_MARGIN,
    );
  }

  state.workspaceWidth = Math.max(
    MIN_WORKSPACE_WIDTH,
    Math.ceil(requiredWidth / WORKSPACE_EXPAND_STEP) * WORKSPACE_EXPAND_STEP,
  );
  state.workspaceHeight = Math.max(
    MIN_WORKSPACE_HEIGHT,
    Math.ceil(requiredHeight / WORKSPACE_EXPAND_STEP) * WORKSPACE_EXPAND_STEP,
  );
}

function syncCanvasMetrics() {
  const rect = canvas.getBoundingClientRect();
  const scale =
    rect.width > 0 && rect.height > 0
      ? Math.min(rect.width / VIEWBOX.width, rect.height / VIEWBOX.height)
      : 1;
  const safeScale = scale > 0 ? scale : 1;
  GRID = DISPLAY_GRID;
  SNAP_THRESHOLD = DISPLAY_SNAP_THRESHOLD / safeScale;
  BOX = { width: DISPLAY_GRID * 3, height: DISPLAY_GRID * 2 };
}

function buildPalette() {
  entityPalette.innerHTML = "";
  ENTITY_TYPES.forEach((entityType) => {
    const button = document.createElement("button");
    button.className = "palette-button";
    button.textContent = entityType.label;
    button.addEventListener("click", () => addNode(entityType.key));
    entityPalette.appendChild(button);
  });
}

function buildTypeOptions() {
  entityTypeSelect.innerHTML = "";
  ENTITY_TYPES.forEach((entityType) => {
    const option = document.createElement("option");
    option.value = entityType.key;
    option.textContent = entityType.label;
    entityTypeSelect.appendChild(option);
  });
}

function buildJurisdictionOptions() {
  entityJurisdictionSelect.innerHTML = "";
  const seen = new Set();
  const uniqueOptions = JURISDICTION_OPTIONS.filter((jurisdiction) => {
    if (seen.has(jurisdiction.value)) return false;
    seen.add(jurisdiction.value);
    return true;
  });

  const noneOption = uniqueOptions.find((jurisdiction) => jurisdiction.value === "");
  const usOption = uniqueOptions.find((jurisdiction) => jurisdiction.value === "US");
  const customOption = uniqueOptions.find((jurisdiction) => jurisdiction.value === "__custom__");
  const remaining = uniqueOptions
    .filter(
      (jurisdiction) =>
        jurisdiction.value !== "" &&
        jurisdiction.value !== "US" &&
        jurisdiction.value !== "__custom__",
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  [noneOption, usOption, ...remaining, customOption].filter(Boolean).forEach((jurisdiction) => {
    const option = document.createElement("option");
    option.value = jurisdiction.value;
    option.textContent = jurisdiction.label;
    entityJurisdictionSelect.appendChild(option);
  });
}

function bindEvents() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  document.getElementById("entityLabel").addEventListener("input", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.label = event.target.value;
    render();
  });

  document.getElementById("entityType").addEventListener("change", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.type = event.target.value;
    render();
  });

  document.getElementById("entityJurisdiction").addEventListener("change", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    if (event.target.value === "__custom__") {
      node.jurisdictionMode = "custom";
      node.jurisdiction = "";
    } else {
      node.jurisdictionMode = event.target.value ? "flag" : "";
      node.jurisdiction = event.target.value;
      node.jurisdictionCustom = "";
    }
    render();
  });

  document.getElementById("entityJurisdictionCustom").addEventListener("input", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.jurisdictionMode = "custom";
    node.jurisdictionCustom = event.target.value;
    render();
  });

  document.getElementById("entityLineStyle").addEventListener("change", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.lineStyle = event.target.value;
    render();
  });

  document.getElementById("entityFill").addEventListener("change", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.fill = event.target.value;
    render();
  });

  document.getElementById("entityCrossedOut").addEventListener("change", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.crossedOut = event.target.checked;
    render();
  });

  document.getElementById("entityMultipleIndividuals").addEventListener("change", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.multipleIndividuals = event.target.checked;
    render();
  });

  document.getElementById("entityInnerLineStyle").addEventListener("change", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.innerLineStyle = event.target.value;
    render();
  });

  document.getElementById("entityInnerFill").addEventListener("change", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.innerFill = event.target.value;
    render();
  });

  document.getElementById("edgeLabel").addEventListener("input", (event) => {
    const edge = getSelectedEdge();
    if (!edge) return;
    edge.label = event.target.value;
    render();
  });

  document.getElementById("edgePercent").addEventListener("input", (event) => {
    const edge = getSelectedEdge();
    if (!edge) return;
    edge.percent = event.target.value;
    render();
  });

  document.getElementById("edgeKind").addEventListener("change", (event) => {
    const edge = getSelectedEdge();
    if (!edge) return;
    edge.kind = event.target.value;
    render();
  });

  document.getElementById("edgeColor").addEventListener("change", (event) => {
    const edge = getSelectedEdge();
    if (!edge) return;
    edge.color = event.target.value;
    render();
  });

  document.getElementById("edgeLineStyle").addEventListener("change", (event) => {
    const edge = getSelectedEdge();
    if (!edge) return;
    edge.lineStyle = event.target.value;
    render();
  });
  document.getElementById("edgeBidirectional").addEventListener("change", (event) => {
    const edge = getSelectedEdge();
    if (!edge || edge.kind !== "transaction") return;
    edge.bidirectional = event.target.checked;
    render();
  });
  document.getElementById("reverseEdge").addEventListener("click", reverseSelectedEdge);

  document.getElementById("deleteEntity").addEventListener("click", deleteSelectedEntity);
  document.getElementById("deleteEdge").addEventListener("click", deleteSelectedEdge);
  document.getElementById("clearBoard").addEventListener("click", clearBoard);
  document.getElementById("generateNarrative").addEventListener("click", () => {
    generateFromNarrative({ mode: "replace" });
  });
  document.getElementById("applyNarrative").addEventListener("click", () => {
    generateFromNarrative({ mode: "apply" });
  });
  document.getElementById("saveBrowser").addEventListener("click", saveBrowserDiagram);
  document.getElementById("zoomOut").addEventListener("click", () => setZoom(state.zoom - 0.1));
  document.getElementById("zoomReset").addEventListener("click", () => setZoom(1));
  document.getElementById("zoomIn").addEventListener("click", () => setZoom(state.zoom + 0.1));
  document.getElementById("exportSvg").addEventListener("click", exportSvg);
  document.getElementById("exportPng").addEventListener("click", exportPng);
  document.getElementById("exportPptx").addEventListener("click", exportPptx);
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", handleFeedbackSubmit);
  }
  document
    .getElementById("transactionLegendEnabled")
    .addEventListener("change", (event) => {
      state.transactionLegend.enabled = event.target.checked;
      render();
    });
  document
    .getElementById("transactionLegendArrowEnd")
    .addEventListener("input", (event) => {
      state.transactionLegend.arrowEndText = event.target.value;
      render();
    });
  document
    .getElementById("transactionLegendNonArrowEnd")
    .addEventListener("input", (event) => {
      state.transactionLegend.nonArrowEndText = event.target.value;
      render();
    });

  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  window.addEventListener("mousemove", handleCanvasMouseMove);
  window.addEventListener("mouseup", handleCanvasMouseUp);
  window.addEventListener("keydown", handleKeyDown);
}

function isPublicStaticSite() {
  return window.location.protocol === "file:" || window.location.hostname.endsWith(".github.io");
}

function apiUrl(path) {
  return isPublicStaticSite() ? `${PUBLIC_API_BASE_URL}${path}` : path;
}

function configureFeedbackAvailability() {
  if (!feedbackPanel) return;
  if (isPublicStaticSite()) {
    feedbackPanel.classList.remove("hidden");
    if (feedbackAudienceLabel) feedbackAudienceLabel.textContent = "Email";
    if (feedbackSubmitButton) feedbackSubmitButton.textContent = "Email Feedback";
    if (feedbackInboxLink) feedbackInboxLink.classList.add("hidden");
    if (feedbackStatus) {
      feedbackStatus.textContent = "Opens your email app to send feedback to Jason.";
    }
    return;
  }
  feedbackPanel.classList.remove("hidden");
  if (feedbackAudienceLabel) feedbackAudienceLabel.textContent = "Internal";
  if (feedbackSubmitButton) feedbackSubmitButton.textContent = "Send Feedback";
  if (feedbackInboxLink) feedbackInboxLink.classList.remove("hidden");
}

function seedDemo() {
  addNode("corporation", { label: "USP", x: 160, y: 140, silent: true });
  addNode("corporation", { label: "Corporation 2", x: 160, y: 380, silent: true });
  createEdge(state.nodes[0].id, state.nodes[1].id, "ownership", { percent: "100%" });
}

function addNode(typeKey, options = {}) {
  syncCanvasMetrics();
  const type = getType(typeKey);
  const number = state.nextNodeId;
  const node = {
    id: `node-${number}`,
    label: options.label || `${type.shortLabel} ${number}`,
    type: typeKey,
    jurisdiction: options.jurisdiction || "",
    jurisdictionMode: options.jurisdictionMode || "",
    jurisdictionCustom: options.jurisdictionCustom || "",
    lineStyle: options.lineStyle || "solid",
    fill: options.fill || "none",
    crossedOut: Boolean(options.crossedOut),
    innerLineStyle: options.innerLineStyle || "solid",
    innerFill: options.innerFill || "none",
    multipleIndividuals: Boolean(options.multipleIndividuals),
    x: options.x ?? GRID * 3 + ((number - 1) % 3) * (GRID * 6),
    y: options.y ?? GRID * 3 + Math.floor((number - 1) / 3) * (GRID * 4),
  };
  state.nextNodeId += 1;
  state.nodes.push(node);
  if (!options.silent) {
    state.selectedNodeIds = [node.id];
    state.selection = { kind: "node", id: node.id };
  }
  render();
}

function createEdge(fromId, toId, kind, options = {}) {
  if (fromId === toId) return;
  let normalizedFromId = fromId;
  let normalizedToId = toId;

  if (kind === "ownership" && !options.preserveDirection) {
    const fromNode = state.nodes.find((node) => node.id === fromId);
    const toNode = state.nodes.find((node) => node.id === toId);

    if (fromNode && toNode) {
      const fromCenterY = fromNode.y + BOX.height / 2;
      const toCenterY = toNode.y + BOX.height / 2;

      if (
        fromCenterY > toCenterY ||
        (fromCenterY === toCenterY && fromNode.x > toNode.x)
      ) {
        normalizedFromId = toId;
        normalizedToId = fromId;
      }
    }
  }

  if (kind === "ownership") {
    const duplicate = state.edges.find(
      (edge) =>
        edge.from === normalizedFromId &&
        edge.to === normalizedToId &&
        edge.kind === kind,
    );
    if (duplicate) {
      if (options.label !== undefined) duplicate.label = options.label;
      if (options.percent !== undefined) duplicate.percent = options.percent;
      if (options.color !== undefined) duplicate.color = options.color;
      if (options.lineStyle !== undefined) duplicate.lineStyle = options.lineStyle;
      if (options.preserveDirection !== undefined) {
        duplicate.preserveDirection = Boolean(options.preserveDirection);
      }
      state.selectedNodeIds = [];
      state.selection = { kind: "edge", id: duplicate.id };
      render();
      return duplicate;
    }
  }

  const edge = {
    id: `edge-${state.nextEdgeId}`,
    from: normalizedFromId,
    to: normalizedToId,
    kind,
    label: options.label || (kind === "transaction" ? "Transaction" : ""),
    percent: options.percent || "",
    color: options.color || "black",
    lineStyle: options.lineStyle || "solid",
    curveOffset: options.curveOffset || 0,
    bidirectional: Boolean(options.bidirectional),
    preserveDirection: Boolean(options.preserveDirection),
  };
  state.nextEdgeId += 1;
  state.edges.push(edge);
  state.selectedNodeIds = [];
  state.selection = { kind: "edge", id: edge.id };
  return edge;
}

function setMode(mode) {
  state.mode = mode;
  state.pendingConnection = null;
  state.selection = null;
  state.selectedNodeIds = [];
  state.suppressClickNodeId = null;
  state.suppressBlankClick = false;
  render();
}

function selectNode(nodeId) {
  if (state.suppressClickNodeId === nodeId) {
    state.suppressClickNodeId = null;
    return;
  }

  if (state.mode === "ownership" || state.mode === "transaction") {
    if (!state.pendingConnection) {
      state.pendingConnection = nodeId;
    } else {
      createEdge(state.pendingConnection, nodeId, state.mode, {
        label: state.mode === "transaction" ? "Transaction" : "",
      });
      state.pendingConnection = null;
      state.mode = "select";
    }
    render();
    return;
  }

  state.selectedNodeIds = [nodeId];
  state.selection = { kind: "node", id: nodeId };
  render();
}

function selectEdge(edgeId) {
  state.selectedNodeIds = [];
  state.selection = { kind: "edge", id: edgeId };
  render();
}

function render() {
  ensureWorkspaceFitsContent();
  renderCanvas();
  renderInspector();
  renderSavedDiagrams();
  renderControls();
}

function renderCanvas() {
  applyCanvasDimensions();
  syncCanvasMetrics();
  const defs = canvas.querySelector("defs");
  canvas.innerHTML = "";
  canvas.appendChild(defs);
  canvas.onclick = handleCanvasBlankClick;
  renderCanvasBackdrop();
  const ownershipBranchLevels = buildOwnershipBranchLevels();
  const ownershipSegments = buildOwnershipSegments(ownershipBranchLevels);

  state.edges.forEach((edge) => {
    const from = state.nodes.find((node) => node.id === edge.from);
    const to = state.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;

    const group = document.createElementNS(svgNs, "g");
    group.classList.add("edge", edge.kind);
    group.classList.add(edge.color || "black");
    if (isSelected("edge", edge.id)) group.classList.add("selected");
    group.dataset.edgeId = edge.id;

    const path = document.createElementNS(svgNs, "path");
    path.classList.add("edge-line");

    const geometry =
      edge.kind === "ownership"
        ? ownershipGeometry(edge, from, to, ownershipBranchLevels)
        : transactionGeometry(edge, from, to, ownershipSegments);
    const pathData = geometry.path;
    path.setAttribute("d", pathData);
    if (edge.lineStyle === "dashed") {
      path.setAttribute("stroke-dasharray", "9 6");
    }
    if (edge.kind === "transaction") {
      path.setAttribute("marker-end", `url(#transactionArrow-${edge.color || "black"})`);
      if (edge.bidirectional) {
        path.setAttribute("marker-start", `url(#transactionArrow-${edge.color || "black"})`);
      }
    }
    group.appendChild(path);

    const hitPath = document.createElementNS(svgNs, "path");
    hitPath.classList.add("edge-hitbox");
    hitPath.setAttribute("d", pathData);
    group.appendChild(hitPath);

    const labelTexts =
      edge.kind === "ownership"
        ? [edge.percent, edge.label].filter(Boolean)
        : [edge.label || "Transaction"];

    const labelGroup = document.createElementNS(svgNs, "g");
    labelGroup.classList.add("edge-label-group");
    if (edge.kind === "ownership") {
      labelGroup.classList.add("ownership-label-group");
      labelGroup.dataset.edgeId = edge.id;
    }

    labelTexts.forEach((text, index) => {
      const label = document.createElementNS(svgNs, "text");
      label.classList.add("edge-label");
      label.setAttribute("x", geometry.label.x);
      label.setAttribute("y", geometry.label.y + index * 16);
      label.setAttribute("text-anchor", geometry.label.anchor || "middle");
      label.setAttribute("fill", edgeColorValue(edge.color));
      label.textContent = text;
      labelGroup.appendChild(label);
    });

    if (labelTexts.length > 0) {
      group.appendChild(labelGroup);
    }

    group.addEventListener("click", (event) => {
      event.stopPropagation();
      selectEdge(edge.id);
    });

    canvas.appendChild(group);
  });

  state.nodes.forEach((node) => {
    const group = document.createElementNS(svgNs, "g");
    group.classList.add("entity-box");
    if (state.drag?.nodeId === node.id) group.classList.add("dragging");
    if (isSelected("node", node.id) || state.pendingConnection === node.id) {
      group.classList.add("selected");
    }
    if (state.selectedNodeIds.length > 1 && state.selectedNodeIds.includes(node.id)) {
      group.classList.add("multi-selected");
    }
    group.dataset.nodeId = node.id;
    group.setAttribute("transform", `translate(${node.x}, ${node.y})`);

    if (node.type === "individual") {
      const hitbox = document.createElementNS(svgNs, "rect");
      hitbox.classList.add("entity-hitbox");
      hitbox.setAttribute("width", BOX.width);
      hitbox.setAttribute("height", BOX.height);
      hitbox.setAttribute("fill", "#ffffff");
      hitbox.setAttribute("fill-opacity", "0.001");
      hitbox.setAttribute("stroke", "none");
      group.appendChild(hitbox);
    }

    const shape = createEntityShape(node);
    applyEntityStyles(shape, node);
    group.appendChild(shape);

    if (node.crossedOut && node.type !== "individual") {
      group.appendChild(createCrossOverlay(node));
    }

    const title = document.createElementNS(svgNs, "text");
    title.classList.add("entity-text");
    title.setAttribute("x", BOX.width / 2);
    title.setAttribute("font-size", "16");
    title.setAttribute("font-weight", "600");
    title.setAttribute("text-anchor", "middle");
    const labelLines = wrapEntityLabel(node);
    let baseY =
      node.type === "individual"
        ? BOX.height + 20
        : hasJurisdictionDisplay(node)
          ? BOX.height / 2 - 6
          : BOX.height / 2 + 6;
    if (node.type === "partnership") {
      baseY += 18;
    }
    const lineHeight = 20;
    const firstLineY = baseY - ((labelLines.length - 1) * lineHeight) / 2;
    const lastLineY = firstLineY + (labelLines.length - 1) * lineHeight;
    labelLines.forEach((line, index) => {
      const tspan = document.createElementNS(svgNs, "tspan");
      tspan.setAttribute("x", BOX.width / 2);
      tspan.setAttribute("y", firstLineY + index * lineHeight);
      tspan.textContent = line;
      title.appendChild(tspan);
    });
    group.appendChild(title);

    renderJurisdiction(group, node, { lastLineY });

    canvas.appendChild(group);
  });

  if (state.marquee) {
    const marquee = document.createElementNS(svgNs, "rect");
    marquee.classList.add("selection-marquee");
    marquee.setAttribute("x", state.marquee.rect.x);
    marquee.setAttribute("y", state.marquee.rect.y);
    marquee.setAttribute("width", state.marquee.rect.width);
    marquee.setAttribute("height", state.marquee.rect.height);
    canvas.appendChild(marquee);
  }

  renderTransactionLegend();

}

function renderInspector() {
  const node = getSelectedNode();
  const edge = getSelectedEdge();
  const hasSelection = Boolean(node || edge || state.selectedNodeIds.length > 1);

  emptySelection.classList.toggle("hidden", hasSelection);
  entityForm.classList.toggle("hidden", !node);
  edgeForm.classList.toggle("hidden", !edge);

  if (node) {
    selectionType.textContent = "Entity selected";
    document.getElementById("entityLabel").value = node.label;
    document.getElementById("entityType").value = node.type;
    const jurisdictionDisplay = getJurisdictionDisplay(node);
    document.getElementById("entityJurisdiction").value =
      jurisdictionDisplay.mode === "custom" ? "__custom__" : jurisdictionDisplay.value;
    document.getElementById("entityJurisdictionCustom").value = jurisdictionDisplay.customText;
    document
      .getElementById("entityJurisdictionCustomGroup")
      .classList.toggle("hidden", jurisdictionDisplay.mode !== "custom");
    document.getElementById("entityLineStyle").value = node.lineStyle || "solid";
    document.getElementById("entityFill").value = node.fill || "none";
    document.getElementById("entityCrossedOut").checked = Boolean(node.crossedOut);
    document.getElementById("entityMultipleIndividuals").checked = Boolean(
      node.multipleIndividuals,
    );
    document.getElementById("entityInnerLineStyle").value = node.innerLineStyle || "solid";
    document.getElementById("entityInnerFill").value = node.innerFill || "none";
    document.getElementById("edgeBidirectionalGroup").classList.add("hidden");
    const isIndividual = node.type === "individual";
    const supportsInnerShape = ["dreg", "hybrid-partnership", "reverse-hybrid"].includes(
      node.type,
    );
    setGroupVisibility("entityLineStyleGroup", !isIndividual);
    setGroupVisibility("entityFillGroup", !isIndividual);
    setGroupVisibility("entityCrossedOutGroup", !isIndividual);
    setGroupVisibility("entityMultipleIndividualsGroup", isIndividual);
    setGroupVisibility("entityInnerLineStyleGroup", !isIndividual && supportsInnerShape);
    setGroupVisibility("entityInnerFillGroup", !isIndividual && supportsInnerShape);
  } else if (edge) {
    selectionType.textContent = "Relationship selected";
    document.getElementById("edgeLabel").value = edge.label;
    document.getElementById("edgePercent").value = edge.percent;
    document.getElementById("edgeKind").value = edge.kind;
    document.getElementById("edgeColor").value = edge.color || "black";
    document.getElementById("edgeLineStyle").value = edge.lineStyle || "solid";
    document.getElementById("edgeBidirectional").checked = Boolean(edge.bidirectional);
    document.getElementById("reverseEdge").disabled = edge.kind !== "transaction";
    document
      .getElementById("edgeBidirectionalGroup")
      .classList.toggle("hidden", edge.kind !== "transaction");
    document.getElementById("entityJurisdictionCustomGroup").classList.add("hidden");
    setGroupVisibility("entityLineStyleGroup", false);
    setGroupVisibility("entityFillGroup", false);
    setGroupVisibility("entityCrossedOutGroup", false);
    setGroupVisibility("entityMultipleIndividualsGroup", false);
    setGroupVisibility("entityInnerLineStyleGroup", false);
    setGroupVisibility("entityInnerFillGroup", false);
  } else {
    selectionType.textContent = "Nothing selected";
    document.getElementById("reverseEdge").disabled = true;
    document.getElementById("edgeBidirectionalGroup").classList.add("hidden");
    document.getElementById("entityJurisdictionCustomGroup").classList.add("hidden");
    setGroupVisibility("entityLineStyleGroup", false);
    setGroupVisibility("entityFillGroup", false);
    setGroupVisibility("entityCrossedOutGroup", false);
    setGroupVisibility("entityMultipleIndividualsGroup", false);
    setGroupVisibility("entityInnerLineStyleGroup", false);
    setGroupVisibility("entityInnerFillGroup", false);
  }

  if (!node && !edge && state.selectedNodeIds.length > 1) {
    selectionType.textContent = `${state.selectedNodeIds.length} entities selected`;
  }
}

function renderCanvasBackdrop() {
  const background = document.createElementNS(svgNs, "rect");
  background.classList.add("canvas-background");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", String(VIEWBOX.width));
  background.setAttribute("height", String(VIEWBOX.height));
  background.setAttribute("fill", "#fffaf5");
  background.setAttribute("pointer-events", "none");
  canvas.appendChild(background);

  const grid = document.createElementNS(svgNs, "rect");
  grid.classList.add("canvas-grid");
  grid.setAttribute("x", "0");
  grid.setAttribute("y", "0");
  grid.setAttribute("width", String(VIEWBOX.width));
  grid.setAttribute("height", String(VIEWBOX.height));
  grid.setAttribute("fill", "url(#canvasGridPattern)");
  grid.setAttribute("pointer-events", "none");
  canvas.appendChild(grid);
}

function setGroupVisibility(id, visible) {
  const element = document.getElementById(id);
  if (!element) return;
  element.classList.toggle("hidden", !visible);
  element.style.display = visible ? "" : "none";
}

function selectedNodeIdsInRect(rect) {
  return state.nodes
    .filter((node) => {
      const nodeLeft = node.x;
      const nodeTop = node.y;
      const nodeRight = node.x + BOX.width;
      const nodeBottom = node.y + BOX.height;
      return (
        nodeLeft >= rect.x &&
        nodeTop >= rect.y &&
        nodeRight <= rect.x + rect.width &&
        nodeBottom <= rect.y + rect.height
      );
    })
    .map((node) => node.id);
}

function hasJurisdictionDisplay(node) {
  const jurisdiction = getJurisdictionDisplay(node);
  return Boolean(jurisdiction.flag || jurisdiction.customText);
}

function getJurisdictionDisplay(node) {
  const normalizedValue = (node.jurisdiction || "").trim();
  const normalizedCustom = (node.jurisdictionCustom || "").trim();

  if (node.jurisdictionMode === "custom") {
    return {
      mode: "custom",
      value: "__custom__",
      flag: "",
      customText: normalizedCustom || normalizedValue,
    };
  }

  const matched = matchJurisdictionOption(normalizedValue);
  if (matched) {
    return {
      mode: "flag",
      value: matched.value,
      flag: matched.flag,
      customText: "",
    };
  }

  if (normalizedCustom || normalizedValue) {
    return {
      mode: "custom",
      value: "__custom__",
      flag: "",
      customText: normalizedCustom || normalizedValue,
    };
  }

  return {
    mode: "",
    value: "",
    flag: "",
    customText: "",
  };
}

function matchJurisdictionOption(value) {
  if (!value) return null;
  const lowered = value.toLowerCase();
  return (
    JURISDICTION_OPTIONS.find(
      (option) =>
        option.value &&
        option.value !== "__custom__" &&
        (option.value.toLowerCase() === lowered || option.label.toLowerCase() === lowered),
    ) || null
  );
}

function renderJurisdiction(group, node, layout = {}) {
  const jurisdiction = getJurisdictionDisplay(node);
  if (!jurisdiction.flag && !jurisdiction.customText) return;

  const text = document.createElementNS(svgNs, "text");
  text.classList.add("entity-jurisdiction");
  text.setAttribute("x", BOX.width / 2);
  const lastLineY = layout.lastLineY ?? (node.type === "individual" ? BOX.height + 20 : BOX.height / 2);
  text.setAttribute("y", lastLineY + 28);
  text.setAttribute("text-anchor", "middle");
  text.textContent = jurisdiction.flag || jurisdiction.customText;
  group.appendChild(text);
}

function wrapEntityLabel(node) {
  const words = String(node.label || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [node.label || ""];

  const maxChars = entityLabelMaxChars(node.type);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (!currentLine || candidate.length <= maxChars) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);

  if (lines.length === 1 && node.label.length > maxChars && words.length === 2) {
    return words;
  }

  return lines;
}

function entityLabelMaxChars(type) {
  if (type === "partnership") return 11;
  if (type === "trust") return 12;
  if (type === "individual") return 14;
  return 15;
}

function renderControls() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  const modeMap = {
    select: "Select",
    ownership: "Ownership Line",
    transaction: "Transaction Arrow",
  };
  const waitingText =
    state.pendingConnection && state.mode !== "select"
      ? ` Waiting for second entity.`
      : "";
  modeStatus.innerHTML = `Current mode: <strong>${modeMap[state.mode]}</strong>.${waitingText}`;
  document.getElementById("zoomLevel").textContent = `${Math.round(state.zoom * 100)}%`;
  document.getElementById("transactionLegendEnabled").checked = state.transactionLegend.enabled;
  document.getElementById("transactionLegendArrowEnd").value = state.transactionLegend.arrowEndText || "";
  document.getElementById("transactionLegendNonArrowEnd").value =
    state.transactionLegend.nonArrowEndText || "";
  document
    .getElementById("transactionLegendArrowEndGroup")
    .classList.toggle("hidden", !state.transactionLegend.enabled);
  document
    .getElementById("transactionLegendNonArrowEndGroup")
    .classList.toggle("hidden", !state.transactionLegend.enabled);
}

function setZoom(nextZoom) {
  const clamped = Math.max(0.5, Math.min(2, Math.round(nextZoom * 10) / 10));
  if (clamped === state.zoom) return;
  state.zoom = clamped;
  render();
}

function renderTransactionLegend() {
  if (!state.transactionLegend.enabled) return;
  const arrowText = (state.transactionLegend.arrowEndText || "").trim();
  const nonArrowText = (state.transactionLegend.nonArrowEndText || "").trim();
  if (!arrowText && !nonArrowText) return;

  const group = document.createElementNS(svgNs, "g");
  group.classList.add("transaction-legend");
  const boxX = state.transactionLegend.x || 70;
  const boxY = state.transactionLegend.y || 760;
  const boxWidth = 340;
  const boxHeight = 96;
  const startX = boxX + 20;
  const endX = boxX + boxWidth - 20;
  const y = boxY + 64;

  const hitbox = document.createElementNS(svgNs, "rect");
  hitbox.classList.add("legend-hitbox");
  hitbox.setAttribute("x", boxX);
  hitbox.setAttribute("y", boxY);
  hitbox.setAttribute("width", boxWidth);
  hitbox.setAttribute("height", boxHeight);
  group.appendChild(hitbox);

  const border = document.createElementNS(svgNs, "rect");
  border.classList.add("legend-box");
  border.setAttribute("x", boxX);
  border.setAttribute("y", boxY);
  border.setAttribute("width", boxWidth);
  border.setAttribute("height", boxHeight);
  group.appendChild(border);

  const title = document.createElementNS(svgNs, "text");
  title.classList.add("legend-title");
  title.setAttribute("x", boxX + 20);
  title.setAttribute("y", boxY + 24);
  title.textContent = "Legend";
  group.appendChild(title);

  const line = document.createElementNS(svgNs, "line");
  line.classList.add("legend-line");
  line.setAttribute("x1", startX);
  line.setAttribute("y1", y);
  line.setAttribute("x2", endX);
  line.setAttribute("y2", y);
  line.setAttribute("marker-end", "url(#transactionArrow-black)");
  group.appendChild(line);

  if (nonArrowText) {
    const leftText = document.createElementNS(svgNs, "text");
    leftText.classList.add("legend-label");
    leftText.setAttribute("x", startX);
    leftText.setAttribute("y", y - 10);
    leftText.setAttribute("text-anchor", "start");
    leftText.textContent = nonArrowText;
    group.appendChild(leftText);
  }

  if (arrowText) {
    const rightText = document.createElementNS(svgNs, "text");
    rightText.classList.add("legend-label");
    rightText.setAttribute("x", endX);
    rightText.setAttribute("y", y - 10);
    rightText.setAttribute("text-anchor", "end");
    rightText.textContent = arrowText;
    group.appendChild(rightText);
  }

  canvas.appendChild(group);
}

function getType(typeKey) {
  return ENTITY_TYPES.find((type) => type.key === typeKey) || ENTITY_TYPES[0];
}

function createRectangleShape() {
  const rect = document.createElementNS(svgNs, "rect");
  rect.classList.add("entity-rect");
  rect.dataset.shapeRole = "outer";
  rect.setAttribute("width", BOX.width);
  rect.setAttribute("height", BOX.height);
  rect.setAttribute("rx", 0);
  rect.setAttribute("fill", "#fffdf9");
  rect.setAttribute("stroke", "#514236");
  return rect;
}

function applyLineStyle(shape, lineStyle) {
  if (lineStyle === "dashed") {
    shape.setAttribute("stroke-dasharray", "9 6");
  } else {
    shape.removeAttribute("stroke-dasharray");
  }

  if (shape.children && shape.children.length) {
    Array.from(shape.children).forEach((child) => applyLineStyle(child, lineStyle));
  }
}

function applyEntityStyles(shape, node) {
  applyLineStyle(shape, node.lineStyle || "solid");
  const outerFill = node.fill === "shaded" ? "#e7e1d6" : "#fffdf9";

  const supportsInnerShape = ["dreg", "hybrid-partnership", "reverse-hybrid"].includes(
    node.type,
  );
  if (!supportsInnerShape || !shape.children || shape.children.length === 0) {
    if (shape.children && shape.children.length > 0) {
      Array.from(shape.children).forEach((child) => {
        if (child.tagName !== "line") {
          child.setAttribute("fill", outerFill);
        }
      });
    } else if (shape.tagName !== "line") {
      shape.setAttribute("fill", outerFill);
    }
    return;
  }

  Array.from(shape.children).forEach((child) => {
    if (child.dataset.shapeRole === "inner") {
      applyLineStyle(child, node.innerLineStyle || "solid");
      child.setAttribute("fill", node.innerFill === "shaded" ? "#e7e1d6" : "none");
    } else if (child.dataset.shapeRole === "outer") {
      applyLineStyle(child, node.lineStyle || "solid");
      if (child.tagName !== "line") {
        child.setAttribute("fill", outerFill);
      }
    }
  });
}

function createEntityShape(node) {
  const typeKey = typeof node === "string" ? node : node.type;
  if (typeKey === "individual") {
    return createIndividualShape(node);
  }

  if (typeKey === "trust") {
    return createTrustShape();
  }

  if (typeKey === "partnership") {
    return createTriangleShape();
  }

  const group = document.createElementNS(svgNs, "g");
  group.appendChild(createRectangleShape());

  if (typeKey === "dreg" || typeKey === "hybrid") {
    const oval = document.createElementNS(svgNs, "ellipse");
    oval.classList.add("entity-rect");
    oval.dataset.shapeRole = "inner";
    oval.setAttribute("cx", BOX.width / 2);
    oval.setAttribute("cy", BOX.height / 2);
    oval.setAttribute("rx", BOX.width / 2);
    oval.setAttribute("ry", BOX.height / 2);
    oval.setAttribute("fill", "none");
    oval.setAttribute("stroke", "#514236");
    group.appendChild(oval);
  }

  if (typeKey === "reverse-hybrid") {
    const triangle = document.createElementNS(svgNs, "polygon");
    triangle.classList.add("entity-rect");
    triangle.dataset.shapeRole = "inner";
    triangle.setAttribute(
      "points",
      `0,0 ${BOX.width},0 ${BOX.width / 2},${BOX.height}`,
    );
    triangle.setAttribute("fill", "none");
    triangle.setAttribute("stroke", "#514236");
    group.appendChild(triangle);
  }

  if (typeKey === "hybrid-partnership") {
    const triangle = document.createElementNS(svgNs, "polyline");
    triangle.classList.add("entity-rect");
    triangle.dataset.shapeRole = "inner";
    triangle.setAttribute(
      "points",
      `0,${BOX.height} ${BOX.width / 2},0 ${BOX.width},${BOX.height}`,
    );
    triangle.setAttribute("fill", "none");
    triangle.setAttribute("stroke", "#514236");
    group.appendChild(triangle);
  }

  return group;
}

function createTrustShape() {
  const ellipse = document.createElementNS(svgNs, "ellipse");
  ellipse.classList.add("entity-rect");
  ellipse.setAttribute("cx", BOX.width / 2);
  ellipse.setAttribute("cy", BOX.height / 2);
  ellipse.setAttribute("rx", BOX.width / 2);
  ellipse.setAttribute("ry", BOX.height / 2);
  ellipse.setAttribute("fill", "#fffdf9");
  ellipse.setAttribute("stroke", "#514236");
  return ellipse;
}

function createIndividualShape(node) {
  if (node?.multipleIndividuals) {
    return createMultipleIndividualsShape();
  }

  return createSingleIndividualShape();
}

function createSingleIndividualShape() {
  const group = document.createElementNS(svgNs, "g");
  addStickFigure(group, BOX.width / 2, 6, 1);
  return group;
}

function createMultipleIndividualsShape() {
  const group = document.createElementNS(svgNs, "g");
  addStickFigure(group, BOX.width / 2 - 24, 13, 0.78);
  addStickFigure(group, BOX.width / 2 + 24, 13, 0.78);
  addStickFigure(group, BOX.width / 2, 5, 0.95);
  return group;
}

function addStickFigure(group, centerX, topY, scale = 1) {
  const headRadius = 10 * scale;
  const headCy = topY + headRadius;
  const neckY = headCy + headRadius;
  const waistY = neckY + 20 * scale;
  const armHalfWidth = 18 * scale;
  const legOffset = 16 * scale;
  const footY = waistY + 18 * scale;

  const head = document.createElementNS(svgNs, "circle");
  head.classList.add("entity-rect", "individual-stroke");
  head.setAttribute("cx", centerX);
  head.setAttribute("cy", headCy);
  head.setAttribute("r", headRadius);
  head.setAttribute("fill", "none");
  head.setAttribute("stroke", "#514236");
  group.appendChild(head);

  const body = document.createElementNS(svgNs, "line");
  body.classList.add("entity-rect", "individual-stroke");
  body.setAttribute("x1", centerX);
  body.setAttribute("y1", neckY);
  body.setAttribute("x2", centerX);
  body.setAttribute("y2", waistY);
  body.setAttribute("stroke", "#514236");
  group.appendChild(body);

  const arms = document.createElementNS(svgNs, "line");
  arms.classList.add("entity-rect", "individual-stroke");
  arms.setAttribute("x1", centerX - armHalfWidth);
  arms.setAttribute("y1", neckY + 8 * scale);
  arms.setAttribute("x2", centerX + armHalfWidth);
  arms.setAttribute("y2", neckY + 8 * scale);
  arms.setAttribute("stroke", "#514236");
  group.appendChild(arms);

  const leftLeg = document.createElementNS(svgNs, "line");
  leftLeg.classList.add("entity-rect", "individual-stroke");
  leftLeg.setAttribute("x1", centerX);
  leftLeg.setAttribute("y1", waistY);
  leftLeg.setAttribute("x2", centerX - legOffset);
  leftLeg.setAttribute("y2", footY);
  leftLeg.setAttribute("stroke", "#514236");
  group.appendChild(leftLeg);

  const rightLeg = document.createElementNS(svgNs, "line");
  rightLeg.classList.add("entity-rect", "individual-stroke");
  rightLeg.setAttribute("x1", centerX);
  rightLeg.setAttribute("y1", waistY);
  rightLeg.setAttribute("x2", centerX + legOffset);
  rightLeg.setAttribute("y2", footY);
  rightLeg.setAttribute("stroke", "#514236");
  group.appendChild(rightLeg);
}

function createTriangleShape() {
  const polygon = document.createElementNS(svgNs, "polygon");
  polygon.classList.add("entity-rect");
  polygon.setAttribute(
    "points",
    `${BOX.width / 2},0 ${BOX.width},${BOX.height} 0,${BOX.height}`,
  );
  polygon.setAttribute("fill", "#fffdf9");
  polygon.setAttribute("stroke", "#514236");
  return polygon;
}

function createCrossOverlay(node) {
  const group = document.createElementNS(svgNs, "g");
  const overshootX = node.type === "partnership" ? 10 : 8;
  const overshootY = node.type === "trust" ? 10 : 8;

  const slashA = document.createElementNS(svgNs, "line");
  slashA.classList.add("entity-rect", "entity-cross-line");
  slashA.setAttribute("x1", -overshootX);
  slashA.setAttribute("y1", -overshootY);
  slashA.setAttribute("x2", BOX.width + overshootX);
  slashA.setAttribute("y2", BOX.height + overshootY);
  slashA.setAttribute("stroke", "#514236");
  slashA.setAttribute("stroke-dasharray", "10 7");
  slashA.setAttribute("stroke-linecap", "round");
  group.appendChild(slashA);

  const slashB = document.createElementNS(svgNs, "line");
  slashB.classList.add("entity-rect", "entity-cross-line");
  slashB.setAttribute("x1", BOX.width + overshootX);
  slashB.setAttribute("y1", -overshootY);
  slashB.setAttribute("x2", -overshootX);
  slashB.setAttribute("y2", BOX.height + overshootY);
  slashB.setAttribute("stroke", "#514236");
  slashB.setAttribute("stroke-dasharray", "10 7");
  slashB.setAttribute("stroke-linecap", "round");
  group.appendChild(slashB);
  return group;
}

function edgeColorValue(color) {
  if (color === "red") return "#b0392f";
  if (color === "blue") return "#245ea8";
  return "#1e1a17";
}

function isSelected(kind, id) {
  if (kind === "node") {
    return state.selectedNodeIds.includes(id) || (state.selection?.kind === kind && state.selection?.id === id);
  }
  return state.selection?.kind === kind && state.selection?.id === id;
}

function getSelectedNode() {
  if (state.selectedNodeIds.length > 1) return null;
  return state.selection?.kind === "node"
    ? state.nodes.find((node) => node.id === state.selection.id)
    : null;
}

function getSelectedEdge() {
  return state.selection?.kind === "edge"
    ? state.edges.find((edge) => edge.id === state.selection.id)
    : null;
}

function deleteSelectedEntity() {
  const idsToDelete =
    state.selectedNodeIds.length > 0
      ? new Set(state.selectedNodeIds)
      : getSelectedNode()
        ? new Set([getSelectedNode().id])
        : null;
  if (!idsToDelete || idsToDelete.size === 0) return;
  state.nodes = state.nodes.filter((candidate) => !idsToDelete.has(candidate.id));
  state.edges = state.edges.filter(
    (edge) => !idsToDelete.has(edge.from) && !idsToDelete.has(edge.to),
  );
  state.selectedNodeIds = [];
  state.selection = null;
  render();
}

function deleteSelectedEdge() {
  const edge = getSelectedEdge();
  if (!edge) return;
  state.edges = state.edges.filter((candidate) => candidate.id !== edge.id);
  state.selectedNodeIds = [];
  state.selection = null;
  render();
}

function reverseSelectedEdge() {
  const edge = getSelectedEdge();
  if (!edge || edge.kind !== "transaction") return;
  const originalFrom = edge.from;
  edge.from = edge.to;
  edge.to = originalFrom;
  render();
}

function clearBoard() {
  state.nodes = [];
  state.edges = [];
  state.workspaceWidth = MIN_WORKSPACE_WIDTH;
  state.workspaceHeight = MIN_WORKSPACE_HEIGHT;
  state.transactionLegend = {
    enabled: false,
    arrowEndText: "",
    nonArrowEndText: "",
    x: 70,
    y: 760,
  };
  state.selection = null;
  state.selectedNodeIds = [];
  state.pendingConnection = null;
  state.legendDrag = null;
  state.pan = null;
  state.marquee = null;
  state.nextNodeId = 1;
  state.nextEdgeId = 1;
  render();
}

function handleCanvasBlankClick(event) {
  if (event.target === canvas && state.mode === "select") {
    if (state.suppressBlankClick) {
      state.suppressBlankClick = false;
      return;
    }
    state.selectedNodeIds = [];
    state.selection = null;
    render();
  }
}

function handleCanvasMouseDown(event) {
  const legendGroup = event.target.closest(".transaction-legend");
  if (legendGroup) {
    event.preventDefault();
    event.stopPropagation();
    const point = svgPoint(event);
    state.legendDrag = {
      offsetX: point.x - state.transactionLegend.x,
      offsetY: point.y - state.transactionLegend.y,
    };
    return;
  }

  if (state.mode === "select" && event.target === canvas) {
    if (event.shiftKey) {
      const point = svgPoint(event);
      state.marquee = {
        start: point,
        rect: { x: point.x, y: point.y, width: 0, height: 0 },
        moved: false,
      };
      state.selection = null;
      state.selectedNodeIds = [];
      render();
    } else {
      const hadMultiSelection = state.selectedNodeIds.length > 1;
      state.selectedNodeIds = [];
      state.selection = null;
      if (hadMultiSelection) {
        render();
      }
      event.preventDefault();
      state.pan = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startScrollLeft: canvasCard.scrollLeft,
        startScrollTop: canvasCard.scrollTop,
        moved: false,
      };
      canvasCard.classList.add("panning");
    }
    return;
  }

  const labelGroup = event.target.closest(".ownership-label-group");
  if (labelGroup) {
    event.preventDefault();
    event.stopPropagation();
    const edgeId = labelGroup.dataset.edgeId;
    const edge = state.edges.find((candidate) => candidate.id === edgeId);
    if (!edge) return;
    const from = state.nodes.find((node) => node.id === edge.from);
    const to = state.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const ownershipBranchLevels = buildOwnershipBranchLevels();
    const geometry = ownershipGeometry(edge, from, to, ownershipBranchLevels);
    const point = svgPoint(event);
    state.labelDrag = {
      edgeId,
      moved: false,
      startLabelPlacement: edge.labelPlacement
        ? { ...edge.labelPlacement }
        : null,
      startProjection: closestOwnershipLabelPlacement(point, geometry),
    };
    state.selection = { kind: "edge", id: edge.id };
    render();
    return;
  }

  const edgeGroup = event.target.closest(".edge.transaction");
  if (edgeGroup) {
    event.preventDefault();
    const edgeId = edgeGroup.dataset.edgeId;
    const edge = state.edges.find((candidate) => candidate.id === edgeId);
    if (!edge) return;
    state.selection = { kind: "edge", id: edge.id };
    const from = state.nodes.find((node) => node.id === edge.from);
    const to = state.nodes.find((node) => node.id === edge.to);
    if (!from || !to) {
      render();
      return;
    }
    const point = svgPoint(event);
    const axis = transactionOffsetAxis(from, to);
    state.edgeDrag = {
      edgeId,
      startOffset: edge.curveOffset || 0,
      startProjection: projectPointToAxis(point, axis),
      moved: false,
    };
    render();
    return;
  }

  const group = event.target.closest(".entity-box");
  if (!group) return;
  event.preventDefault();

  const nodeId = group.dataset.nodeId;
  const node = state.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return;

  const point = svgPoint(event);
  const dragNodeIds =
    state.mode === "select" && state.selectedNodeIds.length > 1 && state.selectedNodeIds.includes(nodeId)
      ? [...state.selectedNodeIds]
      : [nodeId];

  if (state.mode === "select" && dragNodeIds.length === 1 && !state.selectedNodeIds.includes(nodeId)) {
    state.selectedNodeIds = [nodeId];
    state.selection = { kind: "node", id: nodeId };
  }

  state.drag = {
    nodeId,
    nodeIds: dragNodeIds,
    startPoint: point,
    origins: dragNodeIds.map((id) => {
      const dragNode = state.nodes.find((candidate) => candidate.id === id);
      return { id, x: dragNode.x, y: dragNode.y };
    }),
    startX: node.x,
    startY: node.y,
    moved: false,
  };
}

function handleCanvasMouseMove(event) {
  syncCanvasMetrics();

  if (state.pan) {
    const deltaX = event.clientX - state.pan.startClientX;
    const deltaY = event.clientY - state.pan.startClientY;
    canvasCard.scrollLeft = state.pan.startScrollLeft - deltaX;
    canvasCard.scrollTop = state.pan.startScrollTop - deltaY;
    state.pan.moved = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;
    return;
  }

  if (state.legendDrag) {
    const LEGEND_BOX = { width: 340, height: 96 };
    const point = svgPoint(event);
    state.transactionLegend.x = clampLegendPosition(
      point.x - state.legendDrag.offsetX,
      LEGEND_BOX.width,
      VIEWBOX.width,
    );
    state.transactionLegend.y = clampLegendPosition(
      point.y - state.legendDrag.offsetY,
      LEGEND_BOX.height,
      VIEWBOX.height,
    );
    render();
    return;
  }

  if (state.marquee) {
    const point = svgPoint(event);
    const x = Math.min(state.marquee.start.x, point.x);
    const y = Math.min(state.marquee.start.y, point.y);
    const width = Math.abs(point.x - state.marquee.start.x);
    const height = Math.abs(point.y - state.marquee.start.y);
    state.marquee.rect = { x, y, width, height };
    state.marquee.moved = width > 3 || height > 3;
    state.selectedNodeIds = selectedNodeIdsInRect(state.marquee.rect);
    state.selection =
      state.selectedNodeIds.length === 1
        ? { kind: "node", id: state.selectedNodeIds[0] }
        : null;
    render();
    return;
  }

  if (state.labelDrag) {
    const edge = state.edges.find((candidate) => candidate.id === state.labelDrag.edgeId);
    if (!edge) return;
    const from = state.nodes.find((node) => node.id === edge.from);
    const to = state.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const ownershipBranchLevels = buildOwnershipBranchLevels();
    const geometry = ownershipGeometry(edge, from, to, ownershipBranchLevels);
    const point = svgPoint(event);
    const placement = closestOwnershipLabelPlacement(point, geometry);
    if (placement) {
      edge.labelPlacement = placement;
      state.labelDrag.moved =
        !state.labelDrag.startProjection ||
        placement.segmentIndex !== state.labelDrag.startProjection.segmentIndex ||
        Math.abs(placement.t - state.labelDrag.startProjection.t) > 0.01;
      render();
    }
    return;
  }

  if (state.edgeDrag) {
    const edge = state.edges.find((candidate) => candidate.id === state.edgeDrag.edgeId);
    if (!edge) return;
    const from = state.nodes.find((node) => node.id === edge.from);
    const to = state.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const point = svgPoint(event);
    const axis = transactionOffsetAxis(from, to);
    const currentProjection = projectPointToAxis(point, axis);
    edge.curveOffset = state.edgeDrag.startOffset + (currentProjection - state.edgeDrag.startProjection);
    state.edgeDrag.moved = Math.abs(edge.curveOffset - state.edgeDrag.startOffset) > 3;
    render();
    return;
  }

  if (!state.drag) return;
  const point = svgPoint(event);
  const deltaX = point.x - state.drag.startPoint.x;
  const deltaY = point.y - state.drag.startPoint.y;
  const primaryOrigin = state.drag.origins.find((item) => item.id === state.drag.nodeId);
  if (!primaryOrigin) return;
  const snappedDeltaX = snapToGrid(primaryOrigin.x + deltaX) - primaryOrigin.x;
  const snappedDeltaY = snapToGrid(primaryOrigin.y + deltaY) - primaryOrigin.y;
  state.drag.origins.forEach((origin) => {
    const dragNode = state.nodes.find((candidate) => candidate.id === origin.id);
    if (!dragNode) return;
    dragNode.x = Math.max(20, origin.x + snappedDeltaX);
    dragNode.y = Math.max(20, origin.y + snappedDeltaY);
  });
  const movedX = Math.abs(snappedDeltaX);
  const movedY = Math.abs(snappedDeltaY);
  state.drag.moved = movedX > 3 || movedY > 3;
  render();
}

function handleCanvasMouseUp() {
  if (state.pan) {
    state.suppressBlankClick = state.pan.moved;
    state.pan = null;
    canvasCard.classList.remove("panning");
    return;
  }

  if (state.legendDrag) {
    state.legendDrag = null;
    render();
    return;
  }

  if (state.marquee) {
    const moved = state.marquee.moved;
    if (!moved) {
      state.selectedNodeIds = [];
      state.selection = null;
    } else if (state.selectedNodeIds.length === 1) {
      state.selection = { kind: "node", id: state.selectedNodeIds[0] };
    } else {
      state.selection = null;
    }
    state.suppressBlankClick = moved;
    state.marquee = null;
    render();
    return;
  }

  if (state.labelDrag) {
    const edgeId = state.labelDrag.edgeId;
    state.labelDrag = null;
    state.selection = { kind: "edge", id: edgeId };
    render();
    return;
  }

  if (state.edgeDrag) {
    const edgeId = state.edgeDrag.edgeId;
    state.edgeDrag = null;
    state.selection = { kind: "edge", id: edgeId };
    render();
    return;
  }

  if (!state.drag) return;
  const nodeId = state.drag.nodeId;
  const moved = state.drag.moved;
  if (state.drag.moved) {
    state.suppressClickNodeId = state.drag.nodeId;
  }
  state.drag = null;
  if (!moved) {
    selectNode(nodeId);
    return;
  }
  render();
}

function handleKeyDown(event) {
  if (event.key !== "Delete" && event.key !== "Backspace") return;

  const target = event.target;
  const isEditingField =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable;

  if (isEditingField) return;

  if (state.selection?.kind === "node") {
    event.preventDefault();
    deleteSelectedEntity();
    return;
  }

  if (state.selection?.kind === "edge") {
    event.preventDefault();
    deleteSelectedEdge();
  }
}

function svgPoint(event) {
  const point = canvas.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(canvas.getScreenCTM().inverse());
}

function snapToGrid(value) {
  const snapped = Math.round(value / GRID) * GRID;
  return Math.abs(snapped - value) <= SNAP_THRESHOLD ? snapped : value;
}

function connectionPoint(source, target) {
  const sourceCenter = {
    x: source.x + BOX.width / 2,
    y: source.y + BOX.height / 2,
  };
  const targetCenter = {
    x: target.x + BOX.width / 2,
    y: target.y + BOX.height / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x: dx > 0 ? source.x + BOX.width : source.x,
      y: sourceCenter.y,
    };
  }

  return {
    x: sourceCenter.x,
    y: dy > 0 ? source.y + BOX.height : source.y,
  };
}

function transactionGeometry(edge, from, to, ownershipSegments) {
  const candidates = [];
  const fromAnchors = sideAnchors(from, edge, "from");
  const toAnchors = sideAnchors(to, edge, "to");
  const siblingOffset = transactionSiblingOffset(edge) + (edge.curveOffset || 0);
  const obstacleNodes = state.nodes.map((node) => ({
    node,
    role:
      node.id === from.id
        ? "from"
        : node.id === to.id
          ? "to"
          : "other",
  }));
  const bendVariants = [0, -36, 36, -72, 72, -108, 108];
  const preferredSides = edge.routeSides || null;

  fromAnchors.forEach((fromAnchor) => {
    toAnchors.forEach((toAnchor) => {
      bendVariants.forEach((bendBias) => {
        const candidate = buildTransactionCandidate(
          edge,
          fromAnchor,
          toAnchor,
          ownershipSegments,
          siblingOffset,
          obstacleNodes,
          preferredSides,
          bendBias,
        );
        if (candidate) candidates.push(candidate);
      });
    });
  });

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0] || fallbackTransactionGeometry(from, to);
  if (best.fromSide && best.toSide) {
    edge.routeSides = { from: best.fromSide, to: best.toSide };
  }
  return best;
}

function fallbackTransactionGeometry(from, to) {
  const fromCenter = { x: from.x + BOX.width / 2, y: from.y + BOX.height / 2 };
  const toCenter = { x: to.x + BOX.width / 2, y: to.y + BOX.height / 2 };
  return {
    path: `M ${fromCenter.x} ${fromCenter.y} C ${fromCenter.x + 60} ${fromCenter.y}, ${toCenter.x - 60} ${toCenter.y}, ${toCenter.x} ${toCenter.y}`,
    label: { x: (fromCenter.x + toCenter.x) / 2, y: (fromCenter.y + toCenter.y) / 2 - 16 },
  };
}

function transactionSiblingOffset(edge) {
  const siblings = state.edges.filter((candidate) => {
    if (candidate.kind !== "transaction") return false;
    const sameDirection = candidate.from === edge.from && candidate.to === edge.to;
    const oppositeDirection = candidate.from === edge.to && candidate.to === edge.from;
    return sameDirection || oppositeDirection;
  });

  siblings.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const index = siblings.findIndex((candidate) => candidate.id === edge.id);
  if (index === -1) return 0;

  const spacing = 30;
  const centeredIndex = index - (siblings.length - 1) / 2;
  return centeredIndex * spacing;
}

function sideAnchors(node, edge, role) {
  const cx = node.x + BOX.width / 2;
  const cy = node.y + BOX.height / 2;
  const leftOffset = transactionSideSpread(node, edge, role, "left");
  const rightOffset = transactionSideSpread(node, edge, role, "right");
  return [
    { side: "left", point: { x: node.x, y: cy + leftOffset }, outward: { x: -1, y: 0 } },
    { side: "right", point: { x: node.x + BOX.width, y: cy + rightOffset }, outward: { x: 1, y: 0 } },
  ];
}

function transactionSideSpread(node, edge, role, side) {
  const counterpartId = role === "from" ? edge.to : edge.from;
  const counterpart = state.nodes.find((item) => item.id === counterpartId);
  if (!counterpart) return 0;

  const centerX = node.x + BOX.width / 2;
  const counterpartCenterX = counterpart.x + BOX.width / 2;
  const preferredSide = counterpartCenterX < centerX ? "left" : "right";
  if (preferredSide !== side) return 0;

  const filtered = state.edges.filter((candidate) => {
    if (candidate.kind !== "transaction") return false;
    return (
      (candidate.from === edge.from && candidate.to === edge.to) ||
      (candidate.from === edge.to && candidate.to === edge.from)
    );
  });

  filtered.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const index = filtered.findIndex((candidate) => candidate.id === edge.id);
  if (index === -1) return 0;

  const spacing = 24;
  const centeredIndex = index - (filtered.length - 1) / 2;
  return centeredIndex * spacing;
}

function buildTransactionCandidate(
  edge,
  fromAnchor,
  toAnchor,
  ownershipSegments,
  siblingOffset,
  obstacleNodes,
  preferredSides,
  bendBias = 0,
) {
  const dx = toAnchor.point.x - fromAnchor.point.x;
  const dy = toAnchor.point.y - fromAnchor.point.y;
  const controlDistance = Math.max(40, Math.min(84, Math.hypot(dx, dy) * 0.24));
  const normalLength = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / normalLength, y: dx / normalLength };
  const totalBend = Math.max(-140, Math.min(140, siblingOffset + bendBias));
  const offsetVector = { x: normal.x * totalBend, y: normal.y * totalBend };
  const startPoint = {
    x: fromAnchor.point.x,
    y: fromAnchor.point.y,
  };
  const endPoint = {
    x: toAnchor.point.x,
    y: toAnchor.point.y,
  };
  const c1 = {
    x: startPoint.x + fromAnchor.outward.x * controlDistance + offsetVector.x,
    y: startPoint.y + fromAnchor.outward.y * controlDistance + offsetVector.y,
  };
  const c2 = {
    x: endPoint.x + toAnchor.outward.x * controlDistance + offsetVector.x,
    y: endPoint.y + toAnchor.outward.y * controlDistance + offsetVector.y,
  };
  const samples = sampleBezier(startPoint, c1, c2, endPoint, 24);
  const intersections = countIntersections(samples, ownershipSegments);
  const sameSidePenalty = fromAnchor.side === toAnchor.side ? 0 : 18;
  const routeSidePenalty =
    preferredSides &&
    (preferredSides.from !== fromAnchor.side || preferredSides.to !== toAnchor.side)
      ? 300
      : 0;
  const ownershipProximityPenalty = proximityPenalty(samples, ownershipSegments);
  const nodeIntersections = countEntityIntersections(samples, obstacleNodes);
  const nodeProximityPenalty = entityProximityPenalty(samples, obstacleNodes);
  const labelIndex = transactionLabelSampleIndex(edge, samples);
  const labelPoint = samples[labelIndex];
  const score =
    intersections * 5000 +
    nodeIntersections * 12000 +
    ownershipProximityPenalty * 8 +
    nodeProximityPenalty * 18 +
    sameSidePenalty +
    routeSidePenalty +
    Math.abs(totalBend) * 2.2 +
    Math.abs(bendBias) * 1.2 +
    Math.hypot(dx, dy);

  return {
    score,
    path: `M ${startPoint.x} ${startPoint.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${endPoint.x} ${endPoint.y}`,
    fromSide: fromAnchor.side,
    toSide: toAnchor.side,
    label: {
      x: labelPoint.x,
      y: labelPoint.y - 14,
    },
  };
}

function transactionLabelSampleIndex(edge, samples) {
  const siblings = state.edges.filter((candidate) => {
    if (candidate.kind !== "transaction") return false;
    const sameDirection = candidate.from === edge.from && candidate.to === edge.to;
    const oppositeDirection = candidate.from === edge.to && candidate.to === edge.from;
    return sameDirection || oppositeDirection;
  });

  siblings.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const index = siblings.findIndex((candidate) => candidate.id === edge.id);
  const centeredIndex = index === -1 ? 0 : index - (siblings.length - 1) / 2;
  const ratio = Math.max(0.25, Math.min(0.75, 0.5 + centeredIndex * 0.12));
  return Math.max(2, Math.min(samples.length - 3, Math.round((samples.length - 1) * ratio)));
}

function transactionOffsetAxis(from, to) {
  const start = { x: from.x + BOX.width / 2, y: from.y + BOX.height / 2 };
  const end = { x: to.x + BOX.width / 2, y: to.y + BOX.height / 2 };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    origin: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    },
    normal: {
      x: -dy / length,
      y: dx / length,
    },
  };
}

function projectPointToAxis(point, axis) {
  return (
    (point.x - axis.origin.x) * axis.normal.x +
    (point.y - axis.origin.y) * axis.normal.y
  );
}

function buildOwnershipBranchLevels() {
  const levels = new Map();
  const grouped = new Map();

  state.edges
    .filter((edge) => edge.kind === "ownership")
    .forEach((edge) => {
      const nodes = getOwnershipRenderNodes(edge);
      if (!nodes) return;
      if (!grouped.has(nodes.parent.id)) {
        grouped.set(nodes.parent.id, []);
      }
      grouped.get(nodes.parent.id).push(nodes.child);
    });

  grouped.forEach((children, parentId) => {
    const parent = state.nodes.find((node) => node.id === parentId);
    if (!parent || children.length === 0) return;

    const lowerTierChildren = children.filter((child) => child.y > parent.y);
    if (lowerTierChildren.length === 0) return;

    const startY = ownershipParentStartY(parent);
    const nearestChildTop = Math.min(...lowerTierChildren.map((child) => child.y));
    const branchY = startY + (nearestChildTop - startY) / 2;
    levels.set(parentId, branchY);
  });

  return levels;
}

function buildOwnershipSegments(ownershipBranchLevels) {
  const segments = [];
  state.edges
    .filter((edge) => edge.kind === "ownership")
    .forEach((edge) => {
      const nodes = getOwnershipRenderNodes(edge);
      if (!nodes) return;
      const geometry = ownershipGeometry(edge, nodes.parent, nodes.child, ownershipBranchLevels);
      const points = pathToPoints(geometry.path);
      for (let index = 0; index < points.length - 1; index += 1) {
        segments.push([points[index], points[index + 1]]);
      }
    });
  return segments;
}

function ownershipGeometry(edge, from, to, ownershipBranchLevels) {
  const renderNodes = getOwnershipRenderNodes(edge, from, to);
  if (!renderNodes) {
    return fallbackTransactionGeometry(from, to);
  }

  const parent = renderNodes.parent;
  const child = renderNodes.child;
  const start = {
    x: parent.x + BOX.width / 2,
    y: ownershipParentStartY(parent),
  };
  const end = {
    x: child.x + BOX.width / 2,
    y: child.y,
  };

  const midY =
    ownershipBranchLevels.get(parent.id) ?? start.y + (end.y - start.y) / 2;
  const points = [
    start,
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    end,
  ];

  const path = [
    `M ${start.x} ${start.y}`,
    `L ${start.x} ${midY}`,
    `L ${end.x} ${midY}`,
    `L ${end.x} ${end.y}`,
  ].join(" ");

  const incomingParentCount = countOwnershipParentsForChild(child.id);
  const placeLabelOnParentBranch = incomingParentCount > 1;
  const parentBranchDirection = start.x <= end.x ? -1 : 1;
  const childBranchDirection = end.x <= start.x ? -1 : 1;

  const defaultPlacement = placeLabelOnParentBranch
    ? { segmentIndex: 0, t: labelTForSegment(points[0], points[1]), side: parentBranchDirection }
    : { segmentIndex: 2, t: labelTForSegment(points[2], points[3]), side: childBranchDirection };
  const placement = edge.labelPlacement || defaultPlacement;

  return {
    path,
    points,
    label: ownershipLabelPosition(placement, points, {
      parentBranchDirection,
      childBranchDirection,
      placeLabelOnParentBranch,
    }),
  };
}

function ownershipParentStartY(node) {
  if (node.type !== "individual") {
    return node.y + BOX.height;
  }

  const labelLines = wrapEntityLabel(node);
  const lineHeight = 20;
  const baseY = BOX.height + 20;
  const firstLineY = baseY - ((labelLines.length - 1) * lineHeight) / 2;
  const lastLineY = firstLineY + (labelLines.length - 1) * lineHeight;
  const jurisdiction = getJurisdictionDisplay(node);
  const lowerTextY =
    jurisdiction.flag || jurisdiction.customText
      ? lastLineY + 28
      : lastLineY;

  return node.y + lowerTextY + 8;
}

function getOwnershipRenderNodes(edge, fromNode = null, toNode = null) {
  const from = fromNode || state.nodes.find((node) => node.id === edge.from);
  const to = toNode || state.nodes.find((node) => node.id === edge.to);
  if (!from || !to) return null;

  if (edge.preserveDirection) {
    return { parent: from, child: to };
  }

  const fromCenterY = from.y + BOX.height / 2;
  const toCenterY = to.y + BOX.height / 2;

  if (fromCenterY < toCenterY) {
    return { parent: from, child: to };
  }

  if (toCenterY < fromCenterY) {
    return { parent: to, child: from };
  }

  return from.x <= to.x
    ? { parent: from, child: to }
    : { parent: to, child: from };
}

function countOwnershipParentsForChild(childId) {
  let count = 0;
  state.edges
    .filter((edge) => edge.kind === "ownership")
    .forEach((edge) => {
      const nodes = getOwnershipRenderNodes(edge);
      if (nodes && nodes.child.id === childId) {
        count += 1;
      }
    });
  return count;
}

function labelTForSegment(start, end) {
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  if (length === 0) return 0.5;
  const preferredDistance = Math.min(32, length / 2);
  return Math.max(0.15, Math.min(0.85, preferredDistance / length));
}

function ownershipLabelPosition(placement, points, directions) {
  const maxSegmentIndex = Math.max(0, points.length - 2);
  const segmentIndex = Math.max(0, Math.min(maxSegmentIndex, placement.segmentIndex ?? 0));
  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];
  const t = Math.max(0, Math.min(1, placement.t ?? 0.5));
  const point = {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };

  if (Math.abs(end.x - start.x) < 1) {
    const defaultSide =
      segmentIndex === 0
        ? directions.parentBranchDirection
        : directions.childBranchDirection;
    const branchDirection = placement.side || defaultSide;
    let labelY = point.y;

    if (segmentIndex === 0 && point.y < start.y + 28) {
      labelY += 10;
    }

    if (segmentIndex !== 0 && point.y > end.y - 28) {
      labelY -= 10;
    }

    return {
      x: point.x + branchDirection * 16,
      y: labelY,
      anchor: branchDirection < 0 ? "end" : "start",
    };
  }

  const verticalDirection = placement.side || -1;
  return {
    x: point.x,
    y: point.y + verticalDirection * 20,
    anchor: "middle",
  };
}

function closestOwnershipLabelPlacement(point, geometry) {
  if (!geometry?.points || geometry.points.length < 2) return null;

  let best = null;
  for (let index = 0; index < geometry.points.length - 1; index += 1) {
    const start = geometry.points[index];
    const end = geometry.points[index + 1];
    const projection = projectPointToSegment(point, start, end);
    if (!best || projection.distance < best.distance) {
      const projectedPoint = projection.point;
      const isVertical = Math.abs(end.x - start.x) < 1;
      const side = isVertical
        ? point.x < projectedPoint.x
          ? -1
          : 1
        : point.y < projectedPoint.y
          ? -1
          : 1;
      best = {
        segmentIndex: index,
        t: projection.t,
        side,
        distance: projection.distance,
      };
    }
  }

  return best
    ? {
        segmentIndex: best.segmentIndex,
        t: best.t,
        side: best.side,
      }
    : null;
}

function projectPointToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return {
      t: 0,
      point: { ...start },
      distance: Math.hypot(point.x - start.x, point.y - start.y),
    };
  }

  const rawT = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  const projectedPoint = {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };
  return {
    t,
    point: projectedPoint,
    distance: Math.hypot(point.x - projectedPoint.x, point.y - projectedPoint.y),
  };
}


function pathToPoints(path) {
  return path
    .replace(/M/g, "")
    .split("L")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [x, y] = part.split(/\s+/).map(Number);
      return { x, y };
    });
}

function sampleBezier(p0, p1, p2, p3, steps) {
  const points = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const mt = 1 - t;
    points.push({
      x:
        mt * mt * mt * p0.x +
        3 * mt * mt * t * p1.x +
        3 * mt * t * t * p2.x +
        t * t * t * p3.x,
      y:
        mt * mt * mt * p0.y +
        3 * mt * mt * t * p1.y +
        3 * mt * t * t * p2.y +
        t * t * t * p3.y,
    });
  }
  return points;
}

function countIntersections(curvePoints, ownershipSegments) {
  let count = 0;
  for (let index = 0; index < curvePoints.length - 1; index += 1) {
    const a1 = curvePoints[index];
    const a2 = curvePoints[index + 1];
    ownershipSegments.forEach(([b1, b2]) => {
      if (segmentsIntersect(a1, a2, b1, b2)) {
        count += 1;
      }
    });
  }
  return count;
}

function proximityPenalty(curvePoints, ownershipSegments) {
  let penalty = 0;
  curvePoints.forEach((point) => {
    ownershipSegments.forEach(([a, b]) => {
      const distance = pointToSegmentDistance(point, a, b);
      if (distance < 24) {
        penalty += 24 - distance;
      }
    });
  });
  return penalty;
}

function countEntityIntersections(curvePoints, nodes) {
  let count = 0;
  curvePoints.forEach((point, index) => {
    nodes.forEach(({ node, role }) => {
      if (shouldIgnoreEndpointSample(index, curvePoints.length, role)) return;
      if (pointInsideNodeBounds(point, node, 14)) {
        count += 1;
      }
    });
  });
  return count;
}

function entityProximityPenalty(curvePoints, nodes) {
  let penalty = 0;
  curvePoints.forEach((point, index) => {
    nodes.forEach(({ node, role }) => {
      if (shouldIgnoreEndpointSample(index, curvePoints.length, role)) return;
      const distance = pointToNodeBoundsDistance(point, node, 14);
      if (distance < 30) {
        penalty += 30 - distance;
      }
    });
  });
  return penalty;
}

function shouldIgnoreEndpointSample(index, total, role) {
  if (role === "from") {
    return index <= 3;
  }
  if (role === "to") {
    return index >= total - 4;
  }
  return false;
}

function pointInsideNodeBounds(point, node, padding = 0) {
  return (
    point.x >= node.x - padding &&
    point.x <= node.x + BOX.width + padding &&
    point.y >= node.y - padding &&
    point.y <= node.y + BOX.height + padding
  );
}

function pointToNodeBoundsDistance(point, node, padding = 0) {
  const left = node.x - padding;
  const right = node.x + BOX.width + padding;
  const top = node.y - padding;
  const bottom = node.y + BOX.height + padding;

  const dx = Math.max(left - point.x, 0, point.x - right);
  const dy = Math.max(top - point.y, 0, point.y - bottom);
  return Math.hypot(dx, dy);
}

function pointToSegmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - a.x, point.y - a.y);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)),
  );
  const projection = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function segmentsIntersect(p1, p2, p3, p4) {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return false;
}

function direction(pi, pj, pk) {
  return (pk.x - pi.x) * (pj.y - pi.y) - (pj.x - pi.x) * (pk.y - pi.y);
}

function generateFromNarrative(options = {}) {
  const text = narrativeInput.value.trim();
  if (!text) return;

  const mode = options.mode || "replace";
  const existingNodeIds = new Set(state.nodes.map((node) => node.id));
  if (mode === "replace") {
    clearBoard();
  }

  const entityMap = buildNarrativeEntityMap();
  const context = {
    recentEntities: [],
    pendingOwnerTarget: null,
    pendingNamedEntity: null,
  };
  const statements = text
    .split(/[.;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  statements
    .flatMap(expandNarrativeStatement)
    .forEach((statement) => parseStatement(statement, entityMap, context));
  if (mode === "replace") {
    layoutNarrativeDiagram();
  } else {
    placeNarrativeAdditions(existingNodeIds);
  }
  render();
}

function expandNarrativeStatement(statement) {
  return statement
    .split(
      /\s+and\s+(?=(?:it|they|the other|\w+\s+owns|\w+\s+is)\b)|,\s*(?=(?:call|name|label|rename|change|remove|delete|add|create)\b)/i,
    )
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseStatement(statement, entityMap, context) {
  const addSubsidiaryMatch = statement.match(
    /^(?:add|create)\s+(?:a|an)\s+subsidiary\s+(?:under|beneath|below|of)\s+(.+)$/i,
  );
  if (addSubsidiaryMatch) {
    const parent = resolveEntityReference(addSubsidiaryMatch[1], entityMap, context);
    const subsidiary = createNarrativePlaceholderEntity("corporation", "Subsidiary", entityMap);
    createEdge(parent.id, subsidiary.id, "ownership", {
      preserveDirection: true,
    });
    context.pendingNamedEntity = subsidiary;
    context.recentEntities = [subsidiary, parent];
    return;
  }

  const createOwnerMatch = statement.match(
    /^(?:add|create)\s+(?:a|an)\s+new\s+owner\s+of\s+(.+?)\s+(?:called|named)\s+(.+)$/i,
  );
  if (createOwnerMatch) {
    const owned = resolveEntityReference(createOwnerMatch[1], entityMap, context);
    const ownerDescriptor = parseNarrativeEntityDescriptor(createOwnerMatch[2], "corporation");
    const owner = createNarrativeEntity(
      ownerDescriptor.typeKey,
      ownerDescriptor.label || `Owner ${state.nextNodeId}`,
      entityMap,
    );
    createEdge(owner.id, owned.id, "ownership", {
      preserveDirection: true,
    });
    context.pendingOwnerTarget = owned;
    context.pendingNamedEntity = owner;
    context.recentEntities = [owner, owned];
    return;
  }

  const createOwnerWithoutNameMatch = statement.match(
    /^(?:add|create)\s+(?:a|an)\s+new\s+owner\s+of\s+(.+)$/i,
  );
  if (createOwnerWithoutNameMatch) {
    const owned = resolveEntityReference(createOwnerWithoutNameMatch[1], entityMap, context);
    const owner = createNarrativePlaceholderEntity("corporation", "Owner", entityMap);
    createEdge(owner.id, owned.id, "ownership", {
      preserveDirection: true,
    });
    context.pendingOwnerTarget = owned;
    context.pendingNamedEntity = owner;
    context.recentEntities = [owner, owned];
    return;
  }

  const callPendingEntityMatch = statement.match(
    /^(?:call|name|label)\s+(that subsidiary|this subsidiary|the subsidiary|that owner|this owner|the owner|it)\s+["“]?([^"”]+)["”]?$/i,
  );
  if (callPendingEntityMatch) {
    const node = resolveEntityReference(callPendingEntityMatch[1], entityMap, context);
    const nextLabel = cleanedLabel(callPendingEntityMatch[2]);
    if (nextLabel) {
      node.aliases = Array.isArray(node.aliases) ? node.aliases : [];
      node.aliases.push(node.label);
      node.label = defaultNarrativeLabel(nextLabel, node.type);
      registerNarrativeEntity(node, entityMap);
      context.pendingNamedEntity = node;
      context.recentEntities = [node];
    }
    return;
  }

  const callEntityMatch = statement.match(
    /^(?:call|name|label)\s+(.+?)\s+["“]?([^"”]+)["”]?$/i,
  );
  if (callEntityMatch) {
    const node = resolveEntityReference(callEntityMatch[1], entityMap, context);
    const nextLabel = cleanedLabel(callEntityMatch[2]);
    if (nextLabel) {
      node.aliases = Array.isArray(node.aliases) ? node.aliases : [];
      node.aliases.push(node.label);
      node.label = defaultNarrativeLabel(nextLabel, node.type);
      registerNarrativeEntity(node, entityMap);
      context.pendingNamedEntity = node;
      context.recentEntities = [node];
    }
    return;
  }

  const renameMatch = statement.match(
    /^(?:rename|change the name of)\s+(.+?)\s+to\s+(.+)$/i,
  );
  if (renameMatch) {
    const node = resolveEntityReference(renameMatch[1], entityMap, context);
    const nextLabel = cleanedLabel(extractNamedEntity(renameMatch[2]));
    if (nextLabel) {
      node.aliases = Array.isArray(node.aliases) ? node.aliases : [];
      node.aliases.push(node.label);
      node.label = defaultNarrativeLabel(nextLabel, node.type);
      registerNarrativeEntity(node, entityMap);
      context.pendingNamedEntity = node;
      context.recentEntities = [node];
    }
    return;
  }

  const removeOwnershipMatch = statement.match(
    /^(?:delete|remove)\s+(?:the\s+)?ownership(?:\s+line)?\s+(?:from\s+(.+?)\s+to\s+(.+)|between\s+(.+?)\s+and\s+(.+))$/i,
  );
  if (removeOwnershipMatch) {
    const ownerRef = removeOwnershipMatch[1] || removeOwnershipMatch[3];
    const ownedRef = removeOwnershipMatch[2] || removeOwnershipMatch[4];
    const owner = resolveEntityReference(ownerRef, entityMap, context);
    const owned = resolveEntityReference(ownedRef, entityMap, context);
    state.edges = state.edges.filter(
      (edge) => !(edge.kind === "ownership" && edge.from === owner.id && edge.to === owned.id),
    );
    context.recentEntities = [owner, owned];
    return;
  }

  const removeTransactionMatch = statement.match(
    /^(?:delete|remove)\s+(?:the\s+)?transaction(?:\s+arrow)?\s+(?:from\s+(.+?)\s+to\s+(.+)|between\s+(.+?)\s+and\s+(.+))$/i,
  );
  if (removeTransactionMatch) {
    const fromRef = removeTransactionMatch[1] || removeTransactionMatch[3];
    const toRef = removeTransactionMatch[2] || removeTransactionMatch[4];
    const from = resolveEntityReference(fromRef, entityMap, context);
    const to = resolveEntityReference(toRef, entityMap, context);
    state.edges = state.edges.filter(
      (edge) => !(edge.kind === "transaction" && edge.from === from.id && edge.to === to.id),
    );
    context.recentEntities = [from, to];
    return;
  }

  const deleteEntityMatch = statement.match(
    /^(?:delete|remove)\s+(?:entity\s+)?(.+)$/i,
  );
  if (deleteEntityMatch) {
    const node = resolveEntityReference(deleteEntityMatch[1], entityMap, context);
    state.nodes = state.nodes.filter((candidate) => candidate.id !== node.id);
    state.edges = state.edges.filter((edge) => edge.from !== node.id && edge.to !== node.id);
    entityMap.clear();
    buildNarrativeEntityMap(entityMap);
    context.recentEntities = [];
    context.pendingNamedEntity = null;
    return;
  }

  const createEntityMatch = statement.match(
    /^(?:add|create)\s+(?:a|an)\s+(.+?)(?:\s+(?:called|named)\s+(.+))?$/i,
  );
  if (createEntityMatch && !/\bowns\b/i.test(statement)) {
    const rawName = createEntityMatch[2] || createEntityMatch[1];
    const node = findOrCreateEntity(rawName, entityMap);
    applyNarrativeType(node, createEntityMatch[1]);
    context.pendingNamedEntity = node;
    context.recentEntities = [node];
    return;
  }

  const ownerDeclarationMatch = statement.match(
    /^(that owner|this owner|the owner)\s+is\s+(?:a|an)\s+(.+)$/i,
  );
  if (ownerDeclarationMatch && context.recentEntities[0]) {
    const node = context.recentEntities[0];
    applyNarrativeType(node, ownerDeclarationMatch[2]);
    const explicitName = extractExplicitEntityName(ownerDeclarationMatch[2]);
    if (explicitName) {
      node.aliases = Array.isArray(node.aliases) ? node.aliases : [];
      node.aliases.push(node.label);
      node.label = defaultNarrativeLabel(cleanedLabel(explicitName), node.type);
      registerNarrativeEntity(node, entityMap);
    }
    context.pendingNamedEntity = node;
    context.recentEntities = [node, context.pendingOwnerTarget].filter(Boolean);
    return;
  }

  const changeTypeMatch = statement.match(
    /^(?:make|change)\s+(.+?)\s+(?:to\s+be|into|to)\s+(?:a|an)\s+(.+)$/i,
  );
  if (changeTypeMatch && !/\bowns\b/i.test(statement)) {
    const node = resolveEntityReference(changeTypeMatch[1], entityMap, context);
    applyNarrativeType(node, changeTypeMatch[2]);
    context.recentEntities = [node];
    return;
  }

  const declarationOwnershipMatch = statement.match(
    /^(.+?)\s+is\s+(?:a|an)\s+(.+?)\s+(?:and\s+(?:it\s+)?owns|that\s+owns)\s+(\d{1,3}%?)\s+(?:in|of)\s+(.+)$/i,
  );
  if (declarationOwnershipMatch) {
    const owner = findOrCreateEntity(extractNamedEntity(declarationOwnershipMatch[1]), entityMap);
    applyNarrativeType(owner, declarationOwnershipMatch[2]);
    const owned = findOrCreateEntity(extractNamedEntity(declarationOwnershipMatch[4]), entityMap);
    applyNarrativeType(owned, declarationOwnershipMatch[4]);
    createEdge(owner.id, owned.id, "ownership", {
      percent: normalizePercent(declarationOwnershipMatch[3]),
      preserveDirection: true,
    });
    context.pendingNamedEntity = owned;
    context.recentEntities = [owner, owned];
    return;
  }

  const namedEntitiesMatch = statement.match(
    /^i have\s+(\w+)\s+(.+?),\s+called\s+(.+)$/i,
  );
  if (namedEntitiesMatch) {
    const count = wordToCount(namedEntitiesMatch[1]);
    const typePhrase = namedEntitiesMatch[2];
    const names = splitEntityNames(namedEntitiesMatch[3]);
    const created = names.slice(0, count || names.length).map((name) => {
      const node = findOrCreateEntity(name, entityMap);
      node.type = inferTypeFromPhrase(typePhrase);
      return node;
    });
    context.pendingNamedEntity = created[created.length - 1] || null;
    context.recentEntities = created;
    return;
  }

  const collectiveOwnershipMatch = statement.match(
    /^(they|these entities|both)\s+(?:all\s+|both\s+)?own\s+(\d{1,3}%?)\s+(?:in|of)\s+(.+)$/i,
  );
  if (collectiveOwnershipMatch && context.recentEntities.length > 0) {
    const owned = findOrCreateEntity(extractNamedEntity(collectiveOwnershipMatch[3]), entityMap);
    applyNarrativeType(owned, collectiveOwnershipMatch[3]);
    context.recentEntities.forEach((owner) => {
      createEdge(owner.id, owned.id, "ownership", {
        percent: normalizePercent(collectiveOwnershipMatch[2]),
        preserveDirection: true,
      });
    });
    context.pendingNamedEntity = owned;
    context.recentEntities = [owned];
    return;
  }

  const reverseOwnershipMatch = statement.match(
    /^(?:the\s+other\s+)?(\d{1,3}%?)\s+of\s+(.+?)\s+is\s+owned\s+by\s+(.+)$/i,
  );
  if (reverseOwnershipMatch) {
    const owned = findOrCreateEntity(extractNamedEntity(reverseOwnershipMatch[2]), entityMap);
    applyNarrativeType(owned, reverseOwnershipMatch[2]);
    const owner = findOrCreateEntity(extractNamedEntity(reverseOwnershipMatch[3]), entityMap);
    applyNarrativeType(owner, reverseOwnershipMatch[3]);
    createEdge(owner.id, owned.id, "ownership", {
      percent: normalizePercent(reverseOwnershipMatch[1]),
      preserveDirection: true,
    });
    context.pendingNamedEntity = owner;
    context.recentEntities = [owner, owned];
    return;
  }

  const ownershipPattern =
    /^(.+?)\s+owns\s+(\d{1,3}%?)\s+of\s+(.+)$/i;
  const declarationPattern =
    /^(.+?)\s+is\s+(?:a|an)\s+(.+)$/i;

  const ownershipMatch = statement.match(ownershipPattern);
  if (ownershipMatch) {
    const owner = resolveEntityReference(ownershipMatch[1], entityMap, context);
    const owned = findOrCreateEntity(extractNamedEntity(ownershipMatch[3]), entityMap);
    applyNarrativeType(owned, ownershipMatch[3]);
    createEdge(owner.id, owned.id, "ownership", {
      percent: normalizePercent(ownershipMatch[2]),
      preserveDirection: true,
    });
    context.pendingNamedEntity = owned;
    context.recentEntities = [owner, owned];
    return;
  }

  const declarationMatch = statement.match(declarationPattern);
  if (declarationMatch) {
    const node = findOrCreateEntity(declarationMatch[1], entityMap);
    applyNarrativeType(node, declarationMatch[2]);
    context.pendingNamedEntity = node;
    context.recentEntities = [node];
    return;
  }

  const transactionMatch = matchTransaction(statement);
  if (transactionMatch) {
    const from = resolveEntityReference(transactionMatch.from, entityMap, context);
    const to = resolveEntityReference(transactionMatch.to, entityMap, context);
    createEdge(from.id, to.id, "transaction", { label: transactionMatch.label });
    context.pendingNamedEntity = to;
    context.recentEntities = [from, to];
    return;
  }

  if (/^(?:call|name|label|add|create|rename|change|remove|delete)\b/i.test(statement)) {
    return;
  }

  const node = findOrCreateEntity(extractNamedEntity(statement), entityMap);
  applyNarrativeType(node, statement);
  context.pendingNamedEntity = node;
  context.recentEntities = [node];
}

function matchTransaction(statement) {
  for (const verb of RELATIONSHIP_VERBS) {
    const regex = new RegExp(`^(.+?)\\s+${verb}\\s+(.+?)\\s+to\\s+(.+)$`, "i");
    const match = statement.match(regex);
    if (match) {
      return {
        from: match[1],
        to: match[3],
        label: capitalize(verb),
      };
    }
  }

  const simpleToPattern = /^(.+?)\s+(loans|sells|pays|contributes|licenses|transfers)\s+to\s+(.+)$/i;
  const simpleMatch = statement.match(simpleToPattern);
  if (simpleMatch) {
    return {
      from: simpleMatch[1],
      to: simpleMatch[3],
      label: capitalize(simpleMatch[2]),
    };
  }

  return null;
}

function findOrCreateEntity(rawName, entityMap) {
  const normalized = normalizeEntityName(rawName);

  const entityKey = entityLookupKey(normalized);
  if (entityMap.has(entityKey)) {
    return entityMap.get(entityKey);
  }

  const typeKey = inferTypeFromPhrase(normalized);
  addNode(typeKey, { label: defaultNarrativeLabel(cleanedLabel(normalized), typeKey), silent: true });
  const node = state.nodes[state.nodes.length - 1];
  registerNarrativeEntity(node, entityMap);
  return node;
}

function createNarrativePlaceholderEntity(typeKey, labelBase, entityMap) {
  addNode(typeKey, {
    label: `${labelBase} ${state.nextNodeId}`,
    silent: true,
  });
  const node = state.nodes[state.nodes.length - 1];
  registerNarrativeEntity(node, entityMap);
  return node;
}

function createNarrativeEntity(typeKey, label, entityMap) {
  addNode(typeKey, {
    label: defaultNarrativeLabel(cleanedLabel(label), typeKey),
    silent: true,
  });
  const node = state.nodes[state.nodes.length - 1];
  registerNarrativeEntity(node, entityMap);
  return node;
}

function applyNarrativeType(node, phrase) {
  const inferred = inferTypeFromPhrase(phrase);
  if (inferred === "corporation") {
    if (!node.type) {
      node.type = inferred;
    }
    return;
  }
  node.type = inferred;
}

function resolveEntityReference(rawName, entityMap, context) {
  const normalized = rawName.trim().toLowerCase();
  if ((normalized === "it" || normalized === "its") && context.recentEntities[0]) {
    return context.recentEntities[0];
  }
  if (
    (normalized === "the subsidiary" || normalized === "subsidiary") &&
    context.pendingNamedEntity
  ) {
    return context.pendingNamedEntity;
  }
  if (
    (normalized === "that owner" || normalized === "this owner" || normalized === "the owner") &&
    context.recentEntities[0]
  ) {
    return context.recentEntities[0];
  }
  if ((normalized === "they" || normalized === "them" || normalized === "both") && context.recentEntities.length > 0) {
    return context.recentEntities[0];
  }
  const directKey = entityLookupKey(rawName);
  if (entityMap.has(directKey)) {
    return entityMap.get(directKey);
  }
  const narrowedReference = extractTargetEntityReference(rawName);
  const narrowedKey = entityLookupKey(narrowedReference);
  if (entityMap.has(narrowedKey)) {
    return entityMap.get(narrowedKey);
  }
  return findOrCreateEntity(narrowedReference || rawName, entityMap);
}

function defaultNarrativeLabel(value, typeKey) {
  const lowered = value.toLowerCase();
  if (lowered === "individual") return "Individual";
  if (lowered === "partnership") return "Partnership";
  if (lowered === "corporation") return "Corporation";
  if (lowered === "trust") return "Trust or other Non-Entity";
  if (lowered === "disregarded entity" || lowered === "hybrid entity") {
    return "Disregarded / Hybrid Entity";
  }
  if (lowered === "hybrid partnership") return "Hybrid Partnership";
  if (lowered === "reverse hybrid") return "Reverse Hybrid";
  if (!value && typeKey) {
    return getType(typeKey).label;
  }
  return value;
}

function extractNamedEntity(value) {
  const parentheticalMatch = value.match(/\(([^()]+)\)/);
  if (parentheticalMatch) {
    return parentheticalMatch[1].trim();
  }
  const calledMatch = value.match(/called\s+(.+)$/i);
  if (calledMatch) {
    return calledMatch[1].trim();
  }
  const namedMatch = value.match(/named\s+(.+)$/i);
  if (namedMatch) {
    return namedMatch[1].trim();
  }
  const entityMatch = value.match(/entity\s+called\s+(.+)$/i);
  if (entityMatch) {
    return entityMatch[1].trim();
  }
  return value.trim();
}

function extractExplicitEntityName(value) {
  const calledMatch = value.match(/called\s+(.+)$/i);
  if (calledMatch) return calledMatch[1].trim();
  const namedMatch = value.match(/named\s+(.+)$/i);
  if (namedMatch) return namedMatch[1].trim();
  const parentheticalMatch = value.match(/\(([^()]+)\)/);
  if (parentheticalMatch) return parentheticalMatch[1].trim();
  return "";
}

function parseNarrativeEntityDescriptor(value, fallbackType = "corporation") {
  const trimmed = value.trim();
  const parentheticalMatch = trimmed.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (parentheticalMatch) {
    const label = cleanedLabel(parentheticalMatch[1]);
    const typeHint = parentheticalMatch[2].trim();
    return {
      label: label || cleanedLabel(trimmed),
      typeKey: inferTypeFromPhrase(typeHint) || fallbackType,
    };
  }

  return {
    label: cleanedLabel(extractNamedEntity(trimmed)),
    typeKey: inferTypeFromPhrase(trimmed) || fallbackType,
  };
}

function buildNarrativeEntityMap(existingMap = new Map()) {
  state.nodes.forEach((node) => {
    registerNarrativeEntity(node, existingMap);
  });
  return existingMap;
}

function registerNarrativeEntity(node, entityMap) {
  const keys = new Set([
    entityLookupKey(node.label),
    entityLookupKey(normalizeEntityName(node.label)),
  ]);

  if (Array.isArray(node.aliases)) {
    node.aliases.forEach((alias) => keys.add(entityLookupKey(alias)));
  }

  keys.forEach((key) => {
    if (key) entityMap.set(key, node);
  });
}

function normalizeEntityName(value) {
  return value
    .replace(/\b(the|a|an)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTargetEntityReference(value) {
  let narrowed = value.trim();
  narrowed = narrowed.replace(/\s+(?:called|named)\s+.+$/i, "");
  const typeHintMatch = narrowed.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (
    typeHintMatch &&
    /\b(corporation|partnership|entity|trust|individual|hybrid|dreg|reverse)\b/i.test(
      typeHintMatch[2],
    )
  ) {
    narrowed = typeHintMatch[1].trim();
  }
  return narrowed.trim();
}

function entityLookupKey(value) {
  return normalizeEntityName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function splitEntityNames(value) {
  return value
    .split(/\s*(?:,|and)\s*/i)
    .map((part) => cleanedLabel(part))
    .filter(Boolean);
}

function wordToCount(value) {
  const normalized = value.toLowerCase();
  if (normalized === "one") return 1;
  if (normalized === "two") return 2;
  if (normalized === "three") return 3;
  if (normalized === "four") return 4;
  const numeric = Number.parseInt(normalized, 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function layoutNarrativeDiagram() {
  if (state.nodes.length === 0) return;

  const childIds = new Set();
  state.edges
    .filter((edge) => edge.kind === "ownership")
    .forEach((edge) => {
      childIds.add(edge.to);
    });

  const roots = state.nodes.filter((node) => !childIds.has(node.id));
  if (roots.length === 0) {
    return;
  }

  const levels = new Map();
  const queue = roots.map((node) => ({ id: node.id, level: 0 }));
  while (queue.length > 0) {
    const current = queue.shift();
    if (levels.has(current.id) && levels.get(current.id) <= current.level) continue;
    levels.set(current.id, current.level);

    state.edges
      .filter((edge) => edge.kind === "ownership")
      .forEach((edge) => {
        if (edge.from === current.id) {
          queue.push({ id: edge.to, level: current.level + 1 });
        }
      });
  }

  const grouped = new Map();
  state.nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0;
    if (!grouped.has(level)) grouped.set(level, []);
    grouped.get(level).push(node);
  });

  const sortedLevels = Array.from(grouped.keys()).sort((a, b) => a - b);
  sortedLevels.forEach((level) => {
    const nodes = grouped.get(level);
    nodes.sort((a, b) => ownershipCenterX(a.id) - ownershipCenterX(b.id));
    const totalWidth = (nodes.length - 1) * GRID * 5;
    const startX = VIEWBOX.width / 2 - totalWidth / 2;
    nodes.forEach((node, index) => {
      node.x = snapToGrid(startX + index * GRID * 5);
      node.y = snapToGrid(GRID * 2 + level * GRID * 5);
    });
  });
}

function placeNarrativeAdditions(existingNodeIds) {
  const newNodes = state.nodes.filter((node) => !existingNodeIds.has(node.id));
  if (newNodes.length === 0) return;

  const occupied = state.nodes
    .filter((node) => existingNodeIds.has(node.id))
    .map((node) => ({ id: node.id, x: node.x, y: node.y }));

  newNodes.forEach((node, index) => {
    const parents = state.edges
      .filter((edge) => edge.kind === "ownership" && edge.to === node.id)
      .map((edge) => state.nodes.find((candidate) => candidate.id === edge.from))
      .filter(Boolean);
    const children = state.edges
      .filter((edge) => edge.kind === "ownership" && edge.from === node.id)
      .map((edge) => state.nodes.find((candidate) => candidate.id === edge.to))
      .filter(Boolean);

    let targetX = node.x;
    let targetY = node.y;

    if (parents.length > 0) {
      targetX = average(parents.map((parent) => parent.x));
      targetY = Math.max(...parents.map((parent) => parent.y)) + GRID * 5;
    } else if (children.length > 0) {
      targetX = average(children.map((child) => child.x));
      targetY = Math.min(...children.map((child) => child.y)) - GRID * 5;
    } else {
      const fallbackX = occupied.length > 0
        ? Math.max(...occupied.map((item) => item.x)) + GRID * 5
        : GRID * 3;
      targetX = fallbackX + index * GRID * 2;
      targetY = GRID * 3;
    }

    const positioned = findOpenNarrativeSlot(
      snapToGrid(targetX),
      snapToGrid(targetY),
      occupied,
    );
    node.x = positioned.x;
    node.y = positioned.y;
    occupied.push({ id: node.id, x: node.x, y: node.y });
  });
}

function findOpenNarrativeSlot(targetX, targetY, occupied) {
  const offsets = [
    [0, 0],
    [GRID * 4, 0],
    [-GRID * 4, 0],
    [0, GRID * 3],
    [0, -GRID * 3],
    [GRID * 4, GRID * 3],
    [-GRID * 4, GRID * 3],
    [GRID * 4, -GRID * 3],
    [-GRID * 4, -GRID * 3],
  ];

  for (const [dx, dy] of offsets) {
    const candidate = {
      x: clampPosition(targetX + dx, BOX.width, VIEWBOX.width),
      y: clampPosition(targetY + dy, BOX.height, VIEWBOX.height),
    };
    const overlaps = occupied.some(
      (item) =>
        Math.abs(item.x - candidate.x) < BOX.width + GRID &&
        Math.abs(item.y - candidate.y) < BOX.height + GRID,
    );
    if (!overlaps) {
      return candidate;
    }
  }

  return {
    x: clampPosition(targetX, BOX.width, VIEWBOX.width),
    y: clampPosition(targetY, BOX.height, VIEWBOX.height),
  };
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampPosition(value, size, max) {
  return Math.max(GRID, Math.min(value, max - size - GRID));
}

function clampLegendPosition(value, size, max) {
  const margin = 8;
  return Math.max(margin, Math.min(value, max - size - margin));
}

function ownershipCenterX(nodeId, seen = new Set()) {
  if (seen.has(nodeId)) return VIEWBOX.width / 2;
  seen.add(nodeId);

  const parents = state.edges
    .filter((edge) => edge.kind === "ownership")
    .filter((edge) => edge.to === nodeId)
    .map((edge) => edge.from);

  if (parents.length === 0) {
    const node = state.nodes.find((item) => item.id === nodeId);
    return node ? node.x : VIEWBOX.width / 2;
  }

  const centers = parents.map((parentId) => ownershipCenterX(parentId, seen));
  return centers.reduce((sum, value) => sum + value, 0) / centers.length;
}

function inferTypeFromPhrase(phrase) {
  const value = phrase.toLowerCase();
  if (value.includes("hybrid partnership")) return "hybrid-partnership";
  if (value.includes("partnership")) return "partnership";
  if (value.includes("disregarded") || value.includes("dreg")) return "dreg";
  if (value.includes("hybrid") && value.includes("reverse")) return "reverse-hybrid";
  if (value.includes("reverse hybrid")) return "reverse-hybrid";
  if (value.includes("hybrid")) return "dreg";
  if (value.includes("trust")) return "trust";
  if (value.includes("individual")) return "individual";
  return "corporation";
}

function normalizePercent(percent) {
  return percent.endsWith("%") ? percent : `${percent}%`;
}

function cleanedLabel(value) {
  return value
    .replace(/\bof\b$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function downloadJson() {
  const payload = JSON.stringify(serializeDiagramState(), null, 2);
  downloadBlob(payload, "tax-structure-diagram.json", "application/json");
}

function loadJson(event) {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const payload = JSON.parse(reader.result);
    applyDiagramState(payload);
  };
  reader.readAsText(file);
  event.target.value = "";
}

function saveBrowserDiagram() {
  const defaultName = buildDefaultSaveName();
  const name = window.prompt("Name this saved diagram:", defaultName);
  if (name === null) return;

  const trimmedName = name.trim() || defaultName;
  const saves = getBrowserSaves();
  const entry = {
    id: `save-${Date.now()}`,
    name: trimmedName,
    savedAt: new Date().toISOString(),
    payload: serializeDiagramState(),
  };

  saves.unshift(entry);
  const nextSaves = saves.slice(0, MAX_BROWSER_SAVES);
  setBrowserSaves(nextSaves);
  renderSavedDiagrams();
}

function renderSavedDiagrams() {
  if (!savedDiagramList) return;

  const saves = getBrowserSaves();
  savedDiagramList.innerHTML = "";

  if (saves.length === 0) {
    const empty = document.createElement("div");
    empty.className = "helper-box compact-helper";
    empty.textContent = "No saved diagrams yet.";
    savedDiagramList.appendChild(empty);
    return;
  }

  saves.forEach((save) => {
    const row = document.createElement("div");
    row.className = "saved-diagram-row";

    const meta = document.createElement("div");
    meta.className = "saved-diagram-meta";

    const title = document.createElement("div");
    title.className = "saved-diagram-title";
    title.textContent = save.name;
    meta.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.className = "saved-diagram-subtitle";
    subtitle.textContent = formatSavedAt(save.savedAt);
    meta.appendChild(subtitle);

    const actions = document.createElement("div");
    actions.className = "saved-diagram-actions";

    const loadButton = document.createElement("button");
    loadButton.className = "secondary-button compact-button";
    loadButton.textContent = "Load";
    loadButton.addEventListener("click", () => loadBrowserDiagram(save.id));
    actions.appendChild(loadButton);

    const deleteButton = document.createElement("button");
    deleteButton.className = "danger-button compact-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteBrowserDiagram(save.id));
    actions.appendChild(deleteButton);

    row.appendChild(meta);
    row.appendChild(actions);
    savedDiagramList.appendChild(row);
  });
}

function getBrowserSaves() {
  try {
    const raw = window.localStorage.getItem(BROWSER_SAVE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function setBrowserSaves(saves) {
  window.localStorage.setItem(BROWSER_SAVE_KEY, JSON.stringify(saves));
}

function loadBrowserDiagram(saveId) {
  const save = getBrowserSaves().find((entry) => entry.id === saveId);
  if (!save) return;
  applyDiagramState(save.payload);
}

function deleteBrowserDiagram(saveId) {
  const saves = getBrowserSaves().filter((entry) => entry.id !== saveId);
  setBrowserSaves(saves);
  renderSavedDiagrams();
}

function serializeDiagramState() {
  return {
    nodes: state.nodes,
    edges: state.edges,
    workspaceWidth: state.workspaceWidth,
    workspaceHeight: state.workspaceHeight,
    zoom: state.zoom,
    transactionLegend: state.transactionLegend,
    nextNodeId: state.nextNodeId,
    nextEdgeId: state.nextEdgeId,
  };
}

function applyDiagramState(payload) {
  state.nodes = payload.nodes || [];
  state.nodes.forEach((node) => {
    if (node.type === "hybrid") {
      node.type = "dreg";
      if (node.label === "Hybrid Entity") {
        node.label = "Disregarded / Hybrid Entity";
      }
    }
  });
  state.edges = payload.edges || [];
  state.workspaceWidth = Math.max(MIN_WORKSPACE_WIDTH, payload.workspaceWidth || MIN_WORKSPACE_WIDTH);
  state.workspaceHeight = Math.max(MIN_WORKSPACE_HEIGHT, payload.workspaceHeight || MIN_WORKSPACE_HEIGHT);
  state.zoom = Math.max(0.5, Math.min(2, payload.zoom || 1));
  applyCanvasDimensions();
  state.transactionLegend = {
    enabled: Boolean(payload.transactionLegend?.enabled),
    arrowEndText: payload.transactionLegend?.arrowEndText || "",
    nonArrowEndText: payload.transactionLegend?.nonArrowEndText || "",
    x: payload.transactionLegend?.x ?? 70,
    y: payload.transactionLegend?.y ?? 760,
  };
  state.nextNodeId = payload.nextNodeId || state.nodes.length + 1;
  state.nextEdgeId = payload.nextEdgeId || state.edges.length + 1;
  state.selection = null;
  state.selectedNodeIds = [];
  state.pendingConnection = null;
  state.drag = null;
  state.edgeDrag = null;
  state.labelDrag = null;
  state.marquee = null;
  state.suppressBlankClick = false;
  render();
}

function buildDefaultSaveName() {
  const labels = state.nodes.slice(0, 2).map((node) => node.label).filter(Boolean);
  if (labels.length > 0) {
    return labels.join(" / ");
  }
  return `Diagram ${new Date().toLocaleDateString()}`;
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function exportSvg() {
  const svgString = buildExportSvgString();
  downloadBlob(svgString, "tax-structure-diagram.svg", "image/svg+xml");
}

async function exportPng() {
  try {
    const blob = await buildExportPngBlob();
    downloadBlob(blob, "tax-structure-diagram.png", "image/png");
  } catch (error) {
    console.error(error);
    window.alert("PNG export failed in this browser. SVG export is still available.");
  }
}

async function exportPptx() {
  try {
    const blob = isPublicStaticSite() ? await buildImagePptxBlob() : await fetchEditablePptxBlob();
    downloadBlob(blob, "tax-structure-diagram.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  } catch (error) {
    console.error(error);
    window.alert(error.message || "PPTX export failed.");
  }
}

async function fetchEditablePptxBlob() {
  try {
    const response = await fetch(apiUrl("/api/export/pptx"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeDiagramState()),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "PPTX export failed.");
    }

    return response.blob();
  } catch (error) {
    console.warn("Falling back to browser PPTX export.", error);
    return buildImagePptxBlob();
  }
}

async function buildImagePptxBlob() {
  const pngBlob = await buildExportPngBlob();
  const imageData = await blobToDataUrl(pngBlob);
  if (typeof PptxGenJS === "undefined") {
    throw new Error("PowerPoint exporter did not load. Please refresh and try again.");
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Tax Structure Chart Builder";
  pptx.company = "OpenAI";
  pptx.subject = "Tax structure diagram";
  pptx.title = buildDefaultSaveName();

  const slideWidth = 13.333;
  const slideHeight = 7.5;
  const imageFit = fitImageIntoBox(VIEWBOX.width, VIEWBOX.height, slideWidth, slideHeight);
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addImage({
    data: imageData,
    x: imageFit.x,
    y: imageFit.y,
    w: imageFit.width,
    h: imageFit.height,
  });

  return pptx.write({ outputType: "blob", compression: true });
}

function fitImageIntoBox(imageWidth, imageHeight, boxWidth, boxHeight) {
  const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (boxWidth - width) / 2,
    y: (boxHeight - height) / 2,
    width,
    height,
  };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not prepare diagram image for PowerPoint export."));
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function prepareExportClone(clone) {
  const exportBackground = clone.querySelector(".canvas-background");
  if (exportBackground) {
    exportBackground.setAttribute("fill", "#ffffff");
    exportBackground.style.fill = "#ffffff";
  }

  clone.style.background = "#ffffff";

  const exportGrid = clone.querySelector(".canvas-grid");
  if (exportGrid) {
    exportGrid.remove();
  }
}

function inlineExportStyles(clone) {
  const originalElements = canvas.querySelectorAll("*");
  const cloneElements = clone.querySelectorAll("*");

  cloneElements.forEach((cloneElement, index) => {
    const originalElement = originalElements[index];
    if (!originalElement) return;
    const computed = window.getComputedStyle(originalElement);

    const styleParts = [];
    const fields = [
      "fill",
      "stroke",
      "stroke-width",
      "stroke-dasharray",
      "stroke-linecap",
      "stroke-linejoin",
      "font-size",
      "font-family",
      "font-weight",
      "paint-order",
      "marker-start",
      "marker-end",
      "opacity",
    ];

    fields.forEach((field) => {
      const value = computed.getPropertyValue(field);
      const shouldKeepNone = field === "fill" && value === "none";
      if (value && (value !== "normal") && (value !== "none" || shouldKeepNone)) {
        styleParts.push(`${field}:${value}`);
      }
    });

    if (styleParts.length > 0) {
      cloneElement.setAttribute("style", styleParts.join(";"));
    }
  });
}

function buildExportSvgString() {
  const serializer = new XMLSerializer();
  const clone = canvas.cloneNode(true);
  inlineExportStyles(clone);
  prepareExportClone(clone);
  clone.setAttribute("xmlns", svgNs);
  clone.setAttribute("width", String(VIEWBOX.width));
  clone.setAttribute("height", String(VIEWBOX.height));
  clone.setAttribute("viewBox", `0 0 ${VIEWBOX.width} ${VIEWBOX.height}`);
  return serializer.serializeToString(clone);
}

function buildExportPngBlob() {
  return new Promise((resolve, reject) => {
    const svgString = buildExportSvgString();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = VIEWBOX.width;
      tempCanvas.height = VIEWBOX.height;
      const context = tempCanvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not create PNG export context."));
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      context.drawImage(image, 0, 0);
      tempCanvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) {
          reject(new Error("Could not render PNG export."));
          return;
        }
        resolve(blob);
      }, "image/png");
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load SVG snapshot into image."));
    };

    image.src = url;
  });
}

function setFeedbackStatus(message, tone = "") {
  feedbackStatus.textContent = message;
  feedbackStatus.className = "subtle small feedback-status";
  if (tone) {
    feedbackStatus.classList.add(tone);
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

async function handleFeedbackSubmit(event) {
  event.preventDefault();
  const name = feedbackNameInput.value.trim();
  const comment = feedbackCommentInput.value.trim();

  if (!name || !comment) {
    setFeedbackStatus("Please add your name and a comment before sending feedback.", "error");
    return;
  }

  if (isPublicStaticSite()) {
    const subject = encodeURIComponent(`Tax Diagram Tool Feedback from ${name}`);
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        "",
        "Feedback:",
        comment,
        "",
        `Page: ${window.location.href}`,
      ].join("\n"),
    );
    window.location.href = `mailto:${PUBLIC_FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    setFeedbackStatus("Your email app should open with a message to Jason.", "success");
    return;
  }

  feedbackSubmitButton.disabled = true;
  setFeedbackStatus("Sending feedback with a snapshot of your diagram...", "");

  try {
    const snapshotBlob = await buildExportPngBlob();
    const snapshotBuffer = await snapshotBlob.arrayBuffer();
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        comment,
        snapshotBase64: arrayBufferToBase64(snapshotBuffer),
        snapshotMimeType: "image/png",
        snapshotWidth: VIEWBOX.width,
        snapshotHeight: VIEWBOX.height,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Feedback submission failed.");
    }

    feedbackCommentInput.value = "";
    setFeedbackStatus("Thanks. Your feedback and diagram snapshot were submitted.", "success");
  } catch (error) {
    console.error(error);
    setFeedbackStatus(error.message || "Feedback could not be submitted right now.", "error");
  } finally {
    feedbackSubmitButton.disabled = false;
  }
}

init();
