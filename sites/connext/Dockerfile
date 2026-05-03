# =============================================================
# sites/connext, Docusaurus 3 dev container
# -------------------------------------------------------------
# Build context is the design-system monorepo root, so npm
# install resolves @conduction/diagrams + @conduction/docusaurus-
# preset via workspace links. Hot-reload works through the
# volume mount declared in docker-compose.yml.
#
# Usage from the repo root:
#   docker compose up
#   → http://localhost:3000
# =============================================================

FROM node:20-alpine

WORKDIR /app

# Install only what npm needs for workspace resolution first,
# so the install layer caches when source-only files change.
COPY package.json ./
COPY diagrams/package.json ./diagrams/
COPY docusaurus-preset/package.json ./docusaurus-preset/
COPY sites/connext/package.json ./sites/connext/

# npm 10 ships with Node 20; supports workspaces natively
RUN npm install --include=dev

# Bring in the rest of the source. node_modules stays in the
# container's volumes (see docker-compose), not from host.
COPY . .

EXPOSE 3000

# Docusaurus dev server, bound to 0.0.0.0 so the host can reach it
WORKDIR /app/sites/connext
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "3000"]
