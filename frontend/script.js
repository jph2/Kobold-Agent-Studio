const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const usageFill = document.getElementById('usage-fill');
const usageText = document.getElementById('usage-text');
const maxContextInput = document.getElementById('max-context');

// Fetch the currently loaded model from Kobold API
async function fetchModelInfo() {
    const modelBadge = document.getElementById('model-indicator');
    try {
        const response = await fetch('http://localhost:5001/api/v1/model');
        if (response.ok) {
            const data = await response.json();
            // extract filename from path "C:/Kobald/Model.gguf"
            let modelPath = data.result || "Unknown Model";
            let modelName = modelPath.split(/[/\\]/).pop().replace('.gguf', '');
            
            // Format nice display string
            modelBadge.innerHTML = `<span class="status-dot active"></span> <span title="${modelPath}">${modelName}</span>`;
        } else {
            modelBadge.innerHTML = `<span class="status-dot error"></span> API Error`;
        }
    } catch (e) {
        modelBadge.innerHTML = `<span class="status-dot error"></span> Offline`;
    }
}

let messages = JSON.parse(localStorage.getItem('claw_chat_history')) || [];

// Configuration
const KOBOLD_URL = 'http://localhost:5001/v1/chat/completions';

marked.setOptions({ breaks: true, gfm: true });

function saveToLocal() {
    localStorage.setItem('claw_chat_history', JSON.stringify(messages));
}

function clearHistory() {
    messages = [];
    localStorage.removeItem('claw_chat_history');
    renderMessages();
}

function updateContextGauge(usedTokens = 0) {
    const max = parseInt(maxContextInput.value) || 32768;
    const percent = Math.min(100, (usedTokens / max) * 100);
    
    usageFill.style.width = percent + '%';
    usageText.textContent = `${usedTokens.toLocaleString()} / ${(max / 1024).toFixed(0)}k`;
}

function renderMessages() {
    saveToLocal();
    chatContainer.innerHTML = '';
    messages.forEach((msg, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper';
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.role === 'user' ? 'user-msg' : 'bot-msg'}`;
        msgDiv.innerHTML = marked.parse(msg.content);
        
        const actions = document.createElement('div');
        actions.className = 'msg-actions';
        
        let regenBtn = (msg.role === 'assistant') ? `<button class="action-btn" onclick="regenerateFrom(${index})">Regen 🎲</button>` : '';
        
        actions.innerHTML = `
            ${regenBtn}
            <button class="action-btn" onclick="startEdit(${index})">Edit</button>
            <button class="action-btn" onclick="deleteMsg(${index})" style="color:rgba(255,255,255,0.3)">Del</button>
        `;
        
        wrapper.appendChild(msgDiv);
        wrapper.appendChild(actions);
        chatContainer.appendChild(wrapper);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function startEdit(index) {
    const parent = chatContainer.children[index];
    const msgDiv = parent.querySelector('.message');
    const originalText = messages[index].content;
    
    msgDiv.innerHTML = `<textarea class="edit-area" id="edit-area-${index}">${originalText}</textarea>
                        <div style="margin-top: 5px; display: flex; gap: 10px;">
                            <button class="action-btn" style="color:var(--neon-blue)" onclick="saveEdit(${index})">Save</button>
                            <button class="action-btn" onclick="renderMessages()">Cancel</button>
                        </div>`;
    
    const textarea = document.getElementById(`edit-area-${index}`);
    textarea.style.height = (textarea.scrollHeight + 10) + 'px';
}

function saveEdit(index) {
    const newText = document.getElementById(`edit-area-${index}`).value;
    messages[index].content = newText;
    renderMessages();
}

function deleteMsg(index) {
    messages.splice(index, 1);
    renderMessages();
}

async function regenerateFrom(index) {
    // To regenerate bot msg at index, we remove it and everything after it
    // then call API with the history before it.
    messages = messages.slice(0, index);
    renderMessages();
    
    // The previous message was the user query, so we just call the API logic
    await callApi();
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    messages.push({ role: 'user', content: text });
    chatInput.value = '';
    chatInput.style.height = 'auto';
    renderMessages();
    
    await callApi();
}

async function callApi() {
    // Initial Bot Message (Loading State)
    const botIndex = messages.length;
    messages.push({ role: 'assistant', content: 'generating...' });
    renderMessages();

    try {
        const response = await fetch(KOBOLD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages.slice(0, -1), // History up to current
                temperature: parseFloat(document.getElementById('temp').value) || 0.7,
                max_tokens: parseInt(document.getElementById('max-tokens').value) || 4096
            })
        });

        const data = await response.json();
        const reply = data.choices[0].message.content;
        const usage = data.usage || { total_tokens: 0 };
        
        messages[botIndex] = { role: 'assistant', content: reply };
        
        // Update Usage
        const max = parseInt(maxContextInput.value) || 32768;
        const used = usage.total_tokens || 0;
        const percent = Math.min(100, (used / max) * 100);
        
        usageFill.style.width = percent + '%';
        usageText.textContent = `${used.toLocaleString()} / ${(max / 1024).toFixed(0)}k`;
        
        renderMessages();

    } catch (error) {
        messages[botIndex] = { role: 'assistant', content: `<span style="color:var(--error-red)">Error: ${error.message}</span>` };
        renderMessages();
    }
}

// Listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

function clearAll() {
    if (confirm('Delete ALL messages?')) {
        messages = [];
        saveToLocal();
        renderMessages();
    }
}

// Initial render of history
renderMessages();

// Start pinging the engine to see what model is currently loaded
fetchModelInfo();
setInterval(fetchModelInfo, 5000);
