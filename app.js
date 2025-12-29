// ===== API Base URL =====
const API_BASE = 'http://localhost:5000/api';

// ===== DOM Elements =====
const loginPage = document.getElementById('login-page');
const chatPage = document.getElementById('chat-page');

// Login form elements
const loginFormContainer = document.getElementById('login-form-container');
const loginForm = document.getElementById('login-form');
const loginUserIdInput = document.getElementById('login-userid');
const loginPasswordInput = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');
const showRegisterLink = document.getElementById('show-register');

// Register form elements
const registerFormContainer = document.getElementById('register-form-container');
const registerForm = document.getElementById('register-form');
const regUserIdInput = document.getElementById('reg-userid');
const regPasswordInput = document.getElementById('reg-password');
const regPasswordConfirmInput = document.getElementById('reg-password-confirm');
const regNameInput = document.getElementById('reg-name');
const regJobInput = document.getElementById('reg-job');
const regEmailInput = document.getElementById('reg-email');
const checkIdBtn = document.getElementById('check-id-btn');
const userIdMessage = document.getElementById('userid-message');
const passwordMatchMessage = document.getElementById('password-match-message');
const emailMessage = document.getElementById('email-message');
const registerMessage = document.getElementById('register-message');
const showLoginLink = document.getElementById('show-login');

// Chat elements
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const newChatBtn = document.getElementById('new-chat-btn');
const profileMenuBtn = document.getElementById('profile-menu-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const logoutBtn = document.getElementById('logout-btn');

// User display elements
const avatarText = document.getElementById('avatar-text');
const displayName = document.getElementById('display-name');
const displayJob = document.getElementById('display-job');

// ===== State =====
let isLoggedIn = false;
let currentUser = null;
let isUserIdChecked = false;
let modelStatus = { loaded: false, model_name: null, device: 'cpu' };

// ===== Utility Functions =====
function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `form-message show ${type}`;
}

function hideMessage(element) {
    element.className = 'form-message';
}

function showFieldMessage(element, message, type) {
    element.textContent = message;
    element.className = `field-message ${type}`;
}

function clearFieldMessage(element) {
    element.textContent = '';
    element.className = 'field-message';
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// ===== Form Switching =====
function showLoginForm() {
    loginFormContainer.classList.remove('hidden');
    registerFormContainer.classList.add('hidden');
    hideMessage(loginMessage);
    loginForm.reset();
}

function showRegisterForm() {
    loginFormContainer.classList.add('hidden');
    registerFormContainer.classList.remove('hidden');
    hideMessage(registerMessage);
    clearFieldMessage(userIdMessage);
    clearFieldMessage(passwordMatchMessage);
    clearFieldMessage(emailMessage);
    registerForm.reset();
    isUserIdChecked = false;
}

// ===== API Functions =====
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return response.json();
}

