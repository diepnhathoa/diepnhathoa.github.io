document.addEventListener('DOMContentLoaded', () => {
    // === Vercel Backend URL ===
    const VERCEL_BACKEND_URL = 'https://diepnhathoa-github-io.vercel.app';

    // === DOM Elements ===
    // Main Tabs
    const tabAdsButton = document.getElementById('tab-ads');
    const tabContentButton = document.getElementById('tab-content');
    const tabChatButton = document.getElementById('tab-chat');
    
    const tabAdsContent = document.getElementById('tab-ads-content');
    const tabContentContent = document.getElementById('tab-content-content');
    const tabChatContent = document.getElementById('tab-chat-content');

    // Sub-Tabs for Content
    const subTabPostButton = document.getElementById('sub-tab-post');
    const subTabImageButton = document.getElementById('sub-tab-image');
    const subTabPostContent = document.getElementById('sub-tab-post-content');
    const subTabImageContent = document.getElementById('sub-tab-image-content');

    // Forms and Inputs
    const adsForm = document.getElementById('ads-analyzer-form');
    const adsSubmitButton = document.getElementById('ads-analyze-button');
    const adTitleInput = document.getElementById('ad-title');
    const adCopyInput = document.getElementById('ad-copy');
    const landingPageUrlInput = document.getElementById('landing-page-url');
    const targetKeywordsInput = document.getElementById('target-keywords');
    
    const postForm = document.getElementById('post-generator-form');
    const postSubmitButton = document.getElementById('post-create-button');
    const postPromptInput = document.getElementById('post-prompt');
    const postImageUploadInput = document.getElementById('post-image-upload');
    const postImagePreviewContainer = document.getElementById('post-image-preview-container');
    let uploadedPostFiles = [];
    
    const imageForm = document.getElementById('image-generator-form');
    const imageSubmitButton = document.getElementById('image-create-button');
    const imagePromptInput = document.getElementById('image-prompt');
    const imageUploadInput = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    let uploadedImageFiles = [];

    const chatLoginForm = document.getElementById('chat-login-form');
    const chatLoginInput = document.getElementById('username');
    const chatLoginContainer = document.getElementById('chat-login-container');
    const chatInterface = document.getElementById('chat-interface');
    const chatForm = document.getElementById('chat-form');
    const chatHistoryDiv = document.getElementById('chat-history');
    const chatMessageInput = document.getElementById('chat-message-input');

    // Results
    const adsLoadingSpinner = document.getElementById('ads-loading-spinner');
    const adsResultsContainer = document.getElementById('ads-results-container');
    const adsResultsContent = document.getElementById('ads-results-content');

    const postLoadingSpinner = document.getElementById('post-loading-spinner');
    const postResultsContainer = document.getElementById('post-results-container');
    const postOutput = document.getElementById('post-output');
    
    const imageLoadingSpinner = document.getElementById('image-loading-spinner');
    const imageResultsContainer = document.getElementById('image-results-container');
    const imageOutput = document.getElementById('image-output');
    
    let currentUserId = localStorage.getItem('userId');


    // === Tab Switching Logic ===
    function switchTab(tabToShow, buttonToActivate) {
        // Ẩn tất cả các tab nội dung
        tabAdsContent.classList.add('hidden');
        tabContentContent.classList.add('hidden');
        tabChatContent.classList.add('hidden');
        
        // Gỡ trạng thái active của tất cả các nút
        tabAdsButton.classList.remove('active');
        tabContentButton.classList.remove('active');
        tabChatButton.classList.remove('active');
        
        // Hiển thị tab được chọn và kích hoạt nút tương ứng
        tabToShow.classList.remove('hidden');
        buttonToActivate.classList.add('active');
    }

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

    subTabPostButton.addEventListener('click', () => {
        subTabPostContent.classList.remove('hidden');
        subTabImageContent.classList.add('hidden');
        subTabPostButton.classList.add('active');
        subTabImageButton.classList.remove('active');
    });

    subTabImageButton.addEventListener('click', () => {
        subTabImageContent.classList.remove('hidden');
        subTabPostContent.classList.add('hidden');
        subTabImageButton.classList.add('active');
        subTabPostButton.classList.remove('active');
    });

    // === Helper Functions ===
    function showLoading(button, spinner) {
        button.disabled = true;
        spinner.classList.remove('hidden');
    }

    function hideLoading(button, spinner) {
        button.disabled = false;
        spinner.classList.add('hidden');
    }

    function displayError(container, outputElement, message) {
        container.classList.remove('hidden');
        outputElement.innerText = `Lỗi: ${message}`;
    }
    
    function renderPostImagePreviews() {
        postImagePreviewContainer.innerHTML = '';
        if (uploadedPostFiles.length > 0) {
            postImagePreviewContainer.classList.remove('hidden');
            uploadedPostFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'image-preview-item';
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-image-btn';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.onclick = () => {
                    uploadedPostFiles.splice(index, 1);
                    renderPostImagePreviews();
                };
                item.appendChild(img);
                item.appendChild(deleteBtn);
                postImagePreviewContainer.appendChild(item);
            });
        } else {
            postImagePreviewContainer.classList.add('hidden');
        }
    }

    function renderImagePreviews() {
        imagePreviewContainer.innerHTML = '';
        if (uploadedImageFiles.length > 0) {
            imagePreviewContainer.classList.remove('hidden');
            uploadedImageFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'image-preview-item';
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-image-btn';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.onclick = () => {
                    uploadedImageFiles.splice(index, 1);
                    renderImagePreviews();
                };
                item.appendChild(img);
                item.appendChild(deleteBtn);
                imagePreviewContainer.appendChild(item);
            });
        } else {
            imagePreviewContainer.classList.add('hidden');
        }
    }
    
    function formatTextWithLinks(text) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        return text.replace(linkRegex, `<a href="$2" target="_blank">$1</a>`);
    }

    function appendChatMessage(role, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', role);
        messageElement.innerHTML = formatTextWithLinks(message);
        chatHistoryDiv.appendChild(messageElement);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight; // Auto-scroll
    }

    async function loadChatHistory(userId) {
        try {
            const response = await fetch(`${VERCEL_BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, message: 'load_history' }),
            });
            const data = await response.json();
            if (data.success && data.history) {
                chatHistoryDiv.innerHTML = '';
                data.history.forEach(msg => {
                    appendChatMessage(msg.role, msg.content);
                });
            }
        } catch (error) {
            console.error('Load chat history error:', error);
        }
    }


    // Function to render the JSON output in a user-friendly format
    function renderAdsAnalysis(data) {
        let html = `<h3>${data.summary.title}</h3><p>${data.summary.description}</p>`;
        
        // Render Policy Warnings
        if (data.policy_compliance.warnings.length > 0) {
            html += `<h4>Lưu ý về chính sách của Google:</h4><ul>`;
            data.policy_compliance.warnings.forEach(warning => {
                html += `<li><strong style="color:red;">${warning.type}:</strong> ${warning.description}</li>`;
            });
            html += `</ul>`;
        } else {
            html += `<h4>Tình trạng chính sách:</h4><p style="color:green;">Mẫu quảng cáo tuân thủ chính sách của Google.</p>`;
        }

        // Render Recommendations
        html += `<h4>Đề xuất từ khóa tốt nhất:</h4><ol>`;
        data.recommendations.best_keywords.forEach(item => {
            html += `<li><strong>${item.keyword}</strong> - Loại khớp: ${item.match_type} <br> Lý do: ${item.reason}</li>`;
        });
        html += `</ol>`;

        html += `<h4>Đề xuất tiêu đề mạnh:</h4><ol>`;
        data.recommendations.strong_titles.forEach(title => {
            html += `<li>${title}</li>`;
        });
        html += `</ol>`;

        html += `<h4>Đề xuất tiêu đề dài mạnh:</h4><ol>`;
        data.recommendations.strong_long_titles.forEach(title => {
            html += `<li>${title}</li>`;
        });
        html += `</ol>`;

        html += `<h4>Đề xuất mô tả mạnh:</h4><ol>`;
        data.recommendations.strong_descriptions.forEach(desc => {
            html += `<li>${desc}</li>`;
        });
        html += `</ol>`;
        
        html += `<h4>Đề xuất cho Trang đích (Landing Page):</h4><ul>`;
        data.recommendations.landing_page_suggestions.forEach(suggestion => {
            html += `<li>${suggestion}</li>`;
        });
        html += `</ul>`;

        return html;
    }


    // === Ads Analyzer Form Logic ===
    adsForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const adTitle = adTitleInput.value;
        const adCopy = adCopyInput.value;
        const landingPageUrl = landingPageUrlInput.value;
        const targetKeywords = targetKeywordsInput.value;

        showLoading(adsSubmitButton, adsLoadingSpinner);
        adsResultsContainer.classList.add('hidden');

        try {
            const response = await fetch(`${VERCEL_BACKEND_URL}/api/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adTitle, adCopy, landingPageUrl, targetKeywords }),
            });

            if (!response.ok) {
                throw new Error('Mạng đã gặp sự cố hoặc dịch vụ không khả dụng.');
            }

            const data = await response.json();
            
            if (data.success) {
                adsResultsContent.innerHTML = renderAdsAnalysis(data.analysis);
            } else {
                displayError(adsResultsContainer, adsResultsContent, data.error || 'Có lỗi xảy ra trong quá trình phân tích.');
            }

        } catch (error) {
            displayError(adsResultsContainer, adsResultsContent, error.message);
        } finally {
            hideLoading(adsSubmitButton, adsLoadingSpinner);
            adsResultsContainer.classList.remove('hidden');
        }
    });

    // === Content Creator Form Logic (Tạo Bài Đăng) ===
    postForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const prompt = postPromptInput.value;
        const formData = new FormData();
        formData.append('prompt', prompt);
        uploadedPostFiles.forEach(file => {
            formData.append('images', file);
        });

        if (!prompt && uploadedPostFiles.length === 0) {
            displayError(postResultsContainer, postOutput, 'Vui lòng nhập mô tả hoặc tải lên hình ảnh.');
            return;
        }

        showLoading(postSubmitButton, postLoadingSpinner);
        postResultsContainer.classList.add('hidden');
        
        try {
            const response = await fetch(`${VERCEL_BACKEND_URL}/api/content`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Mạng đã gặp sự cố hoặc dịch vụ không khả dụng.');
            }

            const data = await response.json();

            if (data.success) {
                postOutput.innerText = data.content;
            } else {
                displayError(postResultsContainer, postOutput, data.error || 'Có lỗi xảy ra trong quá trình sáng tạo.');
            }

        } catch (error) {
            displayError(postResultsContainer, postOutput, error.message);
        } finally {
            hideLoading(postSubmitButton, postLoadingSpinner);
            postResultsContainer.classList.remove('hidden');
        }
    });

    // === Image Generator Form Logic (Tạo Hình Ảnh) ===
    imageForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const prompt = imagePromptInput.value;
        const formData = new FormData();
        formData.append('prompt', prompt);
        uploadedImageFiles.forEach(file => {
            formData.append('images', file);
        });

        if (!prompt && uploadedImageFiles.length === 0) {
            displayError(imageResultsContainer, imageOutput, 'Vui lòng nhập mô tả hoặc tải lên hình ảnh.');
            return;
        }

        showLoading(imageSubmitButton, imageLoadingSpinner);
        imageResultsContainer.classList.add('hidden');
        imageOutput.innerHTML = '';
        
        try {
            const response = await fetch(`${VERCEL_BACKEND_URL}/api/image`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Mạng đã gặp sự cố hoặc dịch vụ không khả dụng.');
            }

            const data = await response.json();

            if (data.success) {
                const img = document.createElement('img');
                img.src = data.imageUrl; // Assumes backend returns an image URL
                img.alt = prompt;
                imageOutput.appendChild(img);
            } else {
                displayError(imageResultsContainer, imageOutput, data.error || 'Có lỗi xảy ra trong quá trình tạo hình ảnh.');
            }

        } catch (error) {
            displayError(imageResultsContainer, imageOutput, error.message);
        } finally {
            hideLoading(imageSubmitButton, imageLoadingSpinner);
            imageResultsContainer.classList.remove('hidden');
        }
    });
    
    // === Xử lý tải ảnh ===
    postImageUploadInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files) {
            uploadedPostFiles = [...uploadedPostFiles, ...Array.from(files)];
            renderPostImagePreviews();
        }
    });
    
    imageUploadInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files) {
            uploadedImageFiles = [...uploadedImageFiles, ...Array.from(files)];
            renderImagePreviews();
        }
    });
    
    // === Xử lý dán ảnh ===
    postForm.addEventListener('paste', (e) => {
        handlePaste(e, 'post');
    });

    imageForm.addEventListener('paste', (e) => {
        handlePaste(e, 'image');
    });

    function handlePaste(event, target) {
        const items = event.clipboardData.items;
        if (!items) return;
        
        const pastedFiles = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (file) pastedFiles.push(file);
            }
        }
        
        if (pastedFiles.length > 0) {
            event.preventDefault();
            if (target === 'post') {
                uploadedPostFiles = [...uploadedPostFiles, ...pastedFiles];
                renderPostImagePreviews();
            } else if (target === 'image') {
                uploadedImageFiles = [...uploadedImageFiles, ...pastedFiles];
                renderImagePreviews();
            }
        }
    }

    // === Chatbox Logic ===
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
                chatLoginContainer.classList.add('hidden');
                chatInterface.classList.remove('hidden');
                appendChatMessage('ai', `Chào mừng ${username} đến với trợ lý AI! Tôi có thể giúp gì cho anh?`);
                loadChatHistory(currentUserId);
            } else {
                alert('Có lỗi xảy ra khi đăng nhập: ' + data.error);
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    });
    
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatMessageInput.value.trim();
        if (!message || !currentUserId) return;
        
        appendChatMessage('user', message);
        chatMessageInput.value = '';
        chatMessageInput.style.height = 'auto';
        sendButton.disabled = true;
        
        // Hiển thị tin nhắn "đang nhập..." từ AI
        const typingMessageId = Date.now();
        const typingHTML = `
            <div class="avatar ai-avatar">
                <svg viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-10 w-10">
                    <path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.979 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0628C14.3065 10.262 14.2466 10.4882 14.2479 10.7181V21.9419H14.2424ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" fill="currentColor"></path>
                </svg>
            </div>
            <div class="message-content">
                <div class="message-text typing">
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
            const response = await fetch(`${VERCEL_BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUserId, 
                    message,
                    model: currentModel 
                })
            });
            
            const data = await response.json();

            // Remove typing indicator
            const typingElement = document.querySelector(`.typing-${typingMessageId}`);
            if (typingElement) {
                chatHistoryDiv.removeChild(typingElement);
            }

            if (data.success) {
                appendChatMessage('ai', data.response);
            } else {
                appendChatMessage('ai', 'Xin lỗi, đã xảy ra lỗi trong quá trình xử lý.');
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            
            // Remove typing indicator
            const typingElement = document.querySelector(`.typing-${typingMessageId}`);
            if (typingElement) {
                chatHistoryDiv.removeChild(typingElement);
            }
            
            // Mock response nếu không kết nối được với API
            const mockResponses = [
                "Xin lỗi, tôi gặp vấn đề kết nối với server. Tuy nhiên, tôi có thể giúp anh sau khi kết nối được khôi phục.",
                "Có vẻ như đang có lỗi kết nối. Vui lòng thử lại sau vài phút.",
                "Rất tiếc, hiện tại tôi không thể kết nối với server để xử lý yêu cầu của anh. Vui lòng kiểm tra kết nối internet và thử lại."
            ];
            
            const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
            appendChatMessage('ai', randomResponse);
        } finally {
        sendButton.disabled = false;
        }
    });

    // File upload button
    attachmentButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx,.txt';
        input.multiple = true;
        
        input.onchange = async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            // Hiển thị thông báo đang tải lên
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

    // Initialize based on login status
    if (currentUserId) {
        // Assume user is already logged in
        chatLoginContainer.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        loadChatHistory(currentUserId);
    }

    // Hiển thị thanh tìm kiếm ban đầu ẩn đi
    document.querySelector('.search-container').style.display = 'none';

    // Thêm nút tìm kiếm vào header
    const chatHeader = document.getElementById('chat-header');
    const searchButton = document.createElement('button');
    searchButton.id = 'search-button';
    searchButton.title = 'Tìm kiếm trong cuộc trò chuyện';
    searchButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
    `;
    searchButton.style.background = 'none';
    searchButton.style.border = 'none';
    searchButton.style.cursor = 'pointer';
    searchButton.style.color = '#666';

    chatHeader.insertBefore(searchButton, clearChatButton);

    // Hiển thị/ẩn thanh tìm kiếm
    searchButton.addEventListener('click', () => {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer.style.display === 'none') {
            searchContainer.style.display = 'flex';
            searchInput.focus();
        } else {
            searchContainer.style.display = 'none';
        }
    });
});