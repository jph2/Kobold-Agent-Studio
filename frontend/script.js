const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const usageFill = document.getElementById('usage-fill');
const usageText = document.getElementById('usage-text');
const maxContextInput = document.getElementById('max-context');

// Global model registry from Orchestrator
let availableModels = {};
let isSwitching = false;

// Fetch available models from our Orchestrator API
async function fetchModels() {
    try {
        const hostIp = window.location.hostname || "127.0.0.1";
        const res = await fetch(`http://${hostIp}:8080/api/models`);
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
        // For GGUF files, we match the prefix of the filename to the card text usually
        const isActive = activeText.includes(model.name.split(' ')[0].toLowerCase());
        
        const card = document.createElement('div');
        card.className = `model-card ${isActive ? 'active' : ''}`;
        card.onclick = () => confirmModelSwitch(model);
        
        card.innerHTML = `
            <h3>${model.name}</h3>
            <div class="metrics">
                <span>CTX: ${(model.context ? model.context/1000 : 0).toFixed(0)}k</span>
                <span>${model.speed}</span>
            </div>
            <p class="pros">✓ ${model.pros}</p>
            <p class="cons">✗ ${model.cons}</p>
        `;
        hub.appendChild(card);
    });
}

function confirmModelSwitch(model) {
    if (isSwitching) return; // Prevent double-click disasters
    
    const activeText = document.getElementById('model-indicator').innerText.toLowerCase();
    if(activeText.includes(model.name.split(' ')[0].toLowerCase())) {
        alert("This model is currently running!");
        return;
    }
    
    let wantsSummary = false;
    
    // Fragt ab, ob komprimiert werden soll, falls Chat existiert
    if (messages.length > 0) {
        wantsSummary = confirm(`🧠 Memory Compression Protocol\n\nDo you want the current AI to densely summarize all reasoning, logic, and context into a single "Inherited Memory State" before executing the hot-swap?\n\n(Click OK to Auto-Summarize, or Cancel to keep raw loose text and swap immediately).`);
    }

    if (wantsSummary) {
        isSwitching = true;
        executeSummarizeAndSwap(model);
    } else {
        isSwitching = true;
        triggerBackendSwap(model);
    }
}

async function executeSummarizeAndSwap(targetModel) {
    document.getElementById('model-indicator').innerHTML = `<span class="status-dot error" style="background:var(--neon-blue);box-shadow:0 0 8px var(--neon-blue);"></span> Distilling Memory...`;
    
    let summaryMessages = [...messages];
    summaryMessages.push({
        role: "user",
        // Der Befehl, der das alte Modell zwingt, sein "Gehirn" für das naechste Modell in eine dichte Form zu giessen
        content: "CRITICAL SYSTEM PROTOCOL: Summarize our entire conversation thus far into a highly dense, expert-level technical briefing. Extract all core logical deductions, architectural decisions, and important snippets. Discard conversational filler. Format as a dense Markdown specification document. This summary will be strictly inherited by the next AI engine."
    });

    try {
        const hostIp = window.location.hostname || "127.0.0.1";
        const response = await fetch(`http://${hostIp}:5001/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: summaryMessages,
                max_tokens: 2048,
                temperature: 0.2
            })
        });

        if (response.ok) {
            const data = await response.json();
            const summaryText = data.choices[0].message.content;

            // Zerstören des alten Chats und ersetzen mit dem komprimierten "Memory Block"
            messages = [
                { role: "assistant", content: "### 🧠 INHERITED MEMORY COMPRESSION\n\n*The previous AI architecture left you the following contextual memory state to continue from:*\n\n---\n\n" + summaryText }
            ];
            
            localStorage.setItem('claw_chat_history', JSON.stringify(messages));
            renderMessages();
            triggerBackendSwap(targetModel);
        } else {
            alert("Summarization logic failed (API Error). Switching without compression.");
            triggerBackendSwap(targetModel);
        }
    } catch(e) {
        console.error(e);
        alert("Summarization request failed. Engine offline? Switching normally.");
        triggerBackendSwap(targetModel);
    }
}

function triggerBackendSwap(targetModel) {
    document.getElementById('model-indicator').innerHTML = `<span class="status-dot error"></span> Rebooting Engine...`;
    
    const hostIp = window.location.hostname || "127.0.0.1";
    fetch(`http://${hostIp}:8080/api/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: targetModel.id })
    }).then(() => {
        setTimeout(() => {
            isSwitching = false;
            renderModelHub();
        }, 15000); // GGUF takes 15 secs
    });
}

