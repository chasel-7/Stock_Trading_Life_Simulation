#!/bin/bash
set -e

echo "🔨 Building production bundle..."
npm run build

echo "📦 Build complete!"
echo "   Output: ./dist"
echo ""
echo "Deploy options:"
echo "  1. GitHub Pages: push dist/ to gh-pages branch"
echo "  2. Vercel: npx vercel ./dist"
echo "  3. Netlify: drag dist/ to netlify.com"
echo "  4. 静态服务器: npx serve dist"

echo ""
echo "🧪 Quick local preview:"
echo "   npx serve dist"
