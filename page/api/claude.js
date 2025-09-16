// api/claude.js - SECURE VERSION (Environment Variables Only)
export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // SECURE: Only use API key from environment variables
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      console.error('CLAUDE_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Server configuration error: API key not configured' });
    }

    console.log('Using API key from environment (secure method)');

    // Validate request body
    const { model, messages, max_tokens, temperature } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages:', messages);
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Prepare Claude API request
    const claudeRequest = {
      model: model || 'claude-3-haiku-20240307',
      max_tokens: max_tokens || 1000,
      messages: messages,
      temperature: temperature || 0.7
    };

    console.log('Calling Claude API with:', {
      model: claudeRequest.model,
      max_tokens: claudeRequest.max_tokens,
      messages_count: claudeRequest.messages.length
    });

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    });

    console.log('Claude API response status:', claudeResponse.status);

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      return res.status(claudeResponse.status).json({ 
        error: 'Claude API error', 
        details: errorText 
      });
    }

    const claudeData = await claudeResponse.json();
    console.log('Claude API success');

    // Return raw Claude response
    return res.status(200).json(claudeData);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
