const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const systemStatus = document.getElementById('system-status');

// Default Kobold Endpoint
const KOBOLD_URL = 'http://localhost:5001/v1/chat/completions';

// Marked configuration
marked.setOptions({
    breaks: true,
    gfm: true
});

function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'bot-msg'}`;
    msgDiv.innerHTML = marked.parse(text);
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return msgDiv;
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';
    appendMessage('user', text);

    // Initial Bot Message (Loading State)
    const botMsgDiv = appendMessage('bot', 'Nemotron is thinking...');
    systemStatus.textContent = 'System: Processing...';
    systemStatus.style.borderColor = '#ffcc00';
    systemStatus.style.color = '#ffcc00';

    try {
        const response = await fetch(KOBOLD_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'nemotron-cascade-2',
                messages: [{ role: 'user', content: text }],
                temperature: parseFloat(document.getElementById('temp').value) || 0.7,
                max_tokens: 4096
            })
        });

        if (!response.ok) throw new Error('CORS or Connection Error. Make sure Kobold is started with --corsorigin *');

        const data = await response.json();
        const reply = data.choices[0].message.content;

        botMsgDiv.innerHTML = marked.parse(reply);
        systemStatus.textContent = 'System: Ready';
        systemStatus.style.borderColor = '#00d4ff';
        systemStatus.style.color = '#00d4ff';

    } catch (error) {
        botMsgDiv.innerHTML = `<span style="color: #ff4a4a;">Error: ${error.message}</span>`;
        systemStatus.textContent = 'System: Network Error';
        systemStatus.style.borderColor = '#ff4a4a';
        systemStatus.style.color = '#ff4a4a';
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-expand textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
