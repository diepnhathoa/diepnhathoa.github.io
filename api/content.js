import { OpenAI } from 'openai';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    },
};

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

    const form = new IncomingForm();

    try {
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve([fields, files]);
            });
        });

        const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
        const imageFiles = files.images || [];

        if (!prompt && imageFiles.length === 0) {
            return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mô tả hoặc hình ảnh.' });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        let model = "gpt-3.5-turbo";
        let userContent = [];
        
        if (imageFiles.length > 0) {
            model = "gpt-4o"; // Sử dụng model mạnh hơn khi có ảnh
            userContent.push({
                type: 'text',
                text: `Dựa trên các hình ảnh sau và yêu cầu của tôi, hãy tạo một bài viết quảng cáo.`
            });
            for (const file of imageFiles) {
                const imageBuffer = fs.readFileSync(file.filepath);
                const base64Image = imageBuffer.toString('base64');
                userContent.push({ 
                    type: 'image_url', 
                    image_url: { url: `data:${file.mimetype};base64,${base64Image}` } 
                });
            }
            userContent.push({ type: 'text', text: `Yêu cầu: "${prompt}"` });
        } else {
            userContent.push({ type: 'text', text: `Dựa trên yêu cầu của tôi: "${prompt}", hãy tạo một bài viết quảng cáo hoàn chỉnh.` });
        }

        const systemInstruction = "Bạn là một chuyên gia marketing kỹ thuật số, chuyên tạo ra các bài đăng quảng cáo hấp dẫn cho mạng xã hội tại Việt Nam. BẠN PHẢI LUÔN LUÔN trả lời bằng tiếng Việt, sử dụng văn phong tự nhiên, thu hút, chuyên nghiệp và thêm các hashtag (#) phù hợp. Tuyệt đối không sử dụng ngôn ngữ nào khác ngoài tiếng Việt. Hãy đảm bảo nội dung phù hợp với văn hóa và thị trường Việt Nam.";
        
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userContent }
            ],
            max_tokens: 1500,
        });

        const content = completion.choices[0].message.content;

        res.status(200).json({ success: true, content: content });
    } catch (error) {
        console.error('Lỗi xử lý yêu cầu:', error);
        res.status(500).json({ success: false, error: 'Lỗi trong quá trình xử lý yêu cầu.' });
    } finally {
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
