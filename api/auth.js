import { v4 as uuidv4 } from 'uuid';

// Kết nối Redis bằng KV_REST_API_URL và KV_REST_API_TOKEN
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// API xử lý đăng nhập
export default async function handler(req, res) {
    const allowedOrigins = ['https://diepnhathoa.github.io', 'https://diepnhathoa.dev', 'https://diepnhathoa-github-io.vercel.app'];
    if (allowedOrigins.includes(req.headers.origin)) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Xử lý yêu cầu OPTIONS (yêu cầu kiểm tra của trình duyệt)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }
        
        // Tạo một ID duy nhất cho người dùng
        const userId = 'user_' + Math.random().toString(36).substring(2, 15);
        
        return res.status(200).json({ 
            success: true, 
            userId,
            username
        });
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ success: false, error: 'An error occurred during authentication' });
    }
}