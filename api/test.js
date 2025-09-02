export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.json({ 
    message: 'Claude proxy is working!',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.CLAUDE_API_KEY
  });
}
