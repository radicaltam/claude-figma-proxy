// /api/claude.js - Complete Vercel proxy with proper CORS and CSP headers

export default async function handler(req, res) {
  console.log('Claude Proxy - Incoming request:', req.method, req.url);
  
  // Comprehensive CORS and CSP headers to fix Figma plugin CSP issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src *; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src * data: blob:; font-src *; frame-src *;");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*, geolocation=*');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Claude Proxy - Handling OPTIONS preflight');
    res.status(200).end();
    return;
  }
  
  // Only allow POST requests for Claude API
  if (req.method !== 'POST') {
    console.log('Claude Proxy - Method not allowed:', req.method);
    res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
    return;
  }
  
  try {
    // Validate request body
    const { prompt, context, format } = req.body;
    
    if (!prompt) {
      console.log('Claude Proxy - Missing prompt');
      res.status(400).json({ 
        success: false, 
        error: 'Missing required field: prompt' 
      });
      return;
    }
    
    console.log('Claude Proxy - Processing request for context:', context);
    
    // Get Claude API key from environment variables
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      console.error('Claude Proxy - Missing CLAUDE_API_KEY environment variable');
      res.status(500).json({ 
        success: false, 
        error: 'Server configuration error: Missing API key' 
      });
      return;
    }
    
    // Prepare Claude API request
    const claudeRequest = {
      model: "claude-3-sonnet-20240229", // or your preferred model
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };
    
    console.log('Claude Proxy - Calling Claude API...');
    
    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    });
    
    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude Proxy - Claude API error:', claudeResponse.status, errorText);
      
      res.status(claudeResponse.status).json({
        success: false,
        error: `Claude API error: ${claudeResponse.status} ${claudeResponse.statusText}`,
        details: errorText
      });
      return;
    }
    
    const claudeData = await claudeResponse.json();
    console.log('Claude Proxy - Claude API success');
    
    // Extract content from Claude response
    let content = '';
    if (claudeData.content && claudeData.content.length > 0) {
      content = claudeData.content[0].text || '';
    }
    
    if (!content) {
      console.log('Claude Proxy - No content in Claude response');
      res.status(200).json({
        success: false,
        error: 'No content generated',
        content: null
      });
      return;
    }
    
    // Try to parse as JSON if format is structured
    let parsedContent = content;
    if (format === 'structured') {
      try {
        parsedContent = JSON.parse(content);
        console.log('Claude Proxy - Successfully parsed structured JSON response');
      } catch (e) {
        console.log('Claude Proxy - Could not parse as JSON, returning raw text');
        // Keep as text, will be processed on client side
      }
    }
    
    // Return successful response
    res.status(200).json({
      success: true,
      content: parsedContent,
      usage: claudeData.usage || null,
      model: claudeData.model || null
    });
    
  } catch (error) {
    console.error('Claude Proxy - Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
