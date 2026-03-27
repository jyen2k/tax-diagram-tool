# Tax Structure Chart Builder

A lightweight browser app for tax lawyers to create entity structure diagrams with ownership lines and transaction arrows.

## Current Features

- Tax-specific entity palette for corporations, partnerships, LLCs, disregarded entities, trusts, and individuals
- Drag-and-drop SVG canvas
- Separate relationship modes for ownership lines and transaction arrows
- Inspector panel for editing entity and relationship details
- Narrative drafting for simple plain-English structure descriptions
- JSON save/load plus SVG and PNG export

## Run Locally

Because this version is intentionally no-build, you can open [`index.html`](./index.html) directly in a browser.

For best results, serve it from a simple local web server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy To App Garden

This project includes an App Garden-ready `Dockerfile` that serves the static app on the `PORT`
provided by the platform.

The repo metadata lives in [`.appgarden.json`](./.appgarden.json) and uses the app name
`tax-flow-chart-tool`.

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
