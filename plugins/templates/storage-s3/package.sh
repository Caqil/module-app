#!/bin/bash
# Package storage-s3 for distribution

echo "📦 Packaging storage-s3..."

# Create zip file
cd "$(dirname "$0")"
zip -r "../storage-s3.zip" . -x "*.DS_Store" "package.sh" "node_modules/*"

echo "✅ Plugin packaged as storage-s3.zip"
echo "📁 Ready for upload!"
