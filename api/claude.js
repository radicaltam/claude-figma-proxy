/**
 * Claude API Proxy for Figma Plugins
 * Handles CORS and forwards requests to Claude API
 */

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
    return;
  }

  try {
    // Extract API key from headers
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(400).json({
        error: 'Missing API key',
        message: 'Please provide your Claude API key in x-api-key header or Authorization header'
      });
      return;
    }

    // Validate request body
    const { model, messages, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(400).json({
        error: 'Invalid request',
        message: 'Messages array is required'
      });
      return;
    }

    // Prepare request to Claude API
    const claudeRequest = {
      model: model || 'claude-3-sonnet-20240229',
      max_tokens: max_tokens || 1000,
      messages: messages
    };

    console.log('Proxying request to Claude API:', { model: claudeRequest.model, messageCount: messages.length });

    // Forward request to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    });

    // Get response data
    const data = await response.text();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    // Forward response status and headers
    res.status(response.status);

    // Handle different content types
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (e) {
        res.json({ error: 'Invalid JSON response from Claude API', rawResponse: data });
      }
    } else {
      res.send(data);
    }

  } catch (error) {
    console.error('Proxy error:', error);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      error: 'Proxy server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}