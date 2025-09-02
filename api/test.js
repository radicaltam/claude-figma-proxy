// /api/test.js - Simple test endpoint to verify CORS and deployment

export default async function handler(req, res) {
  // Same CORS headers as main API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Simple test response
  return res.status(200).json({
    success: true,
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers,
    env_check: {
      has_api_key: !!process.env.ANTHROPIC_API_KEY,
      api_key_length: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0
    }
  });
}
