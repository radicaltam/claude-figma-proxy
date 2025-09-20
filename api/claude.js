// /api/claude.js - Latest version with comprehensive error handling and CORS support
// For Figma Plugin THR Layout Generator v52.0.0

export default async function handler(req, res) {
  // Comprehensive CORS headers for Figma plugin compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request received');
    return res.status(200).end();
  }

  // Only allow POST requests for actual API calls
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST', 'OPTIONS'],
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('=== Claude API Proxy Request Started ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User Agent:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    
    // Get API key from environment variable (secure server-side storage)
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Debug logging
    console.log('DEBUG: Environment variable check');
    console.log('DEBUG: process.env keys containing ANTHROPIC:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC')));
    console.log('DEBUG: ANTHROPIC_API_KEY exists:', !!apiKey);
    console.log('DEBUG: ANTHROPIC_API_KEY length:', apiKey ? apiKey.length : 0);
    console.log('DEBUG: ANTHROPIC_API_KEY prefix:', apiKey ? apiKey.substring(0, 15) + '...' : 'NONE');

    if (!apiKey) {
      console.error('CRITICAL: ANTHROPIC_API_KEY not found in environment variables');
      return res.status(500).json({
        error: 'Server configuration error - API key not configured',
        timestamp: new Date().toISOString(),
        debug: {
          hasApiKey: false,
          envKeys: Object.keys(process.env).filter(k => k.includes('ANTHROPIC')),
          allEnvKeyCount: Object.keys(process.env).length
        }
      });
    }

    console.log('SECURITY: API key loaded from environment (length:', apiKey.length, ')');

    // Validate request body
    if (!req.body) {
      console.error('ERROR: No request body provided');
      return res.status(400).json({ 
        error: 'Request body is required',
        timestamp: new Date().toISOString()
      });
    }

    const { model, max_tokens, messages, temperature } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('ERROR: Invalid or missing messages array');
      return res.status(400).json({ 
        error: 'Messages array is required and must not be empty',
        timestamp: new Date().toISOString()
      });
    }

    console.log('Request validated:', {
      model: model || 'claude-3-haiku-20240307',
      max_tokens: max_tokens || 1200,
      messageCount: messages.length,
      temperature: temperature || 0.8,
      firstMessageLength: messages[0]?.content?.length || 0
    });

    // Prepare Claude API request
    const claudeRequest = {
      model: model || 'claude-3-haiku-20240307',
      max_tokens: max_tokens || 1200,
      messages: messages,
      temperature: temperature || 0.8
    };

    console.log('Calling Claude API...');
    
    // Call Claude API with comprehensive error handling
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'User-Agent': 'THR-Figma-Plugin-Proxy/1.0'
      },
      body: JSON.stringify(claudeRequest)
    });

    console.log('Claude API Response Status:', claudeResponse.status);
    console.log('Claude API Response Headers:', Object.fromEntries(claudeResponse.headers.entries()));

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API Error Details:', {
        status: claudeResponse.status,
        statusText: claudeResponse.statusText,
        body: errorText,
        headers: Object.fromEntries(claudeResponse.headers.entries())
      });
      
      // Return detailed error information for debugging
      return res.status(claudeResponse.status).json({
        error: `Claude API error: ${claudeResponse.status}`,
        statusText: claudeResponse.statusText,
        details: errorText,
        timestamp: new Date().toISOString(),
        debugInfo: {
          requestModel: model,
          requestTokens: max_tokens,
          messageCount: messages.length
        }
      });
    }

    // Parse successful response
    const claudeData = await claudeResponse.json();
    
    console.log('Claude API Success:', {
      responseType: typeof claudeData,
      hasContent: !!claudeData.content,
      contentLength: claudeData.content ? claudeData.content.length : 0,
      contentType: claudeData.content?.[0]?.type,
      responseSize: JSON.stringify(claudeData).length,
      timestamp: new Date().toISOString()
    });

    // Log content preview for debugging (first 100 chars)
    if (claudeData.content && claudeData.content[0]?.text) {
      console.log('Content preview:', claudeData.content[0].text.substring(0, 100) + '...');
    }

    console.log('=== Claude API Proxy Request Completed Successfully ===');

    // Return successful response with CORS headers already set
    return res.status(200).json(claudeData);

  } catch (error) {
    console.error('=== Claude API Proxy Error ===');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Timestamp:', new Date().toISOString());
    
    // Return comprehensive error information
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      type: error.name,
      timestamp: new Date().toISOString(),
      requestInfo: {
        method: req.method,
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : []
      }
    });
  }
}
