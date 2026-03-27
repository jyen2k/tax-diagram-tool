const ENTITY_TYPES = [
  { key: "corporation", label: "Corporation", shortLabel: "Corporation", color: "#d8c2a8" },
  { key: "partnership", label: "Partnership", shortLabel: "Partnership", color: "#d8e5d2" },
  {
    key: "dreg",
    label: "Disregarded / Hybrid Entity",
    shortLabel: "D/H Entity",
    color: "#d6d0ef",
  },
  { key: "hybrid-partnership", label: "Hybrid Partnership", shortLabel: "Hybrid Partnership", color: "#d5e4df" },
  { key: "reverse-hybrid", label: "Reverse Hybrid", shortLabel: "Reverse Hybrid", color: "#c8ddd7" },
  { key: "individual", label: "Individual", shortLabel: "Individual", color: "#f2d3c2" },
  { key: "trust", label: "Trust", shortLabel: "Trust", color: "#e3ddcf" },
];

const svgNs = "http://www.w3.org/2000/svg";
const canvas = document.getElementById("diagramCanvas");
const entityPalette = document.getElementById("entityPalette");
const entityTypeSelect = document.getElementById("entityType");
const entityList = document.getElementById("entityList");
const edgeList = document.getElementById("edgeList");
const savedDiagramList = document.getElementById("savedDiagramList");
const selectionType = document.getElementById("selectionType");
const modeStatus = document.getElementById("modeStatus");
const diagramStats = document.getElementById("diagramStats");
const entityForm = document.getElementById("entityForm");
const edgeForm = document.getElementById("edgeForm");
const emptySelection = document.getElementById("emptySelection");
const narrativeInput = document.getElementById("narrativeInput");

const state = {
  nodes: [],
  edges: [],
  selection: null,
  mode: "select",
  pendingConnection: null,
  drag: null,
  edgeDrag: null,
  labelDrag: null,
  suppressClickNodeId: null,
  nextNodeId: 1,
  nextEdgeId: 1,
};

const VIEWBOX = { width: 1400, height: 900 };
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
const BROWSER_SAVE_KEY = "tax-structure-diagram-saves";
const MAX_BROWSER_SAVES = 5;

function init() {
  syncCanvasMetrics();
  buildPalette();
  buildTypeOptions();
  bindEvents();
  seedDemo();
  render();
}

function syncCanvasMetrics() {
  const rect = canvas.getBoundingClientRect();
  const scale =
    rect.width > 0 && rect.height > 0
      ? Math.min(rect.width / VIEWBOX.width, rect.height / VIEWBOX.height)
      : 1;
  const safeScale = scale > 0 ? scale : 1;
  GRID = DISPLAY_GRID / safeScale;
  SNAP_THRESHOLD = DISPLAY_SNAP_THRESHOLD / safeScale;
  BOX = { width: GRID * 3, height: GRID * 2 };
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

  document.getElementById("entityJurisdiction").addEventListener("input", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.jurisdiction = event.target.value;
    render();
  });

  document.getElementById("entityNotes").addEventListener("input", (event) => {
    const node = getSelectedNode();
    if (!node) return;
    node.notes = event.target.value;
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
  document.getElementById("reverseEdge").addEventListener("click", reverseSelectedEdge);

  document.getElementById("deleteEntity").addEventListener("click", deleteSelectedEntity);
  document.getElementById("deleteEdge").addEventListener("click", deleteSelectedEdge);
  document.getElementById("clearBoard").addEventListener("click", clearBoard);
  document.getElementById("autoLayout").addEventListener("click", autoLayout);
  document.getElementById("generateNarrative").addEventListener("click", () => {
    generateFromNarrative({ mode: "replace" });
  });
  document.getElementById("applyNarrative").addEventListener("click", () => {
    generateFromNarrative({ mode: "apply" });
  });
  document.getElementById("saveBrowser").addEventListener("click", saveBrowserDiagram);
  document.getElementById("saveJson").addEventListener("click", downloadJson);
  document.getElementById("loadJson").addEventListener("click", () => {
    document.getElementById("fileLoader").click();
  });
  document.getElementById("fileLoader").addEventListener("change", loadJson);
  document.getElementById("exportSvg").addEventListener("click", exportSvg);
  document.getElementById("exportPng").addEventListener("click", exportPng);

  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  window.addEventListener("mousemove", handleCanvasMouseMove);
  window.addEventListener("mouseup", handleCanvasMouseUp);
  window.addEventListener("keydown", handleKeyDown);
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
    notes: options.notes || "",
    lineStyle: options.lineStyle || "solid",
    fill: options.fill || "none",
    innerLineStyle: options.innerLineStyle || "solid",
    innerFill: options.innerFill || "none",
    x: options.x ?? GRID * 3 + ((number - 1) % 3) * (GRID * 6),
    y: options.y ?? GRID * 3 + Math.floor((number - 1) / 3) * (GRID * 4),
  };
  state.nextNodeId += 1;
  state.nodes.push(node);
  if (!options.silent) {
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
    preserveDirection: Boolean(options.preserveDirection),
  };
  state.nextEdgeId += 1;
  state.edges.push(edge);
  state.selection = { kind: "edge", id: edge.id };
  return edge;
}

