#!/bin/bash

# GitHub Repository Setup Script for Claude Figma Proxy

echo "🚀 Setting up GitHub repository for Claude Figma Proxy..."

# Initialize git repository
echo "📦 Initializing git repository..."
git init

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Claude API proxy for Figma plugins

- CORS-enabled proxy server for Claude API
- Vercel deployment configuration
- GitHub Actions workflow for auto-deployment
- Comprehensive error handling and security"

# Create main branch
echo "🌿 Setting up main branch..."
git branch -M main

echo ""
echo "✅ Git repository initialized!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Copy the repository URL"
echo "3. Run: git remote add origin <YOUR_GITHUB_REPO_URL>"
echo "4. Run: git push -u origin main"
echo "5. Connect the repository to Vercel for auto-deployment"
echo ""
echo "🔗 GitHub repository creation: https://github.com/new"
echo ""