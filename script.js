document.addEventListener('DOMContentLoaded', () => {
    // === Vercel Backend URL ===
    const VERCEL_BACKEND_URL = 'https://diepnhathoa-github-io.vercel.app';

    // === DOM Elements ===
    // Tab Elements
    const tabAdsButton = document.getElementById('tab-ads');
    const tabContentButton = document.getElementById('tab-content');
    const tabChatButton = document.getElementById('tab-chat');
    
    const tabAdsContent = document.getElementById('tab-ads-content');
    const tabContentContent = document.getElementById('tab-content-content');
    const tabChatContent = document.getElementById('tab-chat-content');

    // === Kiểm tra DOM Elements trước khi sử dụng ===
    if (!tabAdsButton || !tabContentButton || !tabChatButton || 
        !tabAdsContent || !tabContentContent || !tabChatContent) {
        console.error('Không tìm thấy các elements tab cần thiết');
        return;
    }

    // Chat UI Elements
    const chatLoginForm = document.getElementById('chat-login-form');
    const chatLoginInput = document.getElementById('username');
    const chatLoginContainer = document.getElementById('chat-login-container');
    const chatInterface = document.getElementById('chat-interface');
    const chatHistoryDiv = document.getElementById('chat-history');
    const chatMessageInput = document.getElementById('chat-message-input');
    const chatForm = document.getElementById('chat-form');
    const modelSelectButton = document.getElementById('model-select-button');
    const currentModelSpan = document.getElementById('current-model');
    const modelDropdown = document.getElementById('model-dropdown');
    const modelOptions = document.querySelectorAll('.model-option');
    const sendButton = document.getElementById('send-button');
    const voiceInputButton = document.getElementById('voice-input-button');
    const attachmentButton = document.getElementById('attachment-button');
    const searchButton = document.getElementById('search-button');
    
    let currentUserId = localStorage.getItem('userId');
    let currentModel = localStorage.getItem('aiModel') || 'gpt-4';
    let isRecording = false;
    let speechRecognition = null;

    // === Tab Switching Logic - Sửa lỗi tab không hoạt động ===
    function switchTab(targetContent, targetButton) {
        // Kiểm tra null trước khi sử dụng
        if (!targetContent || !targetButton) {
            console.error('switchTab: targetContent hoặc targetButton là null');
            return;
        }

        // Hide all tab content
        if (tabAdsContent) tabAdsContent.classList.remove('active');
        if (tabContentContent) tabContentContent.classList.remove('active');
        if (tabChatContent) tabChatContent.classList.remove('active');
        
        // Remove active class from all tabs
        if (tabAdsButton) tabAdsButton.classList.remove('active');
        if (tabContentButton) tabContentButton.classList.remove('active');
        if (tabChatButton) tabChatButton.classList.remove('active');
        
        // Show selected tab content and mark button as active
        targetContent.classList.add('active');
        targetButton.classList.add('active');
    }

    // Add event listeners to tab buttons
    if (tabAdsButton) {
        tabAdsButton.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tabAdsContent, tabAdsButton);
        });
    }
    
    if (tabContentButton) {
        tabContentButton.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tabContentContent, tabContentButton);
        });
    }
    
    if (tabChatButton) {
        tabChatButton.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tabChatContent, tabChatButton);
            if (currentUserId && chatLoginContainer && chatInterface) {
                chatLoginContainer.classList.add('hidden');
                chatInterface.classList.remove('hidden');
                loadChatHistory(currentUserId);
            }
        });
    }

    // === Content Creation Sub-tabs ===
    const postSubtab = document.getElementById('post-subtab');
    const imageSubtab = document.getElementById('image-subtab');
    const postCreation = document.getElementById('post-creation');
    const imageCreation = document.getElementById('image-creation');

    if (postSubtab && imageSubtab && postCreation && imageCreation) {
        postSubtab.addEventListener('click', () => {
            postSubtab.classList.add('active');
            imageSubtab.classList.remove('active');
            postCreation.classList.add('active');
            imageCreation.classList.remove('active');
        });

        imageSubtab.addEventListener('click', () => {
            imageSubtab.classList.add('active');
            postSubtab.classList.remove('active');
            imageCreation.classList.add('active');
            postCreation.classList.remove('active');
        });
    }

    // === Helper Functions ===
    function formatTextWithLinks(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        text = text.replace(markdownLinkRegex, '<a href="$2" target="_blank">$1</a>');
        
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    function appendChatMessage(role, message, animate = true) {
        if (!chatHistoryDiv) return;
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', role);
        
        let avatarHTML = '';
        if (role === 'ai') {
            avatarHTML = `
                <div class="avatar ai-avatar">
                    <svg viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                        <path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.979 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0628C14.3065 10.262 14.2466 10.4882 14.2479 10.7181V21.9419H14.2424ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" fill="currentColor"></path>
                    </svg>
                </div>
            `;
        } else {
            const username = localStorage.getItem('username') || 'User';
            const initial = username.charAt(0).toUpperCase();
            avatarHTML = `
                <div class="avatar user-avatar">
                    ${initial}
                </div>
            `;
        }

        const formattedMessage = formatTextWithLinks(message);
        messageElement.innerHTML = `
            ${avatarHTML}
            <div class="message-content">
                <div class="message-text">${formattedMessage}</div>
            </div>
        `;

        chatHistoryDiv.appendChild(messageElement);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    }

    async function loadChatHistory(userId) {
        if (!chatHistoryDiv) return;
        
        try {
            const response = await fetch(`${VERCEL_BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, message: 'load_history' }),
            });
            const data = await response.json();
            if (data.success && data.history && data.history.length > 0) {
                chatHistoryDiv.innerHTML = '';
                data.history.forEach(msg => {
                    appendChatMessage(msg.role, msg.content, false);
                });
            } else {
                appendChatMessage('ai', 'What would you like to know?');
            }
        } catch (error) {
            console.error('Lỗi khi tải lịch sử trò chuyện:', error);
            appendChatMessage('ai', 'What would you like to know?');
        }
    }

    // === Call OpenAI function ===
    async function callOpenAI(message, type = 'chat') {
        try {
            const response = await fetch(`${VERCEL_BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUserId || 'anonymous', 
                    message,
                    model: currentModel,
                    type: type // Thêm type để backend biết loại request
                })
            });
            
            const data = await response.json();
            if (data.success) {
                return data.response || data.imageUrl; // Support both text and image responses
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error calling OpenAI:', error);
            throw error;
        }
    }

    // === ADS ANALYZER ===
    const adsForm = document.getElementById('ads-analyzer-form');
    if (adsForm) {
        adsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const adTitle = document.getElementById('ad-title').value;
            const adCopy = document.getElementById('ad-copy').value;
            const landingPageUrl = document.getElementById('landing-page-url').value;
            const targetKeywords = document.getElementById('target-keywords').value;
            
            const loadingSpinner = document.getElementById('ads-loading-spinner');
            const resultsContainer = document.getElementById('ads-results-container');
            const resultsContent = document.getElementById('ads-results-content');
            
            // Show loading
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');
            if (resultsContainer) resultsContainer.classList.add('hidden');
            
            try {
                const prompt = `Hãy phân tích quảng cáo sau đây một cách chi tiết và đưa ra đề xuất tối ưu:

THÔNG TIN QUẢNG CÁO:
- Tiêu đề: ${adTitle}
- Mô tả: ${adCopy}
- URL trang đích: ${landingPageUrl}
- Từ khóa mục tiêu: ${targetKeywords}

Yêu cầu phân tích:
1. ĐIỂM MẠNH của quảng cáo hiện tại
2. ĐIỂM YẾU cần cải thiện
3. ĐỀ XUẤT TIÊU ĐỀ MỚI (3 phiên bản khác nhau)
4. ĐỀ XUẤT MÔ TẢ MỚI (3 phiên bản khác nhau)
5. CHIẾN LƯỢC TỪ KHÓA cải thiện
6. ĐỀ XUẤT TRANG ĐÍCH tối ưu hơn

Hãy trả lời bằng tiếng Việt và format rõ ràng.`;

                const response = await callOpenAI(prompt, 'ads_analysis');
                
                if (resultsContent) {
                    resultsContent.innerHTML = `<div class="analysis-result">${response.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
                }
                if (resultsContainer) resultsContainer.classList.remove('hidden');
                
            } catch (error) {
                console.error('Error analyzing ads:', error);
                if (resultsContent) {
                    resultsContent.innerHTML = `<div class="error-message">Có lỗi xảy ra khi phân tích quảng cáo: ${error.message}</div>`;
                }
                if (resultsContainer) resultsContainer.classList.remove('hidden');
            } finally {
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
            }
        });
    }

    // === POST GENERATION ===
    const postForm = document.getElementById('post-form');
    const postResult = document.getElementById('post-result');
    const postContent = document.getElementById('post-content');
    const copyPostBtn = document.getElementById('copy-post-btn');
    const regeneratePostBtn = document.getElementById('regenerate-post-btn');

    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const prompt = document.getElementById('post-prompt').value;
            const tone = document.getElementById('post-tone').value;
            const length = document.getElementById('post-length').value;
            
            if (!prompt) {
                alert('Vui lòng nhập mô tả cho bài đăng');
                return;
            }
            
            const generateBtn = document.getElementById('generate-post-btn');
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Đang tạo...';
            }
            
            try {
                const toneMap = {
                    professional: 'chuyên nghiệp và trang trọng',
                    friendly: 'thân thiện và gần gũi',
                    humorous: 'hài hước và vui tươi',
                    persuasive: 'thuyết phục và có sức ảnh hưởng',
                    informative: 'thông tin và giáo dục'
                };
                
                const lengthMap = {
                    short: '100-200 từ',
                    medium: '200-400 từ',
                    long: '400-600 từ'
                };

                const fullPrompt = `Tạo một bài đăng marketing với yêu cầu sau:

YÊU CẦU:
- Nội dung: ${prompt}
- Tone giọng: ${toneMap[tone]}
- Độ dài: ${lengthMap[length]}

HƯỚNG DẪN TẠO BÀI:
- Có hook thu hút ngay từ đầu
- Nội dung có giá trị thực tế
- Call-to-action rõ ràng và hấp dẫn
- Sử dụng emoji phù hợp
- Thêm hashtag liên quan

Hãy tạo bài đăng bằng tiếng Việt và chỉ trả về nội dung bài đăng thôi, không cần giải thích thêm.`;

                const response = await callOpenAI(fullPrompt, 'post_creation');
                
                if (postContent) {
                    postContent.innerHTML = response.replace(/\n/g, '<br>');
                }
                if (postResult) postResult.classList.remove('hidden');
                
            } catch (error) {
                console.error('Error generating post:', error);
                if (postContent) {
                    postContent.innerHTML = `<div class="error-message">Có lỗi xảy ra khi tạo bài đăng: ${error.message}</div>`;
                }
                if (postResult) postResult.classList.remove('hidden');
            } finally {
                if (generateBtn) {
                    generateBtn.disabled = false;
                    generateBtn.textContent = 'Tạo Bài Đăng';
                }
            }
        });
    }
    
    if (copyPostBtn) {
        copyPostBtn.addEventListener('click', () => {
            const text = postContent.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = copyPostBtn.innerHTML;
                copyPostBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg> Đã sao chép';
                
                setTimeout(() => {
                    copyPostBtn.innerHTML = originalText;
                }, 2000);
            }).catch(() => {
                alert('Không thể sao chép. Vui lòng thử lại.');
            });
        });
    }
    
    if (regeneratePostBtn) {
        regeneratePostBtn.addEventListener('click', () => {
            if (postForm) {
                postForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // === IMAGE GENERATION ===
    const imageForm = document.getElementById('image-form');
    const imageResult = document.getElementById('image-result');
    const imageContent = document.getElementById('image-content');
    const downloadImageBtn = document.getElementById('download-image-btn');
    const regenerateImageBtn = document.getElementById('regenerate-image-btn');

    if (imageForm) {
        imageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const prompt = document.getElementById('image-prompt').value;
            const style = document.getElementById('image-style').value;
            const size = document.getElementById('image-size').value;
            
            if (!prompt) {
                alert('Vui lòng nhập mô tả cho hình ảnh');
                return;
            }
            
            const generateBtn = document.getElementById('generate-image-btn');
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Đang tạo hình ảnh...';
            }
            
            // Show loading state in image content
            if (imageContent) {
                imageContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="margin-bottom: 10px;">🎨</div>
                        <div>Đang tạo hình ảnh với DALL-E 3...</div>
                        <div style="font-size: 14px; margin-top: 5px;">Có thể mất 10-30 giây</div>
                    </div>
                `;
            }
            if (imageResult) imageResult.classList.remove('hidden');
            
            try {
                // Tạo prompt chi tiết cho DALL-E
                const styleDescriptions = {
                    'realistic': 'photorealistic, high quality, detailed, professional photography',
                    'artistic': 'artistic style, painterly, creative, expressive, fine art',
                    'cartoon': 'cartoon style, animated, colorful, fun, illustration',
                    '3d': '3D render, modern, clean, professional 3D modeling, CGI',
                    'minimalist': 'minimalist style, clean, simple, elegant, modern design'
                };

                const sizeMap = {
                    '1:1': '1024x1024',
                    '4:5': '1024x1280', 
                    '16:9': '1792x1024'
                };

                const enhancedPrompt = `${prompt}, ${styleDescriptions[style]}, high quality, detailed`;

                console.log('Sending image generation request:', {
                    url: `${VERCEL_BACKEND_URL}/api/generate-image`,
                    prompt: enhancedPrompt,
                    size: sizeMap[size],
                    style: style
                });

                // Gọi API tạo hình ảnh với timeout và better error handling
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

                const response = await fetch(`${VERCEL_BACKEND_URL}/api/generate-image`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    signal: controller.signal,
                    body: JSON.stringify({ 
                        prompt: enhancedPrompt,
                        size: sizeMap[size] || '1024x1024',
                        quality: 'hd',
                        style: style === 'realistic' ? 'natural' : 'vivid'
                    })
                });

                clearTimeout(timeoutId);

                console.log('Response status:', response.status);
                console.log('Response headers:', response.headers);

                if (!response.ok) {
                    let errorText;
                    try {
                        const errorData = await response.json();
                        errorText = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                        console.error('API Error:', errorData);
                    } catch (parseError) {
                        errorText = await response.text();
                        console.error('Response parse error:', parseError);
                    }
                    throw new Error(errorText);
                }

                const data = await response.json();
                console.log('Image generation response:', data);

                if (data.success && data.imageUrl) {
                    if (imageContent) {
                        imageContent.innerHTML = `
                            <div style="text-align: center;">
                                <img src="${data.imageUrl}" 
                                     alt="Generated image" 
                                     style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0; transition: opacity 0.3s;"
                                     onload="this.style.opacity=1"
                                     onerror="console.error('Image load error:', this.src.substring(0,50))">
                            </div>
                            <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 14px; color: #666;">
                                <div style="margin-bottom: 8px;"><strong>Prompt gốc:</strong><br>${prompt}</div>
                                ${data.revisedPrompt ? `<div style="margin-bottom: 8px;"><strong>Prompt được OpenAI tối ưu:</strong><br>${data.revisedPrompt}</div>` : ''}
                                <div><strong>Cài đặt:</strong> ${style} • ${size} • Chất lượng HD</div>
                            </div>
                        `;
                        
                        // Store image URL for download
                        imageContent.setAttribute('data-image-url', data.imageUrl);
                    }
                } else {
                    throw new Error(data.error || 'Không thể tạo hình ảnh');
                }
                
            } catch (error) {
                console.error('Error generating image:', error);
                
                let errorMsg = 'Có lỗi xảy ra khi tạo hình ảnh';
                let suggestions = '';
                
                if (error.name === 'AbortError') {
                    errorMsg = 'Quá thời gian chờ (90s)';
                    suggestions = 'Hệ thống đang quá tải. Vui lòng thử lại sau.';
                } else if (error.message.includes('content_policy_violation')) {
                    errorMsg = 'Nội dung không được phép theo chính sách của OpenAI';
                    suggestions = 'Hãy thử mô tả khác, tránh nội dung bạo lực, người nổi tiếng, hoặc nhạy cảm.';
                } else if (error.message.includes('rate_limit_exceeded')) {
                    errorMsg = 'Đã vượt quá giới hạn tạo hình ảnh';
                    suggestions = 'Vui lòng chờ vài phút rồi thử lại.';
                } else if (error.message.includes('insufficient_quota')) {
                    errorMsg = 'Hết quota API';
                    suggestions = 'Vui lòng liên hệ quản trị viên để nạp thêm credit.';
                } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    errorMsg = 'Lỗi kết nối mạng';
                    suggestions = 'Vui lòng kiểm tra kết nối internet và thử lại.';
                } else if (error.message.includes('API key') || error.message.includes('OpenAI API key')) {
                    errorMsg = 'Lỗi cấu hình API';
                    suggestions = 'Vui lòng liên hệ quản trị viên để cấu hình OpenAI API key.';
                } else if (error.message.includes('CORS')) {
                    errorMsg = 'Lỗi CORS policy';
                    suggestions = 'Đang khắc phục lỗi kết nối. Vui lòng thử lại sau.';
                }
                
                if (imageContent) {
                    imageContent.innerHTML = `
                        <div style="text-align: center; padding: 30px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404;">
                            <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                            <div style="font-weight: bold; margin-bottom: 8px;">${errorMsg}</div>
                            ${suggestions ? `<div style="font-size: 14px; margin-bottom: 15px;">${suggestions}</div>` : ''}
                            <div style="font-size: 12px; color: #666; margin-bottom: 15px;">Chi tiết: ${error.message}</div>
                            <button onclick="document.getElementById('image-form').dispatchEvent(new Event('submit'))" 
                                    style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Thử lại
                            </button>
                        </div>
                    `;
                }
            } finally {
                if (generateBtn) {
                    generateBtn.disabled = false;
                    generateBtn.textContent = 'Tạo Hình Ảnh';
                }
            }
        });
    }
    
    if (downloadImageBtn) {
        downloadImageBtn.addEventListener('click', async () => {
            const imageUrl = imageContent.getAttribute('data-image-url');
            
            if (imageUrl) {
                try {
                    // Show downloading status
                    const originalText = downloadImageBtn.innerHTML;
                    downloadImageBtn.innerHTML = 'Đang tải...';
                    downloadImageBtn.disabled = true;
                    
                    // For base64 images, create blob directly
                    if (imageUrl.startsWith('data:')) {
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `ai-generated-image-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else {
                        // For URL images, fetch as blob
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();
                        
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `ai-generated-image-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        URL.revokeObjectURL(link.href);
                    }
                    
                    // Restore button
                    downloadImageBtn.innerHTML = originalText;
                    downloadImageBtn.disabled = false;
                    
                } catch (error) {
                    console.error('Error downloading image:', error);
                    alert('Lỗi khi tải hình ảnh: ' + error.message);
                    
                    // Restore button
                    downloadImageBtn.innerHTML = originalText;
                    downloadImageBtn.disabled = false;
                }
            } else {
                alert('Không có hình ảnh để tải xuống');
            }
        });
    }
    
    if (regenerateImageBtn) {
        regenerateImageBtn.addEventListener('click', () => {
            if (imageForm) {
                imageForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // === CHAT FUNCTIONALITY ===
    if (chatLoginForm) {
        chatLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = chatLoginInput.value;
            if (!username) return;

            try {
                const response = await fetch(`${VERCEL_BACKEND_URL}/api/auth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });

                const data = await response.json();
                if (data.success) {
                    currentUserId = data.userId;
                    localStorage.setItem('userId', currentUserId);
                    localStorage.setItem('username', username);
                    if (chatLoginContainer) chatLoginContainer.classList.add('hidden');
                    if (chatInterface) chatInterface.classList.remove('hidden');
                    loadChatHistory(currentUserId);
                } else {
                    alert('Có lỗi xảy ra khi đăng nhập: ' + data.error);
                }
            } catch (error) {
                console.error('Lỗi đăng nhập:', error);
                currentUserId = 'user_' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('userId', currentUserId);
                localStorage.setItem('username', username);
                if (chatLoginContainer) chatLoginContainer.classList.add('hidden');
                if (chatInterface) chatInterface.classList.remove('hidden');
                loadChatHistory(currentUserId);
            }
        });
    }
    
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatMessageInput.value.trim();
            if (!message || !currentUserId) return;
            
            appendChatMessage('user', message);
            chatMessageInput.value = '';
            
            const typingMessageId = Date.now();
            const typingHTML = `
                <div class="avatar ai-avatar">
                    <svg viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                        <path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.979 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0628C14.3065 10.262 14.2466 10.4882 14.2479 10.7181V21.9419H14.2424ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" fill="currentColor"></path>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-text">
                        <div class="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            `;
            
            const typingMessageElement = document.createElement('div');
            typingMessageElement.classList.add('chat-message', 'ai', `typing-${typingMessageId}`);
            typingMessageElement.innerHTML = typingHTML;
            chatHistoryDiv.appendChild(typingMessageElement);
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

            try {
                const response = await callOpenAI(message, 'chat');
                
                const typingElement = document.querySelector(`.typing-${typingMessageId}`);
                if (typingElement) {
                    typingElement.remove();
                }

                appendChatMessage('ai', response);
            } catch (error) {
                console.error('Lỗi khi gửi tin nhắn:', error);
                
                const typingElement = document.querySelector(`.typing-${typingMessageId}`);
                if (typingElement) {
                    typingElement.remove();
                }
                
                appendChatMessage('ai', 'Xin lỗi, có lỗi xảy ra: ' + error.message);
            }
        });
    }

    // === MODEL SELECTOR ===
    if (modelSelectButton) {
        modelSelectButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (modelDropdown) modelDropdown.classList.toggle('hidden');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (modelDropdown && modelSelectButton && !modelSelectButton.contains(e.target) && !modelDropdown.contains(e.target)) {
            modelDropdown.classList.add('hidden');
        }
    });

    // Model selection
    modelOptions.forEach(option => {
        option.addEventListener('click', () => {
            const model = option.getAttribute('data-model');
            currentModel = model;
            if (currentModelSpan) currentModelSpan.textContent = option.textContent;
            
            // Update selected class
            modelOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // Save preference
            localStorage.setItem('aiModel', model);
            if (modelDropdown) modelDropdown.classList.add('hidden');
        });
    });
    
    // Set initial selected model
    modelOptions.forEach(option => {
        if (option.getAttribute('data-model') === currentModel) {
            if (currentModelSpan) currentModelSpan.textContent = option.textContent;
            option.classList.add('selected');
        }
    });

    // === VOICE INPUT ===
    if (voiceInputButton) {
        voiceInputButton.addEventListener('click', () => {
            if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
                alert('Trình duyệt của anh không hỗ trợ nhận dạng giọng nói.');
                return;
            }
            
            if (isRecording) {
                if (speechRecognition) {
                    speechRecognition.stop();
                    isRecording = false;
                    voiceInputButton.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                            <path d="M19 10v2a7 7 0 01-14 0v-2m7 9v4m-4 0h8"/>
                        </svg>
                    `;
                }
            } else {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                speechRecognition = new SpeechRecognition();
                speechRecognition.lang = 'vi-VN';
                speechRecognition.continuous = false;
                speechRecognition.interimResults = false;
                
                voiceInputButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#ff3b30" />
                    </svg>
                `;
                
                speechRecognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    if (chatMessageInput) chatMessageInput.value = transcript;
                };
                
                speechRecognition.onend = () => {
                    isRecording = false;
                    voiceInputButton.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                            <path d="M19 10v2a7 7 0 01-14 0v-2m7 9v4m-4 0h8"/>
                        </svg>
                    `;
                };
                
                speechRecognition.start();
                isRecording = true;
            }
        });
    }

    // === SEARCH BUTTON ===
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            alert('Chức năng tìm kiếm sẽ được triển khai sau');
        });
    }

    // === ATTACHMENT BUTTON ===
    if (attachmentButton) {
        attachmentButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,.pdf,.doc,.docx,.txt';
            input.multiple = true;
            
            input.onchange = async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                
                appendChatMessage('user', `Đang tải lên ${files.length} tệp...`);
                
                const formData = new FormData();
                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }
                formData.append('userId', currentUserId);
                
                try {
                    const response = await fetch(`${VERCEL_BACKEND_URL}/api/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        const fileNames = Array.from(files).map(f => f.name).join(', ');
                        appendChatMessage('user', `Đã đính kèm: ${fileNames}`);
                        appendChatMessage('ai', 'Tệp đã được tải lên thành công. Anh có thể hỏi về nội dung của tệp này.');
                    } else {
                        appendChatMessage('ai', 'Có lỗi xảy ra khi tải tệp lên: ' + (data.error || 'Không xác định'));
                    }
                } catch (error) {
                    console.error('Lỗi khi tải tệp lên:', error);
                    appendChatMessage('ai', 'Xin lỗi, đã xảy ra lỗi khi tải tệp lên. Vui lòng thử lại sau.');
                }
            };
            
            input.click();
        });
    }

    // === KEYBOARD SHORTCUTS ===
    document.addEventListener('keydown', (e) => {
        // Enter to send message (but not Shift+Enter)
        if (e.key === 'Enter' && !e.shiftKey && chatMessageInput && document.activeElement === chatMessageInput) {
            e.preventDefault();
            if (chatForm) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape to clear current message
        if (e.key === 'Escape' && chatMessageInput && document.activeElement === chatMessageInput) {
            chatMessageInput.value = '';
        }
    });

    // === AUTO-RESIZE TEXTAREA ===
    if (chatMessageInput) {
        chatMessageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 150) + 'px';
        });
    }

    // === INITIALIZE APPLICATION ===
    function initializeApp() {
        // Hide chat interface initially
        if (chatInterface) chatInterface.classList.add('hidden');
        if (chatLoginContainer) chatLoginContainer.classList.remove('hidden');
        
        // Set default tab
        switchTab(tabAdsContent, tabAdsButton);
        
        // Auto-login if user exists
        if (currentUserId) {
            if (chatLoginContainer) chatLoginContainer.classList.add('hidden');
            if (chatInterface) chatInterface.classList.remove('hidden');
            loadChatHistory(currentUserId);
        }
        
        console.log('🚀 AI Marketing Tool initialized successfully!');
        console.log('Current user:', currentUserId || 'None');
        console.log('Current model:', currentModel);
    }

    // === ERROR HANDLING ===
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
    });

    // Initialize the application
    initializeApp();
});