import { Redis } from '@upstash/redis';
import { OpenAI } from 'openai';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hàm để gọi SerpApi và lấy kết quả tìm kiếm Google
async function googleSearch(query) {
  try {
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`SerpAPI responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SerpApi search error:', error);
    return null;
  }
}

export default async function handler(req, res) {
    const allowedOrigins = ['https://diepnhathoa.github.io', 'https://diepnhathoa.dev', 'https://diepnhathoa-github-io.vercel.app'];
    if (allowedOrigins.includes(req.headers.origin)) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { userId, message, model = 'gpt-5', useWebSearch = false } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }
    
    // Xử lý lệnh đặc biệt
    if (message === 'load_history') {
      try {
        const historyKey = `chat_history:${userId}`;
        const chatHistory = await redis.lrange(historyKey, 0, -1);
        let parsedHistory = [];
        
        if (chatHistory && chatHistory.length > 0) {
          try {
            parsedHistory = chatHistory.map(item => JSON.parse(item)).reverse();
          } catch (e) {
            await redis.del(historyKey);
            parsedHistory = [];
          }
        }
        
        return res.status(200).json({ success: true, history: parsedHistory });
      } catch (error) {
        console.error('Error loading chat history:', error);
        return res.status(500).json({ success: false, error: 'Failed to load chat history.' });
      }
    }
    
    if (message === 'clear_history') {
      try {
        const historyKey = `chat_history:${userId}`;
        await redis.del(historyKey);
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error clearing chat history:', error);
        return res.status(500).json({ success: false, error: 'Failed to clear chat history.' });
      }
    }

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }
    
    try {
      const historyKey = `chat_history:${userId}`;
      const chatHistory = await redis.lrange(historyKey, 0, -1);
      let parsedHistory = [];
      
      if (chatHistory && chatHistory.length > 0) {
        try {
          parsedHistory = chatHistory.map(item => JSON.parse(item)).reverse();
        } catch (e) {
          await redis.del(historyKey);
          parsedHistory = [];
        }
      }

      let supplementalContent = '';
      // Sử dụng tìm kiếm web nếu được yêu cầu
      if (useWebSearch) {
        console.log('Web search enabled, querying SerpAPI...');
        const searchResults = await googleSearch(message);
        if (searchResults && searchResults.organic_results) {
          // Lấy 3 kết quả đầu tiên để làm dữ liệu cho AI
          supplementalContent = searchResults.organic_results.slice(0, 3).map(result => 
            `Tiêu đề: ${result.title}\nĐường dẫn: ${result.link}\nĐoạn trích: ${result.snippet}`
          ).join('\n\n');
        }
      }
      
      // Chuẩn bị tin nhắn cho OpenAI API
      const messages = parsedHistory.map(msg => ({ role: msg.role, content: msg.content }));
      messages.push({ role: 'user', content: message });

      const systemPrompt = `Bạn là một trợ lý ảo chuyên nghiệp, hữu ích và lịch sự.
      Dữ liệu của bạn được cập nhật đến tháng 10 năm 2024.
      ${useWebSearch ? 'Bạn có khả năng tìm kiếm thông tin trên web qua Google khi cần thiết.' : ''}
      Nếu người dùng hỏi về thông tin thời gian thực hoặc cần một liên kết, hãy sử dụng các kết quả tìm kiếm Google được cung cấp để trả lời.
      Các kết quả tìm kiếm được cung cấp trong phần sau. Nếu không có kết quả tìm kiếm, hãy trả lời dựa trên kiến thức hiện có của bạn.
      Luôn trả lời bằng tiếng Việt.
      
      ${supplementalContent ? `Dưới đây là các kết quả tìm kiếm mới nhất từ Google:\n${supplementalContent}\n` : ''}`;

      // Kiểm tra xem có dữ liệu file không
      const fileContextKey = `file_context:${userId}`;
      let fileContext = '';
      try {
        const fileData = await redis.get(fileContextKey);
        if (fileData) {
          const files = JSON.parse(fileData);
          fileContext = `\nDữ liệu từ các tệp đã tải lên:\n`;
          files.forEach((file, index) => {
            fileContext += `Tệp ${index + 1}: ${file.name} (${file.type})\nNội dung: ${file.content}\n\n`;
          });
        }
      } catch (error) {
        console.error('Error getting file context:', error);
      }

      // Map các model từ tên hiển thị sang API thực tế
      let apiModel = 'gpt-4o';
      if (model === 'gpt-5') {
        // Giả lập GPT-5 Mini bằng gpt-4o
        apiModel = 'gpt-4o';
      } else if (model === 'gpt-4o' || model === 'gpt-4' || model === 'gpt-3.5-turbo') {
        apiModel = model;
      }

      console.log(`Using API model: ${apiModel} (selected: ${model})`);

      const completion = await openai.chat.completions.create({
        model: apiModel,
        messages: [
          { role: "system", content: systemPrompt + fileContext },
          ...messages,
        ],
        max_tokens: 1500,
      });

      const aiResponse = completion.choices[0].message.content;

      // Lưu tin nhắn mới và phản hồi của AI vào Redis
      const newMessage = { role: 'user', content: message };
      const newAiResponse = { role: 'assistant', content: aiResponse };

      await redis.lpush(historyKey, JSON.stringify(newAiResponse), JSON.stringify(newMessage));
      await redis.ltrim(historyKey, 0, 99);

      return res.status(200).json({ success: true, response: aiResponse });

    } catch (error) {
      console.error('Chat API Error:', error);
      return res.status(500).json({ success: false, error: 'An error occurred while processing the chat.' });
    }
  }