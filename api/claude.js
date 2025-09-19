// Claude API Proxy for Figma Plugins
  // Accepts API key from request headers for client-side usage

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

      // Get API key from request headers (client-side)
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

      if (!apiKey) {
        console.error('ERROR: No API key provided in request headers');
        return res.status(400).json({
          error: 'API key required',
          message: 'Please provide your Claude API key in x-api-key header',
          timestamp: new Date().toISOString()
        });
      }

      console.log('API key received from client (length:', apiKey.length, ')');

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
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: max_tokens || 1000,
        messageCount: messages.length,
        temperature: temperature || 0.8
      });

      // Prepare Claude API request
      const claudeRequest = {
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: max_tokens || 1000,
        messages: messages,
        temperature: temperature || 0.8
      };

      console.log('Calling Claude API...');

      // Call Claude API
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

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error('Claude API Error:', {
          status: claudeResponse.status,
          statusText: claudeResponse.statusText,
          body: errorText
        });

        return res.status(claudeResponse.status).json({
          error: `Claude API error: ${claudeResponse.status}`,
          statusText: claudeResponse.statusText,
          details: errorText,
          timestamp: new Date().toISOString()
        });
      }

      // Parse successful response
      const claudeData = await claudeResponse.json();

      console.log('Claude API Success - Content length:', claudeData.content?.[0]?.text?.length || 0);
      console.log('=== Claude API Proxy Request Completed Successfully ===');

      // Return successful response
      return res.status(200).json(claudeData);

    } catch (error) {
      console.error('=== Claude API Proxy Error ===');
      console.error('Error:', error.message);

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
