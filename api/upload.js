import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';
import { OpenAI } from 'openai';

export const config = {
    api: {
        bodyParser: false,
    },
};

const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Hàm trích xuất nội dung từ tệp
async function extractFileContent(file) {
    const fileType = path.extname(file.originalFilename).toLowerCase();
    
    // Đối với hình ảnh, sử dụng GPT-4o để phân tích
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileType)) {
        try {
            const imageBuffer = fs.readFileSync(file.filepath);
            const base64Image = imageBuffer.toString('base64');
            
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Hãy mô tả chi tiết nội dung của hình ảnh này bằng tiếng Việt, bao gồm cả văn bản nếu có."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${file.mimetype};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            });
            
            return response.choices[0].message.content;
        } catch (error) {
            console.error('Lỗi khi phân tích hình ảnh:', error);
            return 'Không thể phân tích nội dung hình ảnh.';
        }
    }
    
    // Đối với tệp văn bản
    if (['.txt', '.md', '.csv'].includes(fileType)) {
        try {
            const content = fs.readFileSync(file.filepath, 'utf8');
            return content;
        } catch (error) {
            console.error('Lỗi khi đọc tệp văn bản:', error);
            return 'Không thể đọc nội dung tệp.';
        }
    }
    
    // Đối với các tệp khác, chỉ trả về thông tin tệp
    return `Tệp: ${file.originalFilename}, Loại: ${file.mimetype}, Kích thước: ${file.size} bytes`;
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

    try {
        const form = new IncomingForm();
        
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve([fields, files]);
            });
        });
        
        const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required.' });
        }
        
        const uploadedFiles = files.files || [];
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded.' });
        }
        
        // Xử lý từng tệp và lưu vào context
        let fileContents = [];
        
        for (const file of Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]) {
            const content = await extractFileContent(file);
            fileContents.push({
                name: file.originalFilename,
                type: file.mimetype,
                size: file.size,
                content: content
            });
        }
        
        // Lưu thông tin tệp vào Redis với key đặc biệt
        const fileContextKey = `file_context:${userId}`;
        await redis.set(fileContextKey, JSON.stringify(fileContents));
        
        // Thêm tin nhắn hệ thống vào lịch sử chat
        const historyKey = `chat_history:${userId}`;
        const systemMessage = {
            role: 'system',
            content: `[Đã tải lên ${fileContents.length} tệp. Thông tin về các tệp đã được lưu và sẵn sàng để phân tích.]`
        };
        
        await redis.lpush(historyKey, JSON.stringify(systemMessage));
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Upload API Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while processing the uploaded files.' });
    } finally {
        // Xóa các tệp tạm nếu có
        if (req.files) {
            for (const file of Object.values(req.files)) {
                if (Array.isArray(file)) {
                    file.forEach(f => {
                        if (f && f.filepath) fs.unlink(f.filepath, () => {});
                    });
                } else if (file && file.filepath) {
                    fs.unlink(file.filepath, () => {});
                }
            }
        }
    }
}
