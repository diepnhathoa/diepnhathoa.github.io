import { Redis } from '@upstash/redis';
import { OpenAI } from 'openai';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://diepnhathoa.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

        const messages = parsedHistory.map(msg => ({ role: msg.role, content: msg.content }));
        messages.push({ role: 'user', content: message });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Bạn là một trợ lý ảo chuyên nghiệp, hữu ích và lịch sự. Dữ liệu của bạn được cập nhật đến tháng 10 năm 2024. Khi người dùng hỏi về thông tin thời gian thực hoặc cần một liên kết, hãy cung cấp một đường link tìm kiếm chính xác và hữu ích trên Google để họ có thể tự tra cứu. Ví dụ: Nếu người dùng hỏi về giá vàng, hãy cung cấp link Google tìm kiếm "giá vàng hôm nay". Luôn trả lời bằng tiếng Việt.`,
                },
                ...messages,
            ],
            max_tokens: 1500,
        });

        const aiResponse = completion.choices[0].message.content;

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