#!/bin/bash

# Automated Update and Deploy Script
# This script commits changes and pushes to GitHub, which triggers Vercel deployment

echo "🚀 Automated Claude Proxy Update & Deploy"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the claude-proxy directory"
    exit 1
fi

# Get commit message from user or use default
if [ -z "$1" ]; then
    COMMIT_MSG="Update proxy configuration"
else
    COMMIT_MSG="$1"
fi

echo "📝 Commit message: $COMMIT_MSG"
echo ""

# Stage all changes
echo "📦 Staging changes..."
git add .

# Check if there are any changes
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Commit changes
echo "💾 Committing changes..."
git commit -m "$COMMIT_MSG"

# Push to GitHub (triggers Vercel deployment)
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Update complete!"
echo "🔄 Vercel will automatically deploy your changes"
echo "🌐 Your proxy URL: https://claude-figma-proxy.vercel.app/api/claude"
echo ""
echo "📋 To check deployment status:"
echo "   https://vercel.com/radicaltan/claude-figma-proxy"