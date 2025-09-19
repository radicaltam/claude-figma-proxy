#!/bin/bash

# Claude Proxy Deployment Script for Vercel

echo "🚀 Deploying Claude API Proxy to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the claude-proxy directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the deployment URL provided by Vercel"
echo "2. Update your Figma plugin's manifest.json with the new URL"
echo "3. Test the connection in your Figma plugin"
echo ""
echo "🔗 The proxy endpoint will be: https://your-deployment-url.vercel.app/api/claude"
echo ""