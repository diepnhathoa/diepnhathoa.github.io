import { OpenAI } from 'openai';

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

    const { adTitle, adCopy, landingPageUrl, targetKeywords } = req.body;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are a highly skilled Google Ads Performance Analyst and Policy Expert. Your primary task is to provide a detailed, actionable, and comprehensive analysis of a competitor's ad campaign based on the provided data. Your analysis and recommendations must be of the highest quality, professional, and **strictly comply with all Google Ads policies, especially for sensitive categories like health.**

    Here is the competitor's ad data:
    - Ad Title: "${adTitle}"
    - Ad Description: "${adCopy}"
    - Landing Page URL: "${landingPageUrl}"
    - Competitor's Target Keywords: "${targetKeywords}"

    **Important Policy Compliance Instructions:**
    * **NEVER** make unsubstantiated or absolute claims, especially in the health and wellness sector. Avoid phrases like "chữa dứt điểm", "khỏi hoàn toàn", "cấp tốc", "đảm bảo hiệu quả 100%".
    * **ALWAYS** use cautious language such as "hỗ trợ", "giảm", "cải thiện", "làm dịu" instead of "chữa khỏi" or "loại bỏ".
    * Do not claim to solve problems permanently.
    * Avoid sensational or alarming language that could exploit sensitive topics.
    * All recommendations, including keywords, titles, and descriptions, must be a-biding by these policies.

    Your analysis and recommendations must be structured as a JSON object with the following keys.

    {
      "summary": {
        "title": "A concise title for the analysis.",
        "description": "A comprehensive summary of the competitor's strategy, including an analysis of UTM parameters if present to infer campaign goals (e.g., Search Ads, Performance Max). The analysis should also cover the quality of images/videos on the landing page."
      },
      "policy_compliance": {
        "warnings": [
          {
            "type": "Policy Violation",
            "description": "Provide detailed warnings if the ad or landing page violates any Google Ads policies. Mention what content (e.g., keywords, phrases, images) should be avoided."
          }
        ]
      },
      "recommendations": {
        "strong_titles": [
          "Provide 5 alternative, strong ad titles (each under 30 characters) that are optimized for keywords and user engagement, and strictly comply with Google Ads policies."
        ],
        "strong_long_titles": [
          "Provide 5 alternative, strong long ad titles (each under 90 characters) that are optimized for keywords and user engagement, and strictly comply with Google Ads policies."
        ],
        "strong_descriptions": [
          "Provide 5 alternative, strong ad descriptions (each under 90 characters) that are full of information, compelling, and strictly comply with Google Ads policies."
        ],
        "landing_page_suggestions": [
          "Provide a list of actionable suggestions for optimizing the user's landing page. Analyze the competitor's landing page for performance, keyword presence, and whether it solves the user's needs."
        ],
        "best_keywords": [
          {
            "keyword": "Provide 20 best keywords to target, based on the analysis of the competitor's ad and landing page.",
            "match_type": "Specify one of these three match types: 'Khớp mở rộng', 'Khớp chính xác', 'Khớp cụm từ'.",
            "reason": "Explain the reason for choosing this keyword and match type. For example: 'Chỉ hiển thị ads với những khách hàng có nhu cầu'."
          }
        ]
      }
    }

    All your analysis and recommendations must be in Vietnamese. Ensure the tone is professional, and all suggestions are practical and actionable for a marketing expert. Do not include any text outside of the JSON object.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2000,
            response_format: { type: "json_object" },
        });

        const analysis = JSON.parse(completion.choices[0].message.content);

        res.status(200).json({ success: true, analysis: analysis });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi trong quá trình phân tích.' });
    }
}
