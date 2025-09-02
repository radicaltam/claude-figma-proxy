// /api/claude.js - Fixed version with proper CORS handling

export default async function handler(req, res) {
  // Add CORS headers for Figma plugin access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Received request:', { prompt, context });

    // Your Claude API key from environment variables
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Build healthcare-optimized prompt
    const healthcarePrompt = buildHealthcarePrompt(prompt, context);
    
    console.log('Sending to Claude:', healthcarePrompt);

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: healthcarePrompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Claude API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('Claude API response:', data);

    // Extract content from Claude's response
    const content = data.content?.[0]?.text || '';
    
    // Parse the response for structured content
    const parsedContent = parseClaudeResponse(content, context);
    
    return res.status(200).json({
      success: true,
      content: parsedContent,
      rawResponse: content
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}

function buildHealthcarePrompt(prompt, context) {
  const basePrompt = `You are a healthcare content specialist creating content for Texas Health Resources (THR). 

Context: ${context || 'general healthcare'}
User Request: ${prompt}

Please generate healthcare-appropriate content with the following structure:
- Main headline (professional, patient-focused)
- 2-3 supporting headlines for different sections
- Brief descriptions for each section (1-2 sentences, focus on patient benefits)
- 3-4 call-to-action phrases (action-oriented, healthcare appropriate)

Keep content:
- Professional but approachable
- Patient-centered
- Compliant with healthcare marketing standards
- Focused on quality care and outcomes

Format as JSON:
{
  "headlines": ["Main headline", "Section 1", "Section 2"],
  "descriptions": ["Main description", "Section 1 desc", "Section 2 desc"],
  "ctas": ["Primary CTA", "Secondary CTA", "Learn More", "Contact"]
}`;

  return basePrompt;
}

function parseClaudeResponse(response, context) {
  try {
    // Try to parse JSON first
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.headlines && parsed.descriptions && parsed.ctas) {
        return parsed;
      }
    }
    
    // Fallback parsing if JSON isn't found
    const headlines = extractSections(response, ['headline', 'title', 'header']);
    const descriptions = extractSections(response, ['description', 'summary', 'content']);
    const ctas = extractSections(response, ['cta', 'call-to-action', 'button', 'action']);
    
    return {
      headlines: headlines.length > 0 ? headlines : generateFallbackContent(context, 'headlines'),
      descriptions: descriptions.length > 0 ? descriptions : generateFallbackContent(context, 'descriptions'),
      ctas: ctas.length > 0 ? ctas : generateFallbackContent(context, 'ctas')
    };
    
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    // Return fallback content based on context
    return generateFallbackContent(context, 'all');
  }
}

function extractSections(text, keywords) {
  const sections = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && keywords.some(keyword => 
      trimmed.toLowerCase().includes(keyword.toLowerCase())
    )) {
      // Extract content after colon or dash
      const content = trimmed.split(/[:\-]/).pop().trim();
      if (content && content.length > 5 && content.length < 200) {
        sections.push(content.replace(/['"]/g, ''));
      }
    }
  }
  
  return sections;
}

function generateFallbackContent(context, type) {
  const fallbacks = {
    spine: {
      headlines: ["Advanced Spine Care", "Expert Treatment Options", "Comprehensive Back Care"],
      descriptions: [
        "Our spine specialists provide comprehensive care using minimally invasive techniques.",
        "Personalized treatment plans designed for your specific spine condition.",
        "Advanced diagnostic tools and proven surgical and non-surgical options."
      ],
      ctas: ["Schedule Consultation", "Find a Specialist", "Learn More", "Request Appointment"]
    },
    cardiac: {
      headlines: ["Heart Health Excellence", "Cardiac Care Specialists", "Advanced Heart Treatment"],
      descriptions: [
        "Comprehensive cardiac services with state-of-the-art technology.",
        "Expert cardiologists focused on prevention and treatment.",
        "Personalized heart care plans for optimal health outcomes."
      ],
      ctas: ["Schedule Screening", "Find Cardiologist", "Heart Health Info", "Book Consultation"]
    },
    general: {
      headlines: ["Quality Healthcare", "Expert Medical Care", "Comprehensive Services"],
      descriptions: [
        "Providing exceptional healthcare services with compassionate care.",
        "Our medical experts are dedicated to your health and wellbeing.",
        "Advanced treatments and personalized care plans for every patient."
      ],
      ctas: ["Schedule Appointment", "Find Provider", "Learn More", "Contact Us"]
    }
  };
  
  const contextKey = context?.toLowerCase().includes('spine') ? 'spine' :
                   context?.toLowerCase().includes('heart') || context?.toLowerCase().includes('cardiac') ? 'cardiac' :
                   'general';
  
  if (type === 'all') {
    return fallbacks[contextKey];
  } else {
    return fallbacks[contextKey][type] || [];
  }
}
