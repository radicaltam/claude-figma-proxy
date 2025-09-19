<<<<<<< HEAD
# Claude API Proxy for Figma Plugins

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/claude-figma-proxy)

A secure proxy server with automatic GitHub → Vercel deployment to enable Claude API access from Figma plugins by handling CORS restrictions.

## Features

- ✅ **CORS handling** - Allows requests from Figma plugins
- ✅ **Secure** - API keys are passed through, not stored
- ✅ **Auto-deployment** - GitHub integration with Vercel
- ✅ **Fast** - Deployed on Vercel edge network
- ✅ **Error handling** - Comprehensive error responses

## Quick Setup (Recommended)

### 1. Fork & Deploy
1. **Fork this repository** to your GitHub account
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your forked repository
   - Deploy!

### 2. Get Your URL
After deployment, you'll get a URL like:
```
https://claude-figma-proxy-abc123.vercel.app
```

### 3. Auto-Deployment Setup
- Every push to `main` branch automatically deploys to production
- Pull requests create preview deployments
- No manual deployment needed!

## API Usage

### Endpoint
```
POST https://your-proxy-name.vercel.app/api/claude
```

### Headers
```
Content-Type: application/json
x-api-key: your-claude-api-key
```

### Request Body
```json
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 1000,
  "messages": [
    {
      "role": "user",
      "content": "Your prompt here"
    }
  ]
}
```

### Response
Returns the same response format as Claude API with proper CORS headers.

## Security Notes

- ✅ API keys are never stored on the server
- ✅ All requests are forwarded directly to Claude API
- ✅ No logging of sensitive data
- ✅ Rate limiting handled by Claude API
- ✅ HTTPS enforced by Vercel

## Testing

You can test the proxy with curl:
```bash
curl -X POST https://your-proxy-name.vercel.app/api/claude \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-claude-api-key" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Test locally at http://localhost:3000/api/claude
```

---

**Generated for Texas Health Resources Figma Plugin**
=======
# claude-figma-proxy
>>>>>>> origin/main
