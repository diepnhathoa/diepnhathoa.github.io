import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body;

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

    console.log('Generating image with:', {
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

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('Image generated successfully');

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      revisedPrompt: response.data[0]?.revised_prompt,
      settings: {
        size: imageSize,
        quality: imageQuality,
        style: imageStyle
      }
    });

  } catch (error) {
    console.error('Error generating image:', error);

    let errorMessage = 'Đã xảy ra lỗi khi tạo hình ảnh';
    
    if (error.code === 'content_policy_violation') {
      errorMessage = 'Nội dung không được phép. Vui lòng thử mô tả khác.';
    } else if (error.code === 'rate_limit_exceeded') {
      errorMessage = 'Đã vượt quá giới hạn tạo hình ảnh. Vui lòng thử lại sau.';
    } else if (error.code === 'insufficient_quota') {
      errorMessage = 'Hết quota API. Vui lòng liên hệ quản trị viên.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}
