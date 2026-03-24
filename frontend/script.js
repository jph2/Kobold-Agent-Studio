const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const usageFill = document.getElementById('usage-fill');
const usageText = document.getElementById('usage-text');
const maxContextInput = document.getElementById('max-context');

// Global model registry from Orchestrator
let availableModels = {};

// Fetch available models from our Orchestrator API
async function fetchModels() {
    try {
        const res = await fetch('http://localhost:8080/api/models');
        availableModels = await res.json();
        renderModelHub();
    } catch(e) { console.error("Could not load Model definitions."); }
}

function renderModelHub() {
    const hub = document.getElementById('model-hub');
    hub.innerHTML = '';
    
    // figure out which one is active by checking the model-indicator text
    const activeText = document.getElementById('model-indicator').innerText.toLowerCase();
    
    Object.values(availableModels).forEach(model => {
        const isActive = activeText.includes(model.name.split(' ')[0].toLowerCase());
        const card = document.createElement('div');
        card.className = `model-card ${isActive ? 'active' : ''}`;
        card.onclick = () => confirmModelSwitch(model);
        
        card.innerHTML = `
            <h3>${model.name}</h3>
            <div class="metrics">
                <span>CTX: ${(model.context/1000).toFixed(0)}k</span>
                <span>${model.speed}</span>
            </div>
            <p class="pros">✓ ${model.pros}</p>
            <p class="cons">✗ ${model.cons}</p>
        `;
        hub.appendChild(card);
    });
}

function confirmModelSwitch(model) {
    const activeText = document.getElementById('model-indicator').innerText.toLowerCase();
    if(activeText.includes(model.name.split(' ')[0].toLowerCase())) {
        alert("This model is currently running!");
        return;
    }
    
    // Determine current token count rough estimate
    const currentTokensStr = document.getElementById('usage-text').innerText.split(' / ')[0].replace(/,/g, '');
    const currentTokens = parseInt(currentTokensStr) || 0;
    
    if (currentTokens > model.context) {
        const confirmSwitch = confirm(`⚠️ WARNING: Context Overflow!\n\nYour current chat history is ~${currentTokens.toLocaleString()} tokens.\nThe new model (${model.name}) only supports a maximum of ${model.context.toLocaleString()} tokens.\n\nIf you proceed, the older parts of the conversation will be completely ignored by the new model (truncation). Do you wish to continue switching?`);
        if (!confirmSwitch) return;
    } else {
        const confirmNormal = confirm(`Switching the Engine to ${model.name} will terminate the current AI process and boot a new one. This takes roughly 15-20 seconds.\n\nReady to hot-swap?`);
        if(!confirmNormal) return;
    }
    
    // User agreed, trigger backend
    fetch('http://localhost:8080/api/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: model.id })
    }).then(() => {
        document.getElementById('model-indicator').innerHTML = `<span class="status-dot error"></span> Rebooting Engine...`;
        setTimeout(renderModelHub, 15000); // refresh UI in 15 seconds
    });
}

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
            if(Object.keys(availableModels).length > 0) renderModelHub();
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
fetchModels();
fetchModelInfo();
setInterval(fetchModelInfo, 5000);

// --- Export & Import Chat States ---
function exportHistory() {
    if (messages.length === 0) {
        alert("Chat is empty! Nothing to export.");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    
    // Create a meaningful filename based on date and time
    const dateStr = new Date().toISOString().slice(0,19).replace(/:/g,"-");
    downloadAnchorNode.setAttribute("download", `claw_chat_state_${dateStr}.json`);
    
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importHistory(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const uploadedMessages = JSON.parse(e.target.result);
            if (Array.isArray(uploadedMessages)) {
                messages = uploadedMessages;
                saveToLocal();
                renderMessages();
                alert(`Successfully imported ${messages.length} messages into context.`);
            } else {
                alert("Invalid file format. Expected a JSON array of messages.");
            }
        } catch (error) {
            alert("Error parsing JSON file: " + error.message);
        }
        // Reset file input so we can upload the same file again if needed
        event.target.value = '';
    };
    reader.readAsText(file);
}
