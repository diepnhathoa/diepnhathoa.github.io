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
    function switchTab(tabToShow, tabToHide1, tabToHide2, buttonToActivate, buttonToDeactivate1, buttonToDeactivate2) {
        tabToHide1.classList.add('hidden');
        tabToHide2.classList.add('hidden');
        tabToShow.classList.remove('hidden');
        buttonToDeactivate1.classList.remove('active');
        buttonToDeactivate2.classList.remove('active');
        buttonToActivate.classList.add('active');
    }

    tabAdsButton.addEventListener('click', () => {
        switchTab(tabAdsContent, tabContentContent, tabChatContent, tabAdsButton, tabContentButton, tabChatButton);
    });

    tabContentButton.addEventListener('click', () => {
        switchTab(tabContentContent, tabAdsContent, tabChatContent, tabContentButton, tabAdsButton, tabChatButton);
    });

    tabChatButton.addEventListener('click', () => {
        switchTab(tabChatContent, tabAdsContent, tabContentContent, tabChatButton, tabAdsButton, tabContentButton);
        if (currentUserId) {
            chatLoginContainer.classList.add('hidden');
            chatInterface.classList.remove('hidden');
            loadChatHistory(currentUserId);
        }
    });

    subTabPostButton.addEventListener('click', () => {
        switchTab(subTabPostContent, subTabImageContent, subTabPostButton, subTabImageButton);
    });

    subTabImageButton.addEventListener('click', () => {
        switchTab(subTabImageContent, subTabPostContent, subTabImageButton, subTabPostButton);
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
    
    // Function to handle markdown links
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
        const message = chatMessageInput.value;
        if (!message || !currentUserId) return;
        
        appendChatMessage('user', message);
        chatMessageInput.value = '';
        
        // Add a temporary AI loading message
        const aiThinkingMessage = document.createElement('div');
        aiThinkingMessage.classList.add('chat-message', 'ai');
        aiThinkingMessage.innerText = 'AI đang suy nghĩ...';
        chatHistoryDiv.appendChild(aiThinkingMessage);
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

        try {
            const response = await fetch(`${VERCEL_BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, message })
            });
            
            const data = await response.json();

            // Remove the loading message
            chatHistoryDiv.removeChild(aiThinkingMessage);

            if (data.success) {
                appendChatMessage('ai', data.response);
            } else {
                appendChatMessage('ai', 'Xin lỗi, đã xảy ra lỗi trong quá trình xử lý.');
            }
        } catch (error) {
            console.error('Chat error:', error);
            chatHistoryDiv.removeChild(aiThinkingMessage);
            appendChatMessage('ai', 'Xin lỗi, đã xảy ra lỗi kết nối.');
        }
    });

    if (currentUserId) {
        // Assume user is already logged in
        chatLoginContainer.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        loadChatHistory(currentUserId);
    }
});