function setMode(mode) {
  state.mode = mode;
  state.pendingConnection = null;
  state.selection = null;
  state.suppressClickNodeId = null;
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

  state.selection = { kind: "node", id: nodeId };
  render();
}

function selectEdge(edgeId) {
  state.selection = { kind: "edge", id: edgeId };
  render();
}

function render() {
  renderCanvas();
  renderInspector();
  renderLists();
  renderSavedDiagrams();
  renderControls();
}

function renderCanvas() {
  syncCanvasMetrics();
  const defs = canvas.querySelector("defs");
  canvas.innerHTML = "";
  canvas.appendChild(defs);
  canvas.onclick = handleCanvasBlankClick;
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
    }
    group.appendChild(path);

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
    group.dataset.nodeId = node.id;
    group.setAttribute("transform", `translate(${node.x}, ${node.y})`);

    const type = getType(node.type);

    const shape = createEntityShape(node.type);
    applyEntityStyles(shape, node);
    group.appendChild(shape);

    const title = document.createElementNS(svgNs, "text");
    title.classList.add("entity-text");
    title.setAttribute("x", BOX.width / 2);
    title.setAttribute("y", node.type === "individual" ? BOX.height + 20 : BOX.height / 2 + 6);
    title.setAttribute("font-size", "20");
    title.setAttribute("font-weight", "700");
    title.setAttribute("text-anchor", "middle");
    title.textContent = node.label;
    group.appendChild(title);

    canvas.appendChild(group);
  });

}

function renderInspector() {
  const node = getSelectedNode();
  const edge = getSelectedEdge();
  const hasSelection = Boolean(node || edge);

  emptySelection.classList.toggle("hidden", hasSelection);
  entityForm.classList.toggle("hidden", !node);
  edgeForm.classList.toggle("hidden", !edge);

  if (node) {
    selectionType.textContent = "Entity selected";
    document.getElementById("entityLabel").value = node.label;
    document.getElementById("entityType").value = node.type;
    document.getElementById("entityJurisdiction").value = node.jurisdiction;
    document.getElementById("entityNotes").value = node.notes;
    document.getElementById("entityLineStyle").value = node.lineStyle || "solid";
    document.getElementById("entityFill").value = node.fill || "none";
    document.getElementById("entityInnerLineStyle").value = node.innerLineStyle || "solid";
    document.getElementById("entityInnerFill").value = node.innerFill || "none";
    const supportsInnerShape = ["dreg", "hybrid-partnership", "reverse-hybrid"].includes(
      node.type,
    );
    document
      .getElementById("entityInnerLineStyleGroup")
      .classList.toggle("hidden", !supportsInnerShape);
    document
      .getElementById("entityInnerFillGroup")
      .classList.toggle("hidden", !supportsInnerShape);
  } else if (edge) {
    selectionType.textContent = "Relationship selected";
    document.getElementById("edgeLabel").value = edge.label;
    document.getElementById("edgePercent").value = edge.percent;
    document.getElementById("edgeKind").value = edge.kind;
    document.getElementById("edgeColor").value = edge.color || "black";
    document.getElementById("edgeLineStyle").value = edge.lineStyle || "solid";
    document.getElementById("reverseEdge").disabled = edge.kind !== "transaction";
    document.getElementById("entityInnerLineStyleGroup").classList.add("hidden");
    document.getElementById("entityInnerFillGroup").classList.add("hidden");
  } else {
    selectionType.textContent = "Nothing selected";
    document.getElementById("reverseEdge").disabled = true;
    document.getElementById("entityInnerLineStyleGroup").classList.add("hidden");
    document.getElementById("entityInnerFillGroup").classList.add("hidden");
  }
}

