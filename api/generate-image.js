import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Set comprehensive CORS headers - Fix CORS policy issue
  const allowedOrigins = [
    'https://diepnhathoa.github.io', 
    'https://diepnhathoa.dev', 
    'https://diepnhathoa-github-io.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  // Debug: Check if API key exists
  console.log('Environment check:', {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) + '...'
  });

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not found in environment variables');
    return res.status(500).json({
      success: false,
      error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in Vercel environment variables.'
    });
  }

  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body;

    console.log('Received request:', { 
      prompt: prompt?.substring(0, 50) + '...', 
      size, 
      quality, 
      style 
    });

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    // Validate size
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    const imageSize = validSizes.includes(size) ? size : '1024x1024';

    // Validate quality
    const imageQuality = ['standard', 'hd'].includes(quality) ? quality : 'standard';

    // Validate style
    const imageStyle = ['vivid', 'natural'].includes(style) ? style : 'vivid';

    console.log('Generating image with DALL-E 3:', {
      prompt: prompt.substring(0, 100) + '...',
      size: imageSize,
      quality: imageQuality,
      style: imageStyle
    });

    // Call OpenAI DALL-E API
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: imageSize,
      quality: imageQuality,
      style: imageStyle,
    });

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('Image generated successfully');

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      revisedPrompt: revisedPrompt,
      settings: {
        originalPrompt: prompt,
        size: imageSize,
        quality: imageQuality,
        style: imageStyle
      }
    });

  } catch (error) {
    console.error('Error generating image:', error);

    let errorMessage = 'Đã xảy ra lỗi khi tạo hình ảnh';
    let statusCode = 500;
    
    // Handle specific OpenAI errors
    if (error.code === 'content_policy_violation') {
      errorMessage = 'Nội dung không được phép theo chính sách của OpenAI. Vui lòng thử mô tả khác.';
      statusCode = 400;
    } else if (error.code === 'rate_limit_exceeded') {
      errorMessage = 'Đã vượt quá giới hạn tạo hình ảnh. Vui lòng thử lại sau vài phút.';
      statusCode = 429;
    } else if (error.code === 'insufficient_quota') {
      errorMessage = 'Hết quota API OpenAI. Vui lòng liên hệ quản trị viên.';
      statusCode = 402;
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra cấu hình.';
      statusCode = 401;
    } else if (error.message?.includes('API key')) {
      errorMessage = 'Lỗi cấu hình API key. Vui lòng liên hệ quản trị viên.';
      statusCode = 500;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: error.code || 'unknown_error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
