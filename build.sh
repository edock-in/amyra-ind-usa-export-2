#!/bin/sh
# Assembles src/ into:
#   index.html     the page as a standalone document you can open or host anywhere
#   artifact.html  the same page without the document wrapper, for hosts that add
#                  their own doctype, charset and viewport (such as Claude artifacts)
# No dependencies. Run it after every change in src/ and commit the results.
set -e
cd "$(dirname "$0")"

TITLE="Goods Out, Money Home"
DESC="Follow a cushion cover, a pouch of pepper or a wooden toy from an Indian workshop to an American doorstep through Amazon, and the money back home."
URL="https://games.edock.io/amyra-ind-usa-export-2"

# The head and body tags are optional in HTML. Leaving them out lets the parser put
# the title, fonts and styles from src/ into the head, as in the Artifact host.
wrap() { # $1 title, $2 description, $3 url
  printf '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<meta name="description" content="%s">\n' "$2"
  printf '<meta property="og:title" content="%s">\n<meta property="og:description" content="%s">\n' "$1" "$2"
  printf '<meta property="og:url" content="%s">\n<meta property="og:type" content="website">\n' "$3"
  printf '<meta name="theme-color" content="#07080F" media="(prefers-color-scheme: dark)">\n'
  printf '<meta name="theme-color" content="#F3F0EB" media="(prefers-color-scheme: light)">\n'
  printf '<link rel="canonical" href="%s">\n' "$3"
}

{
  cat src/head.html
  cat src/body.html
  # Pinned by hash (cdnjs's published SRI): a changed file on the CDN is refused,
  # not run. games.edock.io shares a sign-in cookie with every edock.io site, so
  # nothing from outside may run here unpinned. Bump the hash with the version.
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js" integrity="sha512-vc58qvvBdrDR4etbxMdlTt4GBQk1qjvyORR2nrsPsFPyrs+/u5c3+1Ct6upOgdZoIl7eq6k3a1UPDSNAQi/32A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>'
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js" integrity="sha512-4UKI/XKm3xrvJ6pZS5oTRvIQGIzZFoXR71rRBb1y2N+PbwAsKa5tPl2J6WvbEvwN3TxQCm8hMzsl/pO+82iRlg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>'
  echo '<script>'
  cat src/data-products.js src/data-content.js
  echo '</script>'
  echo '<script type="module">'
  cat src/globe.js src/app.js src/panels.js src/tour.js
  echo '</script>'
} > artifact.html

{
  wrap "$TITLE" "$DESC" "$URL"
  cat artifact.html
  printf '</html>\n'
} > index.html

echo "built index.html ($(wc -c < index.html | tr -d ' ') bytes) and artifact.html"