function renderLists() {
  diagramStats.textContent = `${state.nodes.length} entities / ${state.edges.length} relationships`;

  entityList.innerHTML = "";
  state.nodes.forEach((node) => {
    const button = document.createElement("button");
    button.className = "secondary-button";
    if (isSelected("node", node.id)) button.classList.add("active");
    button.textContent = `${node.label} · ${getType(node.type).shortLabel}`;
    button.addEventListener("click", () => {
      state.selection = { kind: "node", id: node.id };
      render();
    });
    entityList.appendChild(button);
  });

  edgeList.innerHTML = "";
  state.edges.forEach((edge) => {
    const from = state.nodes.find((node) => node.id === edge.from);
    const to = state.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const button = document.createElement("button");
    button.className = "secondary-button";
    if (isSelected("edge", edge.id)) button.classList.add("active");
    const label = edge.kind === "ownership"
      ? [edge.percent, edge.label].filter(Boolean).join(" · ")
      : edge.label || "Transaction";
    button.textContent = `${from.label} → ${to.label} · ${label}`;
    button.addEventListener("click", () => {
      state.selection = { kind: "edge", id: edge.id };
      render();
    });
    edgeList.appendChild(button);
  });
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
    if (shape.tagName !== "line") {
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

function createEntityShape(typeKey) {
  if (typeKey === "individual") {
    return createIndividualShape();
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

function createIndividualShape() {
  const group = document.createElementNS(svgNs, "g");

  const head = document.createElementNS(svgNs, "circle");
  head.classList.add("entity-rect");
  head.setAttribute("cx", BOX.width / 2);
  head.setAttribute("cy", 22);
  head.setAttribute("r", 16);
  head.setAttribute("fill", "none");
  head.setAttribute("stroke", "#514236");
  group.appendChild(head);

  const body = document.createElementNS(svgNs, "line");
  body.classList.add("entity-rect");
  body.setAttribute("x1", BOX.width / 2);
  body.setAttribute("y1", 38);
  body.setAttribute("x2", BOX.width / 2);
  body.setAttribute("y2", 74);
  body.setAttribute("stroke", "#514236");
  group.appendChild(body);

  const arms = document.createElementNS(svgNs, "line");
  arms.classList.add("entity-rect");
  arms.setAttribute("x1", BOX.width / 2 - 26);
  arms.setAttribute("y1", 50);
  arms.setAttribute("x2", BOX.width / 2 + 26);
  arms.setAttribute("y2", 50);
  arms.setAttribute("stroke", "#514236");
  group.appendChild(arms);

  const leftLeg = document.createElementNS(svgNs, "line");
  leftLeg.classList.add("entity-rect");
  leftLeg.setAttribute("x1", BOX.width / 2);
  leftLeg.setAttribute("y1", 74);
  leftLeg.setAttribute("x2", BOX.width / 2 - 22);
  leftLeg.setAttribute("y2", BOX.height - 6);
  leftLeg.setAttribute("stroke", "#514236");
  group.appendChild(leftLeg);

  const rightLeg = document.createElementNS(svgNs, "line");
  rightLeg.classList.add("entity-rect");
  rightLeg.setAttribute("x1", BOX.width / 2);
  rightLeg.setAttribute("y1", 74);
  rightLeg.setAttribute("x2", BOX.width / 2 + 22);
  rightLeg.setAttribute("y2", BOX.height - 6);
  rightLeg.setAttribute("stroke", "#514236");
  group.appendChild(rightLeg);

  return group;
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

function edgeColorValue(color) {
  if (color === "red") return "#b0392f";
  if (color === "blue") return "#245ea8";
  return "#1e1a17";
}

function isSelected(kind, id) {
  return state.selection?.kind === kind && state.selection?.id === id;
}

function getSelectedNode() {
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
  const node = getSelectedNode();
  if (!node) return;
  state.nodes = state.nodes.filter((candidate) => candidate.id !== node.id);
  state.edges = state.edges.filter((edge) => edge.from !== node.id && edge.to !== node.id);
  state.selection = null;
  render();
}

function deleteSelectedEdge() {
  const edge = getSelectedEdge();
  if (!edge) return;
  state.edges = state.edges.filter((candidate) => candidate.id !== edge.id);
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
  state.selection = null;
  state.pendingConnection = null;
  state.nextNodeId = 1;
  state.nextEdgeId = 1;
  render();
}

function autoLayout() {
  syncCanvasMetrics();
  const columns = Math.max(1, Math.ceil(Math.sqrt(state.nodes.length)));
  state.nodes.forEach((node, index) => {
    node.x = GRID * 2 + (index % columns) * (GRID * 4);
    node.y = GRID * 3 + Math.floor(index / columns) * (GRID * 4);
  });
  render();
}

function handleCanvasBlankClick(event) {
  if (event.target === canvas && state.mode === "select") {
    state.selection = null;
    render();
  }
}

function handleCanvasMouseDown(event) {
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
  state.drag = {
    nodeId,
    offsetX: point.x - node.x,
    offsetY: point.y - node.y,
    startX: node.x,
    startY: node.y,
    moved: false,
  };
}

function handleCanvasMouseMove(event) {
  syncCanvasMetrics();

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
  const node = state.nodes.find((candidate) => candidate.id === state.drag.nodeId);
  if (!node) return;
  const point = svgPoint(event);
  const rawX = Math.max(20, point.x - state.drag.offsetX);
  const rawY = Math.max(20, point.y - state.drag.offsetY);
  node.x = snapToGrid(rawX);
  node.y = snapToGrid(rawY);
  const movedX = Math.abs(node.x - state.drag.startX);
  const movedY = Math.abs(node.y - state.drag.startY);
  state.drag.moved = movedX > 3 || movedY > 3;
  render();
}

function handleCanvasMouseUp() {
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
  const bendVariants = [0, -70, 70, -140, 140, -220, 220];

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
          bendBias,
        );
        if (candidate) candidates.push(candidate);
      });
    });
  });

  candidates.sort((a, b) => a.score - b.score);
  return candidates[0] || fallbackTransactionGeometry(from, to);
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

  const spacing = 44;
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
  bendBias = 0,
) {
  const dx = toAnchor.point.x - fromAnchor.point.x;
  const dy = toAnchor.point.y - fromAnchor.point.y;
  const controlDistance = Math.max(54, Math.min(120, Math.hypot(dx, dy) * 0.35));
  const normalLength = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / normalLength, y: dx / normalLength };
  const totalBend = siblingOffset + bendBias;
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
    Math.abs(bendBias) * 0.1 +
    Math.hypot(dx, dy);

  return {
    score,
    path: `M ${startPoint.x} ${startPoint.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${endPoint.x} ${endPoint.y}`,
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

    const startY = parent.y + BOX.height;
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
    y: parent.y + BOX.height,
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
    ? { segmentIndex: 0, t: labelTForSegment(points[0], points[1]) }
    : { segmentIndex: 2, t: labelTForSegment(points[2], points[3]) };
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
    const branchDirection =
      segmentIndex === 0
        ? directions.parentBranchDirection
        : directions.childBranchDirection;
    return {
      x: point.x + branchDirection * 12,
      y: point.y,
      anchor: branchDirection < 0 ? "end" : "start",
    };
  }

  return {
    x: point.x,
    y: point.y - 8,
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
      best = {
        segmentIndex: index,
        t: projection.t,
        distance: projection.distance,
      };
    }
  }

  return best
    ? {
        segmentIndex: best.segmentIndex,
        t: best.t,
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
    /^(?:add|create)\s+(?:a|an)\s+new\s+owner\s+of\s+(.+)$/i,
  );
  if (createOwnerMatch) {
    const owned = resolveEntityReference(createOwnerMatch[1], entityMap, context);
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
  return findOrCreateEntity(rawName, entityMap);
}

