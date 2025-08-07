import { Redis } from '@upstash/redis';
import { OpenAI } from 'openai';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
    // Thêm các headers cho CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://diepnhathoa.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Xử lý yêu cầu OPTIONS (yêu cầu kiểm tra của trình duyệt)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ success: false, error: 'User ID and message are required.' });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    
    try {
        // Lấy lịch sử chat từ Redis
        const historyKey = `chat_history:${userId}`;
        const chatHistory = await redis.lrange(historyKey, 0, -1);
        const parsedHistory = chatHistory.map(item => JSON.parse(item)).reverse(); // Đảo ngược để thứ tự đúng
        
        // Chuẩn bị tin nhắn cho OpenAI API
        const messages = parsedHistory.map(msg => ({ role: msg.role, content: msg.content }));
        messages.push({ role: 'user', content: message });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Sử dụng model mạnh nhất cho chat
            messages: messages,
            max_tokens: 1500,
        });

        const aiResponse = completion.choices[0].message.content;

        // Lưu tin nhắn mới và phản hồi của AI vào Redis
        const newMessage = { role: 'user', content: message };
        const newAiResponse = { role: 'assistant', content: aiResponse };

        await redis.lpush(historyKey, JSON.stringify(newAiResponse), JSON.stringify(newMessage));
        await redis.ltrim(historyKey, 0, 99); // Giới hạn lịch sử chat để tiết kiệm chi phí

        return res.status(200).json({ success: true, response: aiResponse });

    } catch (error) {
        console.error('Chat API Error:', error);
        return res.status(500).json({ success: false, error: 'An error occurred while processing the chat.' });
    }
}