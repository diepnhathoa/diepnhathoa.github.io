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
    const webSearchButton = document.getElementById('web-search-button');
    const clearChatButton = document.getElementById('clear-chat-button');
    const searchButton = document.getElementById('search-button');
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('search-input');
    const searchPrevButton = document.getElementById('search-prev');
    const searchNextButton = document.getElementById('search-next');
    const searchCloseButton = document.getElementById('search-close');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    const quickReplyDiv = document.getElementById('quick-reply');
    const sendButton = document.getElementById('send-button');
    const voiceInputButton = document.getElementById('voice-input-button');
    const attachmentButton = document.getElementById('attachment-button');
    
    let currentUserId = localStorage.getItem('userId');
    let currentModel = localStorage.getItem('aiModel') || 'gpt-5';
    let isRecording = false;
    let speechRecognition = null;
    let searchResults = [];
    let currentSearchIndex = -1;
    let useWebSearch = localStorage.getItem('useWebSearch') === 'true';

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
    
    // === Helper Functions for Chat ===
    function formatTextWithLinks(text) {
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        
        // Convert markdown-style links
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        text = text.replace(markdownLinkRegex, '<a href="$2" target="_blank">$1</a>');
        
        // Convert code blocks
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        return text;
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
                localStorage.setItem('username', username);
                chatLoginContainer.classList.add('hidden');
                chatInterface.classList.remove('hidden');
                chatHistoryDiv.innerHTML = ''; // Xóa tin nhắn mặc định nếu có
                appendChatMessage('ai', `Xin chào ${username}! Tôi có thể giúp gì cho anh hôm nay?`);
                loadChatHistory(currentUserId);
            } else {
                alert('Có lỗi xảy ra khi đăng nhập: ' + data.error);
            }
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            // Fallback nếu API bị lỗi - tạo ID ngẫu nhiên
            currentUserId = 'user_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('userId', currentUserId);
            localStorage.setItem('username', username);
            chatLoginContainer.classList.add('hidden');
            chatInterface.classList.remove('hidden');
            appendChatMessage('ai', `Xin chào ${username}! Tôi có thể giúp gì cho anh hôm nay?`);
        }
    });
    
    // === AI Model Selector - Fixed ===
    modelSelectButton.addEventListener('click', (e) => {
        e.stopPropagation();
        modelDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!modelSelectButton.contains(e.target) && !modelDropdown.contains(e.target)) {
            modelDropdown.classList.add('hidden');
        }
    });

    // Model selection - Fixed
    modelOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const model = option.getAttribute('data-model');
            currentModel = model;
            currentModelSpan.textContent = option.textContent;
            
            // Update selected class
            modelOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // Save preference
            localStorage.setItem('aiModel', model);
            
            // Add system message about model change
            appendChatMessage('ai', `Đã chuyển sang model ${option.textContent}.`);
            modelDropdown.classList.add('hidden');
        });
    });
    
    // Set initial model selection
    function updateModelSelection() {
        modelOptions.forEach(option => {
            if (option.getAttribute('data-model') === currentModel) {
                currentModelSpan.textContent = option.textContent;
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
    
    // Web search toggle
    webSearchButton.addEventListener('click', () => {
        useWebSearch = !useWebSearch;
        localStorage.setItem('useWebSearch', useWebSearch);
        webSearchButton.style.color = useWebSearch ? '#3b82f6' : '#666';
        appendChatMessage('ai', useWebSearch ? 
            'Đã bật tính năng tìm kiếm web. AI sẽ tìm kiếm thông tin trực tuyến khi cần thiết.' : 
            'Đã tắt tính năng tìm kiếm web. AI sẽ chỉ sử dụng kiến thức có sẵn.');
    });
    
    // Initialize web search button state
    if (useWebSearch) {
        webSearchButton.style.color = '#3b82f6';
    }

    // Make sure model selection is updated on page load
    updateModelSelection();

    // Suggestion chips - Fixed to work correctly
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const suggestionText = chip.textContent;
            chatMessageInput.value = suggestionText;
            autoResizeTextarea();
            chatForm.dispatchEvent(new Event('submit'));
        });
    });

    // Cập nhật các gợi ý tiếng Việt cho suggestion chips
    const updateSuggestions = () => {
        const vietnameseSuggestions = [
            "Viết nội dung quảng cáo Facebook",
            "Xu hướng marketing năm 2024",
            "Cách tạo một chiến dịch email marketing",
            "Chiến lược SEO hiệu quả"
        ];
        
        const suggestionChips = document.querySelectorAll('.suggestion-chip');
        suggestionChips.forEach((chip, index) => {
            if (index < vietnameseSuggestions.length) {
                chip.textContent = vietnameseSuggestions[index];
            }
        });
    };

    // Đảm bảo model dropdown hoạt động đúng
    function setupModelSelector() {
        const modelSelectButton = document.getElementById('model-select-button');
        const modelDropdown = document.getElementById('model-dropdown');
        const modelOptions = document.querySelectorAll('.model-option');
        const currentModelSpan = document.getElementById('current-model');
        
        // Đảm bảo mặc định là GPT-5 Mini
        let currentModel = localStorage.getItem('aiModel') || 'gpt-5';
        
        // Thiết lập model mặc định khi tải trang
        modelOptions.forEach(option => {
            if (option.getAttribute('data-model') === currentModel) {
                currentModelSpan.textContent = option.textContent;
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
        
        // Toggle dropdown
        modelSelectButton.addEventListener('click', () => {
            modelDropdown.classList.toggle('hidden');
        });
        
        // Đóng dropdown khi click bên ngoài
        document.addEventListener('click', (e) => {
            if (!modelSelectButton.contains(e.target) && !modelDropdown.contains(e.target)) {
                modelDropdown.classList.add('hidden');
            }
        });
        
        // Xử lý chọn model
        modelOptions.forEach(option => {
            option.addEventListener('click', () => {
                const model = option.getAttribute('data-model');
                currentModel = model;
                localStorage.setItem('aiModel', model);
                currentModelSpan.textContent = option.textContent;
                
                // Cập nhật selected class
                modelOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // Thông báo về việc đổi model
                const chatHistoryDiv = document.getElementById('chat-history');
                if (chatHistoryDiv) {
                    appendChatMessage('ai', `Đã chuyển sang model ${option.textContent}.`);
                }
                
                modelDropdown.classList.add('hidden');
            });
        });
        
        return currentModel;
    }

    // Xử lý hiển thị quick reply
    function setupQuickReply() {
        const quickReplyDiv = document.getElementById('quick-reply');
        if (!quickReplyDiv) return;
        
        // Ẩn quick reply ban đầu
        quickReplyDiv.style.display = 'none';
        
        // Xử lý click vào quick reply
        quickReplyDiv.addEventListener('click', () => {
            const message = quickReplyDiv.textContent;
            const chatMessageInput = document.getElementById('chat-message-input');
            const chatForm = document.getElementById('chat-form');
            
            if (chatMessageInput && chatForm) {
                chatMessageInput.value = message;
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
        
        // Hàm cập nhật nội dung quick reply
        function updateQuickReply() {
            const replies = [
                "Cho tôi biết thêm về điều này",
                "Giải thích chi tiết hơn",
                "Cách tôi có thể áp dụng điều này vào marketing",
                "Làm thế nào để tôi cải thiện chiến lược content?"
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            quickReplyDiv.textContent = randomReply;
            quickReplyDiv.style.display = 'block';
        }
        
        return updateQuickReply;
    }

    // Khởi tạo cấu hình khi trang tải xong
    window.addEventListener('load', () => {
        updateSuggestions();
        const currentModel = setupModelSelector();
        const updateQuickReply = setupQuickReply();
        
        // Đảm bảo voice input hoạt động đúng
        const voiceInputButton = document.getElementById('voice-input-button');
        if (voiceInputButton) {
            setupVoiceInput(voiceInputButton);
        }
        
        // Đảm bảo attachment hoạt động đúng
        const attachmentButton = document.getElementById('attachment-button');
        if (attachmentButton) {
            setupAttachmentUpload(attachmentButton, currentModel);
        }
    });

    // Cấu hình voice input
    function setupVoiceInput(voiceInputButton) {
        let isRecording = false;
        let speechRecognition = null;
        
        voiceInputButton.addEventListener('click', () => {
            if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
                appendChatMessage('ai', 'Trình duyệt của anh không hỗ trợ nhận dạng giọng nói.');
                return;
            }
            
            if (isRecording) {
                // Dừng ghi âm
                if (speechRecognition) {
                    speechRecognition.stop();
                }
            } else {
                // Bắt đầu ghi âm
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                speechRecognition = new SpeechRecognition();
                speechRecognition.lang = 'vi-VN';
                speechRecognition.continuous = false;
                speechRecognition.interimResults = false;
                
                // Thêm thông báo đang ghi âm
                voiceInputButton.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#ff3b30" />
                    </svg>
                `;
                
                speechRecognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    const chatMessageInput = document.getElementById('chat-message-input');
                    if (chatMessageInput) {
                        chatMessageInput.value = transcript;
                        chatMessageInput.dispatchEvent(new Event('input'));
                    }
                };
                
                speechRecognition.onend = () => {
                    isRecording = false;
                    voiceInputButton.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            <path d="M19 10v2a7 7 0 01-14 0v-2m7 9v4m-4 0h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    `;
                };
                
                speechRecognition.start();
                isRecording = true;
            }
        });
    }

    // Cấu hình tải tệp đính kèm
    function setupAttachmentUpload(attachmentButton, currentModel) {
        attachmentButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,.pdf,.doc,.docx,.txt';
            input.multiple = true;
            
            input.onchange = async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                
                const currentUserId = localStorage.getItem('userId');
                if (!currentUserId) {
                    appendChatMessage('ai', 'Vui lòng đăng nhập trước khi tải lên tệp.');
                    return;
                }
                
                // Hiển thị thông báo đang tải lên
                appendChatMessage('user', `Đang tải lên ${files.length} tệp...`);
                
                const formData = new FormData();
                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }
                formData.append('userId', currentUserId);
                formData.append('model', currentModel);
                
                try {
                    const response = await fetch(`${VERCEL_BACKEND_URL}/api/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
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

    // Cập nhật hiển thị ngay khi trang tải
    document.addEventListener('DOMContentLoaded', () => {
        // Cập nhật suggestions bằng tiếng Việt
        const vietnameseSuggestions = [
            "Viết nội dung quảng cáo Facebook",
            "Xu hướng marketing năm 2024",
            "Cách tạo một chiến dịch email marketing",
            "Chiến lược SEO hiệu quả"
        ];
        
        suggestionChips.forEach((chip, index) => {
            if (index < vietnameseSuggestions.length) {
                chip.textContent = vietnameseSuggestions[index];
            }
        });
        
        // Ẩn quick reply ban đầu
        if (quickReplyDiv) {
            quickReplyDiv.style.display = 'none';
        }
    });

    // Initialize based on login status
    if (currentUserId) {
        // Assume user is already logged in
        chatLoginContainer.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        loadChatHistory(currentUserId);
    }
});