#!/bin/bash
# Page Composer — portable install script
# Copies the page composer into any MLflow repo and wires up the route + sidebar link.
#
# Usage:
#   ./install.sh /path/to/mlflow-downstream
#   ./install.sh /path/to/mlflow          # upstream (already installed)
#
# To compare upstream vs downstream:
#   1. Run upstream:   cd ~/Desktop/ODH/mlflow/mlflow/server/js && PORT=3333 yarn start
#   2. Run downstream: cd ~/Desktop/ODH/mlflow-downstream/mlflow/server/js && PORT=3334 yarn start
#   3. Open both: localhost:3333/#/page-composer and localhost:3334/#/page-composer
#   4. Import the same JSON in both to compare styles

set -euo pipefail

TARGET="${1:?Usage: $0 /path/to/mlflow-repo}"
JS_DIR="$TARGET/mlflow/server/js"
SRC_DIR="$JS_DIR/src"
COMPOSER_DIR="$SRC_DIR/page-composer"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$JS_DIR/package.json" ]; then
  echo "Error: $JS_DIR/package.json not found. Is this an MLflow repo?"
  exit 1
fi

echo "Installing Page Composer into: $TARGET"

# 1. Copy page-composer directory
if [ -d "$COMPOSER_DIR" ]; then
  echo "  Updating existing page-composer..."
  rm -rf "$COMPOSER_DIR"
fi
cp -r "$SCRIPT_DIR" "$COMPOSER_DIR"
echo "  Copied page-composer/ ($(find "$COMPOSER_DIR" -type f | wc -l | tr -d ' ') files)"

# 2. Install Puck dependencies (if not already installed)
cd "$JS_DIR"
if ! grep -q "@puckeditor/core" package.json 2>/dev/null; then
  echo "  Installing @puckeditor/core and @puckeditor/plugin-emotion-cache..."
  yarn add @puckeditor/core @puckeditor/plugin-emotion-cache 2>&1 | tail -3
else
  echo "  Puck dependencies already installed"
fi

# 3. Check if route is already wired
if grep -q "page-composer" "$SRC_DIR/MlflowRouter.tsx" 2>/dev/null; then
  echo "  Route already wired in MlflowRouter.tsx"
else
  echo "  NOTE: Add the page-composer route to MlflowRouter.tsx manually:"
  echo ""
  echo "    ...(process.env['NODE_ENV'] === 'development'"
  echo "      ? [{"
  echo "          path: '/page-composer',"
  echo "          element: createLazyRouteElement(() => import('./page-composer/PageComposer')),"
  echo "          pageId: 'mlflow.dev.page-composer',"
  echo "        }]"
  echo "      : []),"
  echo ""
fi

# 4. Check if sidebar link is already wired
if grep -q "page-composer" "$SRC_DIR/common/components/MlflowSidebar.tsx" 2>/dev/null; then
  echo "  Sidebar link already wired"
else
  echo "  NOTE: Add the sidebar link to MlflowSidebar.tsx manually (dev-only):"
  echo ""
  echo "    {process.env['NODE_ENV'] === 'development' && ("
  echo "      <MlflowSidebarLink"
  echo "        to=\"/page-composer\""
  echo "        componentId=\"mlflow.sidebar.page_composer_link\""
  echo "        isActive={(loc) => loc.pathname === '/page-composer'}"
  echo "        icon={<GridIcon />}"
  echo "        collapsed={!showSidebar}"
  echo "      >"
  echo "        Composer"
  echo "      </MlflowSidebarLink>"
  echo "    )}"
  echo ""
fi

echo ""
echo "Done! Run 'yarn start' in $JS_DIR to use the Page Composer."
echo "Access at: http://localhost:3000/#/page-composer"
