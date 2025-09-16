// /api/claude.js - Fixed version with comprehensive CORS handling

export default async function handler(req, res) {
  // COMPREHENSIVE CORS HEADERS for Figma plugin compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request received');
    res.status(200).end();
    return;
  }

  // Only allow POST requests for actual API calls
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST', 'OPTIONS']
    });
  }

  try {
    console.log('SECURITY: Using API key from environment (secure method)');
    
    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('SECURITY ERROR: No API key found in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error - API key not found'
      });
    }

    console.log('API Request received:', {
      method: req.method,
      headers: Object.keys(req.headers),
      bodyKeys: Object.keys(req.body || {}),
      userAgent: req.headers['user-agent']
    });

    // Validate request body
    if (!req.body) {
      console.error('No request body provided');
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { model, max_tokens, messages, temperature } = req.body;

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format');
      return res.status(400).json({ error: 'Messages array is required' });
    }

    console.log('Calling Claude API with:', {
      model: model || 'claude-3-haiku-20240307',
      max_tokens: max_tokens || 1200,
      messageCount: messages.length,
      temperature: temperature || 0.8
    });

    // Call Claude API with proper error handling
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'User-Agent': 'THR-Figma-Plugin/1.0'
      },
      body: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: max_tokens || 1200,
        messages: messages,
        temperature: temperature || 0.8
      })
    });

    console.log('Claude API Response Status:', claudeResponse.status);

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API Error:', claudeResponse.status, errorText);
      
      // Return detailed error for debugging
      return res.status(claudeResponse.status).json({
        error: `Claude API error: ${claudeResponse.status}`,
        details: errorText,
        timestamp: new Date().toISOString()
      });
    }

    const claudeData = await claudeResponse.json();
    console.log('Claude API Success:', {
      contentLength: JSON.stringify(claudeData).length,
      hasContent: !!claudeData.content,
      timestamp: new Date().toISOString()
    });

    // Return successful response with CORS headers
    res.status(200).json(claudeData);

  } catch (error) {
    console.error('Proxy Error:', error.message, error.stack);
    
    // Return detailed error for debugging
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']
    });
  }
}
