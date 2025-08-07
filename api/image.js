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

        const prompt = Array.isArray(fields.prompt) ? fields.prompt?.[0] : fields.prompt;
        const imageFiles = files.images || [];

        if (!prompt && imageFiles.length === 0) {
            return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mô tả hoặc hình ảnh.' });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        let messages = [
            {
                role: 'system',
                content: `You are an expert in generating highly specific and detailed DALL-E 3 prompts in English. You will receive a user request in Vietnamese and one or more reference images, including at least one portrait. Your primary goal is to create a single DALL-E 3 prompt that accurately recreates the scene described in the user's request while **faithfully preserving the face from the provided portrait image(s)**.

                The DALL-E 3 prompt should be a single sentence and should include explicit instructions to maintain the facial features, expression, and overall appearance of the person in the reference portrait. While other elements of the image (e.g., clothing, background, pose, and additional objects) can be generated based on the user's prompt, the face must remain consistent with the provided image.

                Use phrases like "preserve the facial features of the person in the reference image," "the face should exactly match the provided portrait," or "ensure the likeness of the person's face is maintained."

                Do not include any introductory or explanatory text in your response. Only output the final DALL-E 3 prompt in English.`,
            }
        ];

        let userContent = [];
        if (imageFiles.length > 0) {
            userContent.push({ type: 'text', text: "Đây là (các) hình ảnh tham khảo cho yêu cầu của tôi:" });
            for (const file of imageFiles) {
                const imageBuffer = fs.readFileSync(file.filepath);
                const base64Image = imageBuffer.toString('base64');
                userContent.push({ type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64Image}` } });
            }
            userContent.push({ type: 'text', text: `Yêu cầu của tôi là: "${prompt}". Hãy tạo một prompt DALL-E 3 bằng tiếng Anh dựa trên yêu cầu này, **đặc biệt chú trọng vào việc giữ nguyên gương mặt của tôi từ hình ảnh đã tải lên** và kết hợp các yếu tố khác theo mô tả.` });
        } else {
            userContent.push({ type: 'text', text: `Yêu cầu của tôi là: "${prompt}". Hãy tạo một prompt DALL-E 3 bằng tiếng Anh để tạo ra một hình ảnh chân thật.` });
        }

        messages.push({
            role: 'user',
            content: userContent,
        });

        const translatedPrompt = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            max_tokens: 1000,
        });

        const finalPrompt = translatedPrompt.choices?.[0]?.message?.content;

        if (!finalPrompt) {
            return res.status(500).json({ success: false, error: 'Không thể tạo prompt DALL-E.' });
        }

        const image = await openai.images.generate({
            model: "dall-e-3",
            prompt: finalPrompt,
            n: 1,
            size: "1024x1024",
        });

        const imageUrl = image.data?.[0]?.url;

        if (!imageUrl) {
            return res.status(500).json({ success: false, error: 'Không thể tạo hình ảnh.' });
        }

        res.status(200).json({ success: true, imageUrl: imageUrl });
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