// Fetch the currently loaded model from Kobold API
async function fetchModelInfo() {
    const modelBadge = document.getElementById('model-indicator');
    const killBtn = document.getElementById('global-killswitch');
    
    const virtualModel = localStorage.getItem('claw_virtual_model');
    
    try {
        const hostIp = window.location.hostname || "127.0.0.1";
        
        // Ping Orchestrator so it knows UI is active and GPU should stay awake
        fetch(`http://${hostIp}:8080/api/ping`, {method: 'GET'}).catch(e=>console.log("Ping failed"));
        
        const response = await fetch(`http://${hostIp}:5001/api/v1/model`);
        if (response.ok) {
            const data = await response.json();
            // extract filename from path "C:/Kobald/Model.gguf"
            let modelPath = data.result || "Unknown Model";
            let modelName = modelPath.split(/[/\\]/).pop().replace('.gguf', '');
            
            // Format nice display string
            modelBadge.innerHTML = `<span class="status-dot active"></span> <span title="${modelPath}">${modelName}</span>`;
            
            if (killBtn) {
                killBtn.classList.remove('offline');
                killBtn.classList.add('active');
                killBtn.innerHTML = "DOUBLE-CLICK TO KILL";
            }
            
            if(Object.keys(availableModels).length > 0) renderModelHub();
        } else {
            modelBadge.innerHTML = `<span class="status-dot error"></span> API Error`;
            if (killBtn) { killBtn.classList.remove('active'); killBtn.classList.add('offline'); killBtn.innerHTML = "DOUBLE-CLICK TO KILL"; }
        }
    } catch (e) {
        modelBadge.innerHTML = `<span class="status-dot error"></span> Offline`;
        if (killBtn) { killBtn.classList.remove('active'); killBtn.classList.add('offline'); killBtn.innerHTML = "DOUBLE-CLICK TO KILL"; }
    }
}


async function powerOffGPU() {
    const killBtn = document.getElementById('global-killswitch');
    if(killBtn && killBtn.classList.contains('offline')) return; // ignore clicks if already offline
    
    // Removed browser confirm() popup because double-click is visually safer and faster!
    const hostIp = window.location.hostname || "127.0.0.1";
    document.getElementById('model-indicator').innerHTML = `<span class="status-dot error"></span> Shutting Down...`;
    
    if (killBtn) {
        killBtn.classList.remove('active');
        killBtn.classList.add('offline');
        killBtn.innerHTML = "KILLING...";
    }
    
    try {
        await fetch(`http://${hostIp}:8080/api/poweroff`, {method: 'POST'});
        setTimeout(fetchModelInfo, 2000);
    } catch(e) {
        console.error("Failed to shutdown", e);
        if (killBtn) { killBtn.classList.add('active'); killBtn.classList.remove('offline'); killBtn.innerHTML = "DOUBLE-CLICK TO KILL"; }
    }
}

let messages = [];
try {
    const rawData = localStorage.getItem('claw_chat_history');
    if (rawData) {
        messages = JSON.parse(rawData) || [];
    }
} catch(e) {
    console.warn("Memory State Storage wurde manipuliert oder ist defekt. Chat-Historie wurde resettet.");
    localStorage.removeItem('claw_chat_history');
}

// API Endpoints (Network Aware)
const HOST_IP = window.location.hostname || "127.0.0.1";
const KOBOLD_URL = `http://${HOST_IP}:5001/v1/chat/completions`;

marked.setOptions({ breaks: true, gfm: true });

let sessionId = localStorage.getItem('claw_session_id');
if(!sessionId) {
    const dateStr = new Date().toISOString().slice(0,19).replace(/:/g,"-");
    sessionId = "Chat_" + dateStr;
    localStorage.setItem('claw_session_id', sessionId);
}

