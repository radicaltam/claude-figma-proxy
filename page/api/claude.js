/**
 * Secure Claude API Proxy - Environment Variables Only
 * Version 2.0.0 - SECURITY FIXED: Server-side authentication only
 * 
 * Deploy this to: /api/claude.js in your Vercel project
 */

export default async function handler(req, res) {
    // SECURITY: Set CORS headers for Figma plugin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are supported' 
        });
    }
    
    try {
        // SECURITY FIX: Get API key from environment variables only
        const apiKey = process.env.CLAUDE_API_KEY;
        
        if (!apiKey) {
            console.error('SECURITY ERROR: CLAUDE_API_KEY environment variable not set');
            return res.status(500).json({ 
                error: 'Configuration error',
                message: 'API key not configured on server'
            });
        }
        
        // Log security confirmation (without exposing key)
        console.log('SECURITY: Using API key from environment (secure method)');
        console.log('SECURITY: Key length:', apiKey.length, 'characters');
        console.log('SECURITY: Key prefix:', apiKey.substring(0, 8) + '...');
        
        // Validate request body
        const { model, max_tokens, messages, temperature } = req.body;
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid request',
                message: 'Messages array is required' 
            });
        }
        
        // Prepare Claude API request
        const claudeRequest = {
            model: model || "claude-3-haiku-20240307",
            max_tokens: max_tokens || 1200,
            messages: messages,
            temperature: temperature || 0.8
        };
        
        console.log('SECURE REQUEST: Calling Claude API with model:', claudeRequest.model);
        console.log('SECURE REQUEST: Message count:', messages.length);
        console.log('SECURE REQUEST: First message preview:', messages[0]?.content?.substring(0, 100) + '...');
        
        // SECURITY FIX: Make secure request to Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey, // SECURE: API key from environment only
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(claudeRequest)
        });
        
        console.log('CLAUDE API RESPONSE: Status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('CLAUDE API ERROR: Status:', response.status, 'Response:', errorData);
            
            // Return appropriate error based on status
            let errorMessage = 'Claude API request failed';
            if (response.status === 401) {
                errorMessage = 'Authentication failed - check API key configuration';
            } else if (response.status === 429) {
                errorMessage = 'Rate limit exceeded - please try again later';
            } else if (response.status >= 500) {
                errorMessage = 'Claude API service temporarily unavailable';
            }
            
            return res.status(response.status).json({ 
                error: 'Claude API error',
                message: errorMessage,
                status: response.status
            });
        }
        
        const data = await response.json();
        
        console.log('SECURE SUCCESS: Claude API responded successfully');
        console.log('SECURE SUCCESS: Response type:', data.content?.[0]?.type);
        console.log('SECURE SUCCESS: Response length:', data.content?.[0]?.text?.length || 0, 'characters');
        
        // Return successful response
        res.status(200).json(data);
        
    } catch (error) {
        console.error('SECURE PROXY ERROR:', error.message);
        console.error('SECURE PROXY STACK:', error.stack);
        
        res.status(500).json({ 
            error: 'Proxy server error',
            message: 'Internal server error occurred',
            timestamp: new Date().toISOString()
        });
    }
}

// SECURITY NOTES:
// 1. API key is read from process.env.CLAUDE_API_KEY only
// 2. No client-side API keys are accepted or processed
// 3. All authentication happens server-side
// 4. CORS is configured for Figma plugin access
// 5. Proper error handling without exposing sensitive info
// 6. Extensive logging for debugging (without exposing credentials)
