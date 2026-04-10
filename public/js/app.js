(function () {
  const chatMessages = document.getElementById('chatMessages');
  const chatContainer = document.getElementById('chatContainer');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const modeTabs = document.querySelectorAll('.mode-tab');

  let sessionId = sessionStorage.getItem('fashiongpt_session');
  let currentMode = sessionStorage.getItem('fashiongpt_mode') || 'style-advisor';
  let isLoading = false;

  const WELCOME_MESSAGES = {
    'style-advisor': {
      title: 'Welcome to Style Advisor',
      text: 'Ask me anything about fashion — from building a personal style to finding the perfect outfit for any occasion. I\'m here to help you look and feel your best.',
    },
    'outfit-generator': {
      title: 'Outfit Generator',
      text: 'Tell me about an occasion or vibe, and I\'ll put together complete outfit suggestions for you — from head to toe, with specific colors, fabrics, and styling tips.',
    },
    'wardrobe-assistant': {
      title: 'Wardrobe Assistant',
      text: 'Describe the pieces in your wardrobe, and I\'ll help you discover new combinations, identify gaps, and recommend smart additions that maximize your outfit options.',
    },
  };

  // Initialize
  async function init() {
    setActiveTab(currentMode);
    if (!sessionId) {
      await createSession(currentMode);
    } else {
      await loadSession();
    }
  }

  async function createSession(mode) {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      sessionId = data.sessionId;
      currentMode = data.mode;
      sessionStorage.setItem('fashiongpt_session', sessionId);
      sessionStorage.setItem('fashiongpt_mode', currentMode);
      chatMessages.innerHTML = '';
      showWelcome(currentMode);
    } catch {
      showError('Failed to start session. Please refresh the page.');
    }
  }

  async function loadSession() {
    try {
      const res = await fetch(`/api/session/${sessionId}`);
      if (!res.ok) {
        sessionStorage.removeItem('fashiongpt_session');
        sessionId = null;
        await createSession(currentMode);
        return;
      }
      const data = await res.json();
      currentMode = data.mode;
      sessionStorage.setItem('fashiongpt_mode', currentMode);
      setActiveTab(currentMode);
      chatMessages.innerHTML = '';
      showWelcome(currentMode);
      data.messages.forEach((msg) => appendMessage(msg.role, msg.content));
      scrollToBottom();
    } catch {
      sessionStorage.removeItem('fashiongpt_session');
      sessionId = null;
      await createSession(currentMode);
    }
  }

  // Mode switching
  modeTabs.forEach((tab) => {
    tab.addEventListener('click', async () => {
      const mode = tab.dataset.mode;
      if (mode === currentMode || isLoading) return;

      setActiveTab(mode);
      try {
        const res = await fetch(`/api/session/${sessionId}/mode`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });
        if (!res.ok) {
          await createSession(mode);
          return;
        }
        const data = await res.json();
        currentMode = data.mode;
        sessionStorage.setItem('fashiongpt_mode', currentMode);
        chatMessages.innerHTML = '';
        showWelcome(currentMode);
      } catch {
        await createSession(mode);
      }
    });
  });

  function setActiveTab(mode) {
    modeTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });
  }

  // Chat
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || isLoading) return;

    messageInput.value = '';
    appendMessage('user', text);
    scrollToBottom();

    isLoading = true;
    sendBtn.disabled = true;
    const typingEl = showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();
      removeTyping(typingEl);

      if (res.ok) {
        appendMessage('assistant', data.reply);
      } else {
        showError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      removeTyping(typingEl);
      showError('Network error. Please check your connection and try again.');
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      messageInput.focus();
      scrollToBottom();
    }
  });

  // DOM helpers
  function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${role}`;

    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = role === 'user' ? 'You' : 'FashionGPT';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = formatMarkdown(content);

    wrapper.appendChild(label);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
  }

  function showWelcome(mode) {
    const info = WELCOME_MESSAGES[mode];
    const el = document.createElement('div');
    el.className = 'welcome-message';
    el.innerHTML = `<h2>${info.title}</h2><p>${info.text}</p>`;
    chatMessages.appendChild(el);
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'typing-indicator';
    el.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    chatMessages.appendChild(el);
    scrollToBottom();
    return el;
  }

  function removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function showError(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message assistant';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.style.borderColor = '#e8b4b4';
    bubble.style.background = '#fdf5f5';
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });
  }

  function formatMarkdown(text) {
    // Simple markdown: bold, italic, line breaks, lists
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Unordered lists
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  init();
})();
