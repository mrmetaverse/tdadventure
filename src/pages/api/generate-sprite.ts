import type { NextApiRequest, NextApiResponse } from 'next';

// API route for sprite generation
// This can be used as a proxy to avoid exposing API keys to the client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.REPLICATE_API_KEY;
  
  if (!apiKey) {
    // Return placeholder if no API key
    return res.status(200).json({
      imageUrl: null,
      message: 'API key not configured. Using placeholder sprites.',
    });
  }

  try {
    // Call Replicate API (or other AI service)
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'model-version-id', // Replace with actual model
        input: {
          prompt: prompt,
          width: 64,
          height: 64,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Sprite generation failed');
    }

    const data = await response.json();
    
    // Poll for completion
    let prediction = data;
    let attempts = 0;
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${apiKey}`,
        },
      });
      prediction = await statusResponse.json();
      attempts++;
    }

    if (prediction.status === 'succeeded' && prediction.output && prediction.output.length > 0) {
      return res.status(200).json({
        imageUrl: prediction.output[0],
        prompt: prompt,
      });
    }

    throw new Error('Sprite generation timeout or failed');
  } catch (error) {
    console.error('Sprite generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate sprite',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

