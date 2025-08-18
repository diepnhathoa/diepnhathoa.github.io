document.addEventListener('DOMContentLoaded', () => {
    // === Vercel Backend URL ===
    const VERCEL_BACKEND_URL = 'https://diepnhathoa-github-io.vercel.app';
    
    // === OpenAI API Configuration ===
    const OPENAI_API_KEY = "sk-proj-xdmzwbu9l8P4hdu45oeSCWBjMJHcVSJFBVmen0AqHoaanOBKqzBxTIhEm8o3T-aUk2M6248fdT3BlbkFJy8HPD89do2WPsup9F9OkDICFRYZCD-R27pE5A1-e6Eq_RA5VlqMWoUKWS0rfG09S1W9LB0fy8A";

    // === DOM Elements ===
    // Tab Elements
    const tabAdsButton = document.getElementById('tab-ads');
    const tabContentButton = document.getElementById('tab-content');
    const tabChatButton = document.getElementById('tab-chat');
    
    const tabAdsContent = document.getElementById('tab-ads-content');
    const tabContentContent = document.getElementById('tab-content-content');
    const tabChatContent = document.getElementById('tab-chat-content');

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

    // === Tab Switching Logic ===
    function switchTab(tabContent, tabButton) {
        // Hide all tab content
        tabAdsContent.classList.remove('active');
        tabContentContent.classList.remove('active');
        tabChatContent.classList.remove('active');
        
        // Remove active class from all tabs
        tabAdsButton.classList.remove('active');
        tabContentButton.classList.remove('active');
        tabChatButton.classList.remove('active');
        
        // Show selected tab content and mark button as active
        tabContent.classList.add('active');
        tabButton.classList.add('active');
    }

    // Add event listeners to tab buttons
    tabAdsButton.addEventListener('click', () => {
        switchTab(tabAdsContent, tabAdsButton);
    });
    
    tabContentButton.addEventListener('click', () => {
        switchTab(tabContentContent, tabContentButton);
    });
    
    tabChatButton.addEventListener('click', () => {
        switchTab(tabChatContent, tabChatButton);
        if (currentUserId) {
            chatLoginContainer.classList.add('hidden');
            chatInterface.classList.remove('hidden');
            loadChatHistory(currentUserId);
        }
    });

    // === Content Creation Sub-tabs ===
    const postSubtab = document.getElementById('post-subtab');
    const imageSubtab = document.getElementById('image-subtab');
    const postCreation = document.getElementById('post-creation');
    const imageCreation = document.getElementById('image-creation');

    if (postSubtab && imageSubtab) {
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

    // === ADS ANALYZER AI ===
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
            loadingSpinner.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            
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
                
                resultsContent.innerHTML = `<div class="analysis-result">${response.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
                resultsContainer.classList.remove('hidden');
                
            } catch (error) {
                console.error('Error analyzing ads:', error);
                resultsContent.innerHTML = `<div class="error-message">Có lỗi xảy ra khi phân tích quảng cáo: ${error.message}</div>`;
                resultsContainer.classList.remove('hidden');
            } finally {
                loadingSpinner.classList.add('hidden');
            }
        });
    }

    // === POST GENERATION AI ===
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
            generateBtn.disabled = true;
            generateBtn.textContent = 'Đang tạo...';
            
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
                
                postContent.innerHTML = response.replace(/\n/g, '<br>');
                postResult.classList.remove('hidden');
                
            } catch (error) {
                console.error('Error generating post:', error);
                postContent.innerHTML = `<div class="error-message">Có lỗi xảy ra khi tạo bài đăng: ${error.message}</div>`;
                postResult.classList.remove('hidden');
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Tạo Bài Đăng';
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

    // === IMAGE GENERATION AI ===
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
            generateBtn.disabled = true;
            generateBtn.textContent = 'Đang tạo...';
            
            try {
                // Tạo hình ảnh demo với AI description
                const imagePrompt = `Tạo mô tả chi tiết cho hình ảnh dựa trên yêu cầu:

YÊU CẦU:
- Mô tả: ${prompt}
- Phong cách: ${style}
- Kích thước: ${size}

Hãy tạo mô tả chi tiết, sáng tạo cho hình ảnh này bằng tiếng Việt để có thể sử dụng cho AI tạo hình ảnh.`;

                const response = await callOpenAI(imagePrompt, 'image_description');
                
                // Tạo hình ảnh demo placeholder
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const sizeMap = {
                    '1:1': [500, 500],
                    '4:5': [400, 500],
                    '16:9': [640, 360]
                };
                
                const [width, height] = sizeMap[size] || [500, 500];
                canvas.width = width;
                canvas.height = height;
                
                // Tạo gradient background
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // Thêm text
                ctx.fillStyle = 'white';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const lines = [
                    'AI Generated Image',
                    `Style: ${style}`,
                    `Size: ${size}`,
                    'Demo Preview'
                ];
                
                lines.forEach((line, index) => {
                    ctx.fillText(line, width/2, height/2 + (index - 1.5) * 30);
                });
                
                const imageUrl = canvas.toDataURL();
                
                imageContent.innerHTML = `
                    <img src="${imageUrl}" alt="Generated image" style="max-width: 100%; height: auto; border-radius: 8px;">
                    <div style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                        <strong>AI Mô tả:</strong><br>
                        ${response.replace(/\n/g, '<br>')}
                    </div>
                `;
                imageResult.classList.remove('hidden');
                
            } catch (error) {
                console.error('Error generating image:', error);
                imageContent.innerHTML = `<div class="error-message">Có lỗi xảy ra khi tạo hình ảnh: ${error.message}</div>`;
                imageResult.classList.remove('hidden');
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Tạo Hình Ảnh';
            }
        });
    }
    
    if (downloadImageBtn) {
        downloadImageBtn.addEventListener('click', () => {
            const img = imageContent.querySelector('img');
            if (img) {
                const link = document.createElement('a');
                link.href = img.src;
                link.download = 'ai-generated-image.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
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

    // === INITIALIZE ===
    chatInterface.classList.add('hidden');
    chatLoginContainer.classList.remove('hidden');
    switchTab(tabAdsContent, tabAdsButton);

    if (currentUserId) {
        chatLoginContainer.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        loadChatHistory(currentUserId);
    }
});