function saveToLocal() {
    localStorage.setItem('claw_chat_history', JSON.stringify(messages));
    
    // Fire and forget save to backend (Silent Memory Syncing)
    const hostIp = window.location.hostname || "127.0.0.1";
    fetch(`http://${hostIp}:8080/api/save_history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, messages: messages })
    }).catch(e=>{});
}

function clearHistory() {
    messages = [];
    localStorage.removeItem('claw_chat_history');
    
    // Create new session ID so the server saves into a new file!
    const dateStr = new Date().toISOString().slice(0,19).replace(/:/g,"-");
    sessionId = "Chat_" + dateStr;
    localStorage.setItem('claw_session_id', sessionId);
    
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
        // Convert Markdown to HTML securely (Basic XSS Sanitization)
        let rawHtml = marked.parse(msg.content);
        // 1. Strip raw script tags
        rawHtml = rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[MALICIOUS SCRIPT TAG REMOVED]');
        // 2. Strip inline event handlers (onerror=, onclick=, etc)
        rawHtml = rawHtml.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
        rawHtml = rawHtml.replace(/on\w+\s*=\s*'[^']*'/gi, '');
        
        msgDiv.innerHTML = rawHtml;
        
        // Create actions row (Edit, Delete, Regenerate)
        const actions = document.createElement('div');
        actions.className = 'msg-actions';
        
        let regenBtn = (msg.role === 'assistant') ? `<button class="action-btn" onclick="regenerateFrom(${index})">Regenerate 🎲</button>` : '';
        let resendBtn = (msg.role === 'user') ? `<button class="action-btn" onclick="resendFrom(${index})">Resend 🚀</button>` : '';
        
        actions.innerHTML = `
            ${regenBtn}
            ${resendBtn}
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
                            <button class="action-btn" style="color:var(--neon-blue)" onclick="saveAndResend(${index})">Save & Resend</button>
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

async function saveAndResend(index) {
    const newText = document.getElementById(`edit-area-${index}`).value;
    messages[index].content = newText;
    // Remove all messages after this one so the conversation branches from here
    messages = messages.slice(0, index + 1);
    renderMessages();
    await callApi();
}

async function deleteMsg(index) {
    // Truncate the chat, removing this message and everything after it
    messages = messages.slice(0, index);
    renderMessages();
    // Restart automatically from this point if there is history left
    if (messages.length > 0) {
        await callApi();
    }
}

async function resendFrom(index) {
    // Keep this user message, drop everything after it, and trigger API
    messages = messages.slice(0, index + 1);
    renderMessages();
    await callApi();
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

    let finalPrompt = text;
    const webSearchToggle = document.getElementById('websearch-toggle');
    
    if (webSearchToggle && webSearchToggle.checked) {
        document.getElementById('model-indicator').innerHTML = `<span class="status-dot error" style="background:var(--neon-blue);box-shadow:0 0 8px var(--neon-blue);"></span> Searching Web...`;
        try {
            const hostIp = window.location.hostname || "127.0.0.1";
            const searchReq = await fetch(`http://${hostIp}:8080/api/search`, {
                method: 'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({query: text})
            });
            if (searchReq.ok) {
               const searchData = await searchReq.json();
               if(searchData.results) {
                   // Append the live search data stealthily to the prompt visualization
                   finalPrompt += `\n\n> [!NOTE]\n> **Live Internet Data:** ${searchData.results}\n> *(Please use the data above to answer the primary query if relevant)*`;
               }
            }
        } catch(e) {
            console.error("Web Search Request failed or Orchestrator is disconnected.");
        }
    }
    messages.push({ role: 'user', content: finalPrompt });
    chatInput.value = '';
    chatInput.style.height = 'auto'; // reset height
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
    
    let mdContent = "# 🧠 Memory State Export\n\n";
    messages.forEach(m => {
        let roleHeading = "System";
        if (m.role === "user") roleHeading = "User";
        if (m.role === "assistant") roleHeading = "Assistant";
        mdContent += `## ${roleHeading}\n\n${m.content}\n\n`;
    });
    
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    const dateStr = new Date().toISOString().slice(0,19).replace(/:/g,"-");
    downloadAnchorNode.setAttribute("download", `agent_memory_state_${dateStr}.md`);
    
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importHistory(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            
            if (file.name.endsWith('.json')) {
                messages = JSON.parse(content);
            } else {
                // Parse MD
                let newMessages = [];
                const blocks = content.split(/^## (System|User|Assistant)/m);
                for (let i = 1; i < blocks.length; i += 2) {
                    const roleName = blocks[i].toLowerCase();
                    const msgContent = blocks[i+1].trim();
                    newMessages.push({ role: roleName, content: msgContent });
                }
                if(newMessages.length === 0) throw new Error("Invalid MD Extracted Structure.");
                messages = newMessages;
            }
            
            localStorage.setItem('claw_chat_history', JSON.stringify(messages)); // safe save strategy
            renderMessages();
            alert(`Successfully imported ${messages.length} messages into context.`);
        } catch (error) {
            alert("Parsing Error. Ensure it is a valid Memory State Export (.md or .json).");
        }
        event.target.value = ''; 
    };
    reader.readAsText(file);
}