function defaultNarrativeLabel(value, typeKey) {
  const lowered = value.toLowerCase();
  if (lowered === "individual") return "Individual";
  if (lowered === "partnership") return "Partnership";
  if (lowered === "corporation") return "Corporation";
  if (lowered === "trust") return "Trust";
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
    autoLayout();
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
  state.nextNodeId = payload.nextNodeId || state.nodes.length + 1;
  state.nextEdgeId = payload.nextEdgeId || state.edges.length + 1;
  state.selection = null;
  state.pendingConnection = null;
  state.drag = null;
  state.edgeDrag = null;
  state.labelDrag = null;
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
  const serializer = new XMLSerializer();
  const clone = canvas.cloneNode(true);
  inlineExportStyles(clone);
  clone.setAttribute("xmlns", svgNs);
  clone.setAttribute("width", "1400");
  clone.setAttribute("height", "900");
  const svgString = serializer.serializeToString(clone);
  downloadBlob(svgString, "tax-structure-diagram.svg", "image/svg+xml");
}

function exportPng() {
  const serializer = new XMLSerializer();
  const clone = canvas.cloneNode(true);
  inlineExportStyles(clone);
  clone.setAttribute("xmlns", svgNs);
  clone.setAttribute("width", "1400");
  clone.setAttribute("height", "900");
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1400;
    tempCanvas.height = 900;
    const context = tempCanvas.getContext("2d");
    context.fillStyle = "#f7f1e8";
    context.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    context.drawImage(image, 0, 0);
    tempCanvas.toBlob((blob) => {
      downloadBlob(blob, "tax-structure-diagram.png", "image/png");
      URL.revokeObjectURL(url);
    });
  };

  image.onerror = () => {
    URL.revokeObjectURL(url);
    window.alert("PNG export failed in this browser. SVG export is still available.");
  };

  image.src = url;
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

init();
