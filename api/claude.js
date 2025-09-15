// api/claude.js - Complete Working Vercel Proxy for Claude API
// Place this file at: /api/claude.js in your Vercel project

export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);

  // COMPREHENSIVE CORS HEADERS - This fixes your CORS errors
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', [
    'Content-Type',
    'Authorization', 
    'x-api-key',
    'anthropic-version',  // This was missing and causing your CORS errors
    'Accept',
    'Origin',
    'X-Requested-With'
  ].join(', '));
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  // Only allow POST requests for the actual API calls
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Get API key from environment variables (SECURE)
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error('CLAUDE_API_KEY environment variable not set');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: API key not configured' 
      });
    }

    // Extract request data
    const { model, messages, max_tokens, temperature, system } = req.body;
    
    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages in request:', messages);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid request: messages array is required and must not be empty' 
      });
    }

    // Prepare Claude API request
    const claudeRequestBody = {
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: max_tokens || 1000,
      messages: messages,
      temperature: temperature || 0.7
    };

    // Add system prompt if provided
    if (system) {
      claudeRequestBody.system = system;
    }

    console.log('Making request to Claude API with:', {
      model: claudeRequestBody.model,
      max_tokens: claudeRequestBody.max_tokens,
      messages_count: claudeRequestBody.messages.length,
      temperature: claudeRequestBody.temperature
    });

    // Make request to Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequestBody)
    });

    console.log('Claude API response status:', claudeResponse.status);

    // Get response text first for debugging
    const responseText = await claudeResponse.text();
    console.log('Claude API response body:', responseText.substring(0, 500) + '...');

    if (!claudeResponse.ok) {
      console.error('Claude API error:', responseText);
      
      // Return error in consistent format
      return res.status(claudeResponse.status).json({
        success: false,
        error: `Claude API error (${claudeResponse.status})`,
        details: responseText,
        claude_status: claudeResponse.status
      });
    }

    // Parse successful response
    let claudeData;
    try {
      claudeData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse Claude API response',
        details: parseError.message
      });
    }

    console.log('Claude API success:', {
      id: claudeData.id,
      model: claudeData.model,
      usage: claudeData.usage
    });

    // Return successful response in the format your client expects
    return res.status(200).json({
      success: true,
      content: claudeData.content && claudeData.content[0] ? claudeData.content[0].text : 'No content',
      rawResponse: claudeData,
      // Also include the standard Claude format for flexibility
      id: claudeData.id,
      type: claudeData.type,
      role: claudeData.role,
      model: claudeData.model,
      usage: claudeData.usage
    });

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Detailed error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Alternative handler if you need different behavior
export async function handleClaudeRequest(req, res) {
  // This is an alternative approach if the above doesn't work
  
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, anthropic-version',
  };
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Return in your expected format
    return res.status(200).json({
      success: true,
      content: data.content?.[0]?.text || '',
      data: data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
