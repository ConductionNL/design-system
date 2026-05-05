# =============================================================
# sites/academy, Docusaurus 3 dev container
# -------------------------------------------------------------
# academy.conduction.nl, the Conduction learning hub. Hosts
# blogs, guides, case studies, webinars, and tutorials in one
# feed, built on @conduction/docusaurus-preset.
#
# Build context is the design-system monorepo root, so npm
# install resolves @conduction/docusaurus-preset via workspace
# links. Hot-reload works through the volume mount declared
# in docker-compose.yml.
#
# Usage from the repo root:
#   docker compose up academy
#   → http://localhost:${ACADEMY_PORT:-3200}
# =============================================================

FROM node:20-alpine

WORKDIR /app

# Install only what npm needs for workspace resolution first,
# so the install layer caches when source-only files change.
COPY package.json ./
COPY diagrams/package.json ./diagrams/
COPY docusaurus-preset/package.json ./docusaurus-preset/
COPY sites/academy/package.json ./sites/academy/

RUN npm install --include=dev

COPY . .

EXPOSE 3000

WORKDIR /app/sites/academy
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "3000"]
