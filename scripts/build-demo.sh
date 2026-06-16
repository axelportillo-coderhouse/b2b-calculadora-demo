#!/usr/bin/env bash
# Construye la demo como sitio 100% estático en /out, listo para GitHub Pages.
#
# Uso:
#   npm run build:demo                 # basePath = "/<nombre-del-repo>" (auto)
#   BASE_PATH=/mi-subpath npm run build:demo
#
# El basePath debe igualar el subpath del repo público en Pages
# (https://<usuario>.github.io/<repo>/). Por defecto usamos el nombre
# de la carpeta del proyecto.
set -euo pipefail

cd "$(dirname "$0")/.."

# basePath: explícito por env, o el nombre de la carpeta del repo.
BASE_PATH="${BASE_PATH:-/$(basename "$(pwd)")}"

echo "▲ Build demo estático"
echo "  NEXT_PUBLIC_DEMO=1"
echo "  basePath=$BASE_PATH"
echo ""

rm -rf out .next

NEXT_PUBLIC_DEMO=1 NEXT_PUBLIC_BASE_PATH="$BASE_PATH" next build

# GitHub Pages ignora carpetas que empiezan con "_" (como _next/) salvo
# que exista un .nojekyll en la raíz del sitio.
touch out/.nojekyll

echo ""
echo "✓ Listo. Sitio estático en ./out (basePath=$BASE_PATH)"
echo "  Probalo local:  npx serve out -l 5050   (ojo: los assets usan $BASE_PATH)"
echo "  Deploy:         npm run deploy:demo"
