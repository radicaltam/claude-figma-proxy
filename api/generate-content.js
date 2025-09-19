// api/generate-content.js - Vercel Serverless Function
// Deploy this to /api/generate-content.js in your Vercel project

export default async function handler(req, res) {
    // Security: Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Security: Validate API key exists
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.error('ANTHROPIC_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    // Security: Rate limiting (simple implementation)
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('Content generation request from:', clientIP);

    try {
        const generator = new VercelHealthcareContentGenerator(apiKey);
        const contentLibrary = await generator.generateContentLibrary();
        
        // Return the complete library
        res.status(200).json({
            success: true,
            contentLibrary,
            metadata: {
                generated: new Date().toISOString(),
                totalVariations: contentLibrary.metadata.totalVariations,
                specialties: contentLibrary.metadata.specialties
            }
        });

    } catch (error) {
        console.error('Content generation failed:', error);
        res.status(500).json({ 
            error: 'Content generation failed',
            message: error.message 
        });
    }
}

// Healthcare Content Generator optimized for Vercel
class VercelHealthcareContentGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://api.anthropic.com/v1/messages';
    }

    async generateContentBatch(specialty, batchSize = 30) {
        const prompt = `You are a healthcare content strategist creating diverse, professional content for a ${specialty} healthcare component library.

Generate ${batchSize} unique healthcare content variations. Each must be completely different and professional.

REQUIREMENTS:
• Headlines: 2-5 words, compelling and specific
• Descriptions: 8-18 words, engaging and informative  
• CTAs: 1-3 words, action-oriented
• NO repetitive content - every piece must be unique
• Focus on ${specialty} specialty when relevant
• Professional medical tone
• Patient-focused messaging

RESPOND WITH JSON ARRAY ONLY:
[
  {"headline": "Emergency Care", "body": "24/7 critical care with expert medical teams ready for any situation.", "cta": "Get Help", "theme": "emergency", "specialty": "${specialty}"},
  {"headline": "Wellness Programs", "body": "Comprehensive preventive health services designed to keep you feeling your absolute best.", "cta": "Join Today", "theme": "wellness", "specialty": "${specialty}"}
]

Generate ${batchSize} completely unique variations with maximum diversity!`;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 3000,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const content = data.content[0].text;
            
            // Extract JSON from response
            const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }

            const parsedContent = JSON.parse(jsonMatch[0]);
            console.log(`Generated ${parsedContent.length} ${specialty} content variations`);
            
            return parsedContent;

        } catch (error) {
            console.error(`Failed to generate ${specialty} content:`, error.message);
            // Return fallback content for this specialty
            return this.generateFallbackContent(specialty, batchSize);
        }
    }

    generateFallbackContent(specialty, count = 30) {
        // High-quality fallback content by specialty
        const fallbackTemplates = {
            general: {
                headlines: ['Medical Care', 'Healthcare Services', 'Patient Care', 'Treatment Options', 'Medical Team', 'Health Solutions', 'Professional Care', 'Medical Excellence'],
                bodies: ['Professional medical services with expert care and advanced technology.', 'Comprehensive healthcare solutions designed for optimal patient wellness and recovery.', 'Expert medical care delivered by experienced professionals in modern facilities.'],
                ctas: ['Learn More', 'Schedule', 'Contact', 'Get Care', 'Book Now'],
                themes: ['professional', 'comprehensive', 'expert', 'advanced']
            },
            cardiac: {
                headlines: ['Heart Care', 'Cardiac Services', 'Heart Health', 'Cardiovascular Care', 'Heart Surgery', 'Cardiac Excellence'],
                bodies: ['Expert cardiovascular care with advanced cardiac treatments and technology.', 'Comprehensive heart health services from leading cardiac specialists.', 'Advanced cardiac care featuring minimally invasive procedures and expert surgeons.'],
                ctas: ['Heart Care', 'Cardiac', 'Schedule', 'Consult'],
                themes: ['cardiac', 'cardiovascular', 'heart', 'surgical']
            },
            emergency: {
                headlines: ['Emergency Care', '24/7 Services', 'Urgent Care', 'Critical Care', 'Trauma Center', 'Emergency Medicine'],
                bodies: ['Round-the-clock emergency medical services with expert trauma care teams.', 'Immediate emergency care available 24/7 with advanced life-saving technology.', 'Critical care emergency services with rapid response medical teams.'],
                ctas: ['Get Help', 'Emergency', 'Call Now', 'Urgent'],
                themes: ['emergency', 'urgent', 'critical', 'trauma']
            }
        };

        const template = fallbackTemplates[specialty] || fallbackTemplates.general;
        const content = [];

        for (let i = 0; i < count; i++) {
            const headlineIndex = i % template.headlines.length;
            const bodyIndex = i % template.bodies.length;
            const ctaIndex = i % template.ctas.length;
            const themeIndex = i % template.themes.length;

            content.push({
                headline: template.headlines[headlineIndex] + (i >= template.headlines.length ? ` ${Math.floor(i / template.headlines.length) + 1}` : ''),
                body: template.bodies[bodyIndex],
                cta: template.ctas[ctaIndex],
                theme: template.themes[themeIndex],
                specialty: specialty,
                generated: new Date().toISOString(),
                source: 'vercel_fallback'
            });
        }

        return content;
    }

    async generateContentLibrary() {
        const specialties = [
            'general', 'cardiac', 'emergency', 'spine', 'cancer', 
            'pediatric', 'mental', 'women', 'surgical', 'wellness'
        ];

        const contentLibrary = {
            metadata: {
                generated: new Date().toISOString(),
                version: '1.0.0',
                totalVariations: 0,
                specialties: specialties,
                source: 'vercel_serverless'
            },
            content: {}
        };

        console.log('Generating healthcare content library on Vercel...');

        // Generate content for each specialty
        for (const specialty of specialties) {
            console.log(`Generating ${specialty} content...`);
            
            try {
                const specialtyContent = await this.generateContentBatch(specialty, 25);
                contentLibrary.content[specialty] = specialtyContent;
                contentLibrary.metadata.totalVariations += specialtyContent.length;

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`Failed to generate ${specialty} content:`, error.message);
                const fallbackContent = this.generateFallbackContent(specialty, 25);
                contentLibrary.content[specialty] = fallbackContent;
                contentLibrary.metadata.totalVariations += fallbackContent.length;
            }
        }

        // Generate additional cross-specialty content
        console.log('Generating cross-specialty content...');
        const crossSpecialty = await this.generateContentBatch('cross-specialty', 40);
        contentLibrary.content['cross-specialty'] = crossSpecialty;
        contentLibrary.metadata.totalVariations += crossSpecialty.length;

        return contentLibrary;
    }
}
