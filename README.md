# Conduction Design System

The Conduction Design System, published as a static site at **[designsystem.conduction.nl](https://designsystem.conduction.nl)**.

## Structure

Static HTML, CSS, and assets live at the repo root and are served directly by GitHub Pages from the `main` branch.

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

GitHub Pages is configured to publish `main` / root with the custom domain set via the `CNAME` file. No build step.
