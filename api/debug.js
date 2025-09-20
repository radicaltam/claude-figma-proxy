// Debug endpoint to check environment variables
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    return res.status(200).json({
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'No key found',
      timestamp: new Date().toISOString(),
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('ANTHROPIC')),
      nodeVersion: process.version
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