// ===== Authentication =====
async function handleLogin(e) {
    e.preventDefault();
    
    const userId = loginUserIdInput.value.trim();
    const password = loginPasswordInput.value;
    
    if (!userId || !password) {
        showMessage(loginMessage, '아이디와 비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    const submitBtn = loginForm.querySelector('.btn-login');
    setButtonLoading(submitBtn, true);
    hideMessage(loginMessage);
    
    try {
        const result = await apiRequest('/login', 'POST', {
            user_id: userId,
            password: password
        });
        
        if (result.success) {
            currentUser = result.user;
            isLoggedIn = true;
            updateUserDisplay();
            switchToChat();
        } else {
            showMessage(loginMessage, result.message, 'error');
        }
    } catch (error) {
        showMessage(loginMessage, '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const userId = regUserIdInput.value.trim();
    const password = regPasswordInput.value;
    const passwordConfirm = regPasswordConfirmInput.value;
    const name = regNameInput.value.trim();
    const job = regJobInput.value;
    const email = regEmailInput.value.trim();
    
    // Validation
    if (!userId || !password || !passwordConfirm || !name || !job || !email) {
        showMessage(registerMessage, '모든 필수 항목을 입력해주세요.', 'error');
        return;
    }
    
    if (!isUserIdChecked) {
        showMessage(registerMessage, '아이디 중복확인을 해주세요.', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showMessage(registerMessage, '비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (password.length < 8) {
        showMessage(registerMessage, '비밀번호는 8자 이상이어야 합니다.', 'error');
        return;
    }
    
    const submitBtn = registerForm.querySelector('.btn-login');
    setButtonLoading(submitBtn, true);
    hideMessage(registerMessage);
    
    try {
        const result = await apiRequest('/register', 'POST', {
            user_id: userId,
            password: password,
            name: name,
            job: job,
            email: email
        });
        
        if (result.success) {
            showMessage(registerMessage, '회원가입이 완료되었습니다! 로그인해주세요.', 'success');
            setTimeout(() => {
                showLoginForm();
                loginUserIdInput.value = userId;
            }, 1500);
        } else {
            showMessage(registerMessage, result.message, 'error');
        }
    } catch (error) {
        showMessage(registerMessage, '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

async function handleLogout(e) {
    e.preventDefault();
    
    try {
        await apiRequest('/logout', 'POST');
    } catch (error) {
        // Logout locally even if server request fails
    }
    
    isLoggedIn = false;
    currentUser = null;
    
    chatPage.classList.remove('active');
    loginPage.classList.add('active');
    profileDropdown.classList.remove('active');
    
    showLoginForm();
    resetChat();
}

async function checkUserId() {
    const userId = regUserIdInput.value.trim();
    
    if (!userId) {
        showFieldMessage(userIdMessage, '아이디를 입력해주세요.', 'error');
        return;
    }
    
    if (userId.length < 4) {
        showFieldMessage(userIdMessage, '아이디는 4자 이상이어야 합니다.', 'error');
        return;
    }
    
    checkIdBtn.disabled = true;
    
    try {
        const result = await apiRequest(`/check-id/${userId}`);
        
        if (result.exists) {
            showFieldMessage(userIdMessage, '이미 사용 중인 아이디입니다.', 'error');
            isUserIdChecked = false;
        } else {
            showFieldMessage(userIdMessage, '사용 가능한 아이디입니다.', 'success');
            isUserIdChecked = true;
        }
    } catch (error) {
        showFieldMessage(userIdMessage, '확인에 실패했습니다.', 'error');
    } finally {
        checkIdBtn.disabled = false;
    }
}

function checkPasswordMatch() {
    const password = regPasswordInput.value;
    const confirmPassword = regPasswordConfirmInput.value;
    
    if (!confirmPassword) {
        clearFieldMessage(passwordMatchMessage);
        return;
    }
    
    if (password === confirmPassword) {
        showFieldMessage(passwordMatchMessage, '비밀번호가 일치합니다.', 'success');
    } else {
        showFieldMessage(passwordMatchMessage, '비밀번호가 일치하지 않습니다.', 'error');
    }
}

// ===== UI Updates =====
function updateUserDisplay() {
    if (currentUser) {
        displayName.textContent = currentUser.name;
        displayJob.textContent = currentUser.job;
        avatarText.textContent = currentUser.name.substring(0, 2).toUpperCase();
    }
}

async function switchToChat() {
    loginPage.classList.remove('active');
    chatPage.classList.add('active');
    setTimeout(() => messageInput.focus(), 300);
    
    // 모델 상태 확인
    await checkModelStatus();
    if (modelStatus.loaded) {
        console.log(`MedGemma model ready on ${modelStatus.device}`);
    } else {
        console.warn('AI model not loaded - responses may be limited');
    }
}

// ===== Chat Functions =====
function resetChat() {
    chatMessages.innerHTML = `
        <div class="welcome-container">
            <div class="welcome-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/>
                    <path d="M24 12V36M16 24H32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
                </svg>
            </div>
            <h2>무엇을 도와드릴까요?</h2>
            <p>의료 연구에 관한 질문을 해주세요</p>
            
            <div class="suggestion-cards">
                <button class="suggestion-card">
                    <div class="card-icon">📊</div>
                    <div class="card-content">
                        <h4>통계 분석</h4>
                        <p>임상시험 데이터 분석 방법 추천</p>
                    </div>
                </button>
                <button class="suggestion-card">
                    <div class="card-icon">📚</div>
                    <div class="card-content">
                        <h4>문헌 검토</h4>
                        <p>특정 주제의 최신 연구 동향 파악</p>
                    </div>
                </button>
                <button class="suggestion-card">
                    <div class="card-icon">🧬</div>
                    <div class="card-content">
                        <h4>프로토콜 설계</h4>
                        <p>실험 프로토콜 최적화 제안</p>
                    </div>
                </button>
                <button class="suggestion-card">
                    <div class="card-icon">✍️</div>
                    <div class="card-content">
                        <h4>논문 작성</h4>
                        <p>연구 논문 구조화 및 작성 지원</p>
                    </div>
                </button>
            </div>
        </div>
    `;
    
    attachSuggestionListeners();
}

function addMessage(content, type) {
    const welcomeContainer = chatMessages.querySelector('.welcome-container');
    if (welcomeContainer) {
        welcomeContainer.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = type === 'user' 
        ? `<span>${currentUser?.name?.substring(0, 2).toUpperCase() || 'U'}</span>`
        : `<svg width="18" height="18" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/><path d="M24 12V36M16 24H32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${avatar}
        </div>
        <div class="message-content">
            <div class="message-bubble">${content}</div>
            <div class="message-time">${formatTime()}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/><path d="M24 12V36M16 24H32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    messageInput.value = '';
    autoResizeTextarea(messageInput);
    sendBtn.disabled = true;
    
    addTypingIndicator();
    
    try {
        // MedGemma API 호출
        const result = await apiRequest('/chat', 'POST', { message: message });
        
        removeTypingIndicator();
        
        if (result.success) {
            // 마크다운 스타일 텍스트를 HTML로 변환
            const formattedResponse = formatResponseText(result.response);
            addMessage(formattedResponse, 'assistant');
            
            // 모델 정보 로깅 (개발용)
            console.log(`Response from: ${result.model}`);
        } else {
            addMessage('죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.', 'assistant');
        }
    } catch (error) {
        removeTypingIndicator();
        console.error('Chat error:', error);
        addMessage('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'assistant');
    }
    
    sendBtn.disabled = false;
    messageInput.focus();
}

// 응답 텍스트 포맷팅 (마크다운 스타일 → HTML)
function formatResponseText(text) {
    if (!text) return '';
    
    // 줄바꿈 처리
    let formatted = text.replace(/\n/g, '<br>');
    
    // **bold** 처리
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // *italic* 처리
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 리스트 항목 처리 (• 또는 -)
    formatted = formatted.replace(/^[•\-]\s/gm, '&bull; ');
    
    return formatted;
}

// 모델 상태 확인
async function checkModelStatus() {
    try {
        const result = await apiRequest('/model-status');
        modelStatus = result;
        console.log('Model status:', modelStatus);
        return modelStatus;
    } catch (error) {
        console.error('Failed to check model status:', error);
        return { loaded: false, model_name: null, device: 'unknown' };
    }
}

function handleSuggestionClick(card) {
    const title = card.querySelector('h4').textContent;
    const desc = card.querySelector('p').textContent;
    
    messageInput.value = `${title}에 대해 알려주세요. ${desc}`;
    sendMessage();
}

function attachSuggestionListeners() {
    const cards = document.querySelectorAll('.suggestion-card');
    cards.forEach(card => {
        card.addEventListener('click', () => handleSuggestionClick(card));
    });
}

// ===== Event Listeners =====
// Form switching
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

// Login form
loginForm.addEventListener('submit', handleLogin);

// Register form
registerForm.addEventListener('submit', handleRegister);
checkIdBtn.addEventListener('click', checkUserId);

// Reset ID check when user changes ID
regUserIdInput.addEventListener('input', () => {
    isUserIdChecked = false;
    clearFieldMessage(userIdMessage);
});

// Password match check
regPasswordConfirmInput.addEventListener('input', checkPasswordMatch);
regPasswordInput.addEventListener('input', checkPasswordMatch);

// Logout
logoutBtn.addEventListener('click', handleLogout);

// Profile dropdown toggle
profileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    profileDropdown.classList.remove('active');
});

// Send message
sendBtn.addEventListener('click', sendMessage);

// Message input - Enter to send, Shift+Enter for new line
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto resize textarea
messageInput.addEventListener('input', () => {
    autoResizeTextarea(messageInput);
});

// New chat button
newChatBtn.addEventListener('click', resetChat);

// Suggestion cards
attachSuggestionListeners();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loginPage.classList.add('active');
});
