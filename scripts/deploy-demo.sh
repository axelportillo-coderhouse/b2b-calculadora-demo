#!/usr/bin/env bash
# Publica SOLO el sitio estático (./out) en un repo público de GitHub Pages.
# El código fuente NO se sube: queda en este repo (privado). Al repo público
# solo van los bundles compilados que sirve Pages.
#
# Uso:
#   DEPLOY_REPO=git@github.com:usuario/b2b-calculadora-demo.git npm run deploy:demo
#
# Variables:
#   DEPLOY_REPO    (requerido) URL git del repo público de Pages
#   DEPLOY_BRANCH  (opcional)  rama a publicar — default: gh-pages
#   BASE_PATH      (opcional)  subpath en Pages — default: /<nombre-del-repo>
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${DEPLOY_REPO:-}" ]; then
  echo "ERROR: definí DEPLOY_REPO con la URL del repo público de Pages." >&2
  echo "  ej: DEPLOY_REPO=git@github.com:usuario/b2b-calculadora-demo.git npm run deploy:demo" >&2
  exit 1
fi

DEPLOY_BRANCH="${DEPLOY_BRANCH:-gh-pages}"

# 1. Build estático (genera ./out + .nojekyll)
bash scripts/build-demo.sh

# 2. Publicar ./out como raíz del repo/rama de Pages (historial limpio).
echo ""
echo "▲ Publicando ./out en $DEPLOY_REPO ($DEPLOY_BRANCH)"

TMP_MSG="deploy demo $(date -u +%Y-%m-%dT%H:%M:%SZ)"
(
  cd out
  rm -rf .git
  git init -q
  git checkout -q -b "$DEPLOY_BRANCH"
  git add -A
  git -c user.email="demo@coderhouse.com" -c user.name="Coder Demo Bot" commit -q -m "$TMP_MSG"
  git push -q --force "$DEPLOY_REPO" "$DEPLOY_BRANCH"
  rm -rf .git
)

echo ""
echo "✓ Publicado. En GitHub: Settings → Pages → Branch: $DEPLOY_BRANCH / (root)"
echo "  URL: https://<usuario>.github.io/<repo>/"
