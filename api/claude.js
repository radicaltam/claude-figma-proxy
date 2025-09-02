export default async function handler(req, res) {
  // CORS headers for Figma plugin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST requests allowed' });
    return;
  }
  
  try {
    const { prompt, model = 'claude-3-sonnet-20240229', max_tokens = 1000 } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }
    
    if (!process.env.CLAUDE_API_KEY) {
      res.status(500).json({ error: 'Claude API key not configured' });
      return;
    }
    
    console.log('Calling Claude API for prompt:', prompt.substring(0, 100));
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: max_tokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Claude API error:', data);
      res.status(response.status).json(data);
      return;
    }
    
    console.log('Claude API success');
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
