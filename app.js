// ===== DOM Elements =====
const loginPage = document.getElementById('login-page');
const chatPage = document.getElementById('chat-page');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const newChatBtn = document.getElementById('new-chat-btn');
const profileMenuBtn = document.getElementById('profile-menu-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const suggestionCards = document.querySelectorAll('.suggestion-card');

// ===== State =====
let isLoggedIn = false;
let currentUser = null;

// ===== Demo Responses =====
const demoResponses = [
    "최신 연구에 따르면, 해당 주제에 대해 여러 중요한 발견이 있었습니다. 주요 논문들을 검토한 결과, 다음과 같은 핵심 포인트를 정리해 드릴 수 있습니다:\n\n1. 최근 5년간의 메타분석 결과\n2. 임상시험에서 관찰된 효과 크기\n3. 현재 권장되는 프로토콜\n\n더 자세한 정보가 필요하시면 말씀해 주세요.",
    "해당 연구 방법론에 대해 설명드리겠습니다. 일반적으로 사용되는 접근법은 다음과 같습니다:\n\n• **무작위 대조 시험 (RCT)**: 가장 높은 근거 수준\n• **코호트 연구**: 장기 추적 관찰에 적합\n• **체계적 문헌고찰**: 기존 연구 종합\n\n연구 설계 시 고려해야 할 주요 사항을 함께 검토해 드릴까요?",
    "통계 분석 방법에 대한 질문이시네요. 해당 데이터 유형과 연구 목적에 따라 적절한 분석 방법이 달라집니다.\n\n연속형 변수의 경우 t-test나 ANOVA를, 범주형 변수의 경우 카이제곱 검정을 추천드립니다. 다변량 분석이 필요한 경우 회귀분석이나 Cox 비례위험 모형도 고려해 보세요.\n\n데이터에 대해 더 자세히 알려주시면 구체적인 추천을 드릴 수 있습니다.",
    "논문 작성과 관련하여 도움을 드리겠습니다. IMRAD 구조(서론, 방법, 결과, 고찰)를 기본으로 하되, 타겟 저널의 가이드라인을 반드시 확인하세요.\n\n특히 주의할 점:\n- 초록은 마지막에 작성\n- 방법론의 재현가능성 확보\n- 결과는 객관적으로 기술\n- 고찰에서 한계점 명시\n\n특정 섹션에 대해 더 자세한 안내가 필요하시면 말씀해 주세요."
];

// ===== Utility Functions =====
function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function getRandomResponse() {
    return demoResponses[Math.floor(Math.random() * demoResponses.length)];
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// ===== Authentication =====
function handleLogin(e) {
    e.preventDefault();
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    // Simple validation
    if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
    }
    
    // Demo login - accept any credentials
    isLoggedIn = true;
    currentUser = {
        email: email,
        name: email.split('@')[0],
        role: '의료 연구원'
    };
    
    // Update UI
    const userNameEl = document.querySelector('.user-name');
    const avatarEl = document.querySelector('.avatar span');
    
    if (userNameEl) {
        userNameEl.textContent = currentUser.name;
    }
    if (avatarEl) {
        avatarEl.textContent = currentUser.name.substring(0, 2).toUpperCase();
    }
    
    // Switch to chat page
    loginPage.classList.remove('active');
    chatPage.classList.add('active');
    
    // Focus on message input
    setTimeout(() => messageInput.focus(), 300);
}

function handleLogout(e) {
    e.preventDefault();
    
    isLoggedIn = false;
    currentUser = null;
    
    // Reset form
    loginForm.reset();
    
    // Switch to login page
    chatPage.classList.remove('active');
    loginPage.classList.add('active');
    
    // Close dropdown
    profileDropdown.classList.remove('active');
    
    // Reset chat
    resetChat();
}

// ===== Chat Functions =====
function resetChat() {
    // Restore welcome message
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
    
    // Reattach suggestion card listeners
    attachSuggestionListeners();
}

function addMessage(content, type) {
    // Remove welcome container if exists
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
    
    // Add user message
    addMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    autoResizeTextarea(messageInput);
    
    // Disable send button
    sendBtn.disabled = true;
    
    // Show typing indicator
    addTypingIndicator();
    
    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // Remove typing indicator and add response
    removeTypingIndicator();
    addMessage(getRandomResponse(), 'assistant');
    
    // Re-enable send button
    sendBtn.disabled = false;
    messageInput.focus();
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
// Login form
loginForm.addEventListener('submit', handleLogin);

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

// Check for saved session (demo)
document.addEventListener('DOMContentLoaded', () => {
    // Could implement session persistence here
    loginPage.classList.add('active');
});

