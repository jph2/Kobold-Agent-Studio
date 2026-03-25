const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const usageFill = document.getElementById('usage-fill');
const usageText = document.getElementById('usage-text');
const maxContextInput = document.getElementById('max-context');

let availableModels = {};
let isSwitching = false;

function setSafeHtml(element, html) {
    const template = document.createElement('template');
    template.innerHTML = html;

    template.content.querySelectorAll('script, iframe, object, embed, link, meta, style').forEach((node) => node.remove());

    template.content.querySelectorAll('*').forEach((node) => {
        [...node.attributes].forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim();
            if (name.startsWith('on')) {
                node.removeAttribute(attr.name);
                return;
            }
            if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^javascript:/i.test(value)) {
                node.removeAttribute(attr.name);
                return;
            }
            if (name === 'srcdoc') {
                node.removeAttribute(attr.name);
            }
        });
    });

    element.replaceChildren(template.content.cloneNode(true));
}

function createActionButton(label, handler, extraStyle = '') {
    const button = document.createElement('button');
    button.className = 'action-btn';
    if (extraStyle) button.style.cssText = extraStyle;
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
}

async function fetchModels() {
    try {
        const hostIp = window.location.hostname || '127.0.0.1';
        const res = await fetch(`http://${hostIp}:8080/api/models`);
        availableModels = await res.json();
        renderModelHub();
    } catch (e) {
        console.error('Could not load Model definitions.');
    }
}

function renderModelHub() {
    const hub = document.getElementById('model-hub');
    hub.innerHTML = '';

    const activeText = document.getElementById('model-indicator').innerText.toLowerCase();

    Object.values(availableModels).forEach((model) => {
        const isActive = activeText.includes(model.name.split(' ')[0].toLowerCase());

        const card = document.createElement('div');
        card.className = `model-card ${isActive ? 'active' : ''}`;
        card.addEventListener('click', () => confirmModelSwitch(model));

        const title = document.createElement('h3');
        title.textContent = model.name;

        const metrics = document.createElement('div');
        metrics.className = 'metrics';
        const ctx = document.createElement('span');
        ctx.textContent = `CTX: ${(model.context ? model.context / 1000 : 0).toFixed(0)}k`;
        const speed = document.createElement('span');
        speed.textContent = model.speed;
        metrics.append(ctx, speed);

        const pros = document.createElement('p');
        pros.className = 'pros';
        pros.textContent = `✓ ${model.pros}`;

        const cons = document.createElement('p');
        cons.className = 'cons';
        cons.textContent = `✗ ${model.cons}`;

        card.append(title, metrics, pros, cons);
        hub.appendChild(card);
    });
}

function confirmModelSwitch(model) {
    if (isSwitching) return;

    const activeText = document.getElementById('model-indicator').innerText.toLowerCase();
    if (activeText.includes(model.name.split(' ')[0].toLowerCase())) {
        alert('This model is currently running!');
        return;
    }

    let wantsSummary = false;
    if (messages.length > 0) {
        wantsSummary = confirm('🧠 Memory Compression Protocol\n\nDo you want the current AI to summarize the current conversation before the model switch?\n\n(OK = summarize first, Cancel = switch immediately).');
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

    const summaryMessages = [...messages];
    summaryMessages.push({
        role: 'user',
        content: 'Summarize our conversation into a dense technical briefing. Keep key decisions, logic, and important details. Drop filler. Format as Markdown for handoff to the next model.'
    });

    try {
        const hostIp = window.location.hostname || '127.0.0.1';
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

            messages = [
                { role: 'assistant', content: `### 🧠 INHERITED MEMORY COMPRESSION\n\n*The previous model left the following handoff:*\n\n---\n\n${summaryText}` }
            ];

            localStorage.setItem('claw_chat_history', JSON.stringify(messages));
            renderMessages();
            triggerBackendSwap(targetModel);
        } else {
            alert('Summarization failed. Switching without compression.');
            triggerBackendSwap(targetModel);
        }
    } catch (e) {
        console.error(e);
        alert('Summarization request failed. Switching normally.');
        triggerBackendSwap(targetModel);
    }
}

function triggerBackendSwap(targetModel) {
    document.getElementById('model-indicator').innerHTML = `<span class="status-dot error"></span> Rebooting Engine...`;

    const hostIp = window.location.hostname || '127.0.0.1';
    fetch(`http://${hostIp}:8080/api/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: targetModel.id })
    }).then(() => {
        setTimeout(() => {
            isSwitching = false;
            renderModelHub();
        }, 15000);
    });
}

async function fetchModelInfo() {
    const modelBadge = document.getElementById('model-indicator');
    const killBtn = document.getElementById('global-killswitch');

    try {
        const hostIp = window.location.hostname || '127.0.0.1';
        fetch(`http://${hostIp}:8080/api/ping`, { method: 'GET' }).catch(() => console.log('Ping failed'));

        const response = await fetch(`http://${hostIp}:5001/api/v1/model`);
        if (response.ok) {
            const data = await response.json();
            const modelPath = data.result || 'Unknown Model';
            const modelName = modelPath.split(/[/\\]/).pop().replace('.gguf', '');

            modelBadge.innerHTML = `<span class="status-dot active"></span> <span></span>`;
            const labelNode = modelBadge.querySelector('span:last-child');
            labelNode.textContent = modelName;
            labelNode.title = modelPath;

            if (killBtn) {
                killBtn.classList.remove('offline');
                killBtn.classList.add('active');
                killBtn.textContent = 'DOUBLE-CLICK TO KILL';
            }

            if (Object.keys(availableModels).length > 0) renderModelHub();
        } else {
            modelBadge.innerHTML = `<span class="status-dot error"></span> API Error`;
            if (killBtn) {
                killBtn.classList.remove('active');
                killBtn.classList.add('offline');
                killBtn.textContent = 'DOUBLE-CLICK TO KILL';
            }
        }
    } catch (e) {
        modelBadge.innerHTML = `<span class="status-dot error"></span> Offline`;
        if (killBtn) {
            killBtn.classList.remove('active');
            killBtn.classList.add('offline');
            killBtn.textContent = 'DOUBLE-CLICK TO KILL';
        }
    }
}

async function powerOffGPU() {
    const killBtn = document.getElementById('global-killswitch');
    if (killBtn && killBtn.classList.contains('offline')) return;

    const hostIp = window.location.hostname || '127.0.0.1';
    document.getElementById('model-indicator').innerHTML = `<span class="status-dot error"></span> Shutting Down...`;

    if (killBtn) {
        killBtn.classList.remove('active');
        killBtn.classList.add('offline');
        killBtn.textContent = 'KILLING...';
    }

    try {
        await fetch(`http://${hostIp}:8080/api/poweroff`, { method: 'POST' });
        setTimeout(fetchModelInfo, 2000);
    } catch (e) {
        console.error('Failed to shutdown', e);
        if (killBtn) {
            killBtn.classList.add('active');
            killBtn.classList.remove('offline');
            killBtn.textContent = 'DOUBLE-CLICK TO KILL';
        }
    }
}

let messages = [];
try {
    const rawData = localStorage.getItem('claw_chat_history');
    if (rawData) {
        messages = JSON.parse(rawData) || [];
    }
} catch (e) {
    console.warn('Stored chat history was invalid and has been reset.');
    localStorage.removeItem('claw_chat_history');
}

const HOST_IP = window.location.hostname || '127.0.0.1';
const KOBOLD_URL = `http://${HOST_IP}:5001/v1/chat/completions`;

marked.setOptions({ breaks: true, gfm: true });

let sessionId = localStorage.getItem('claw_session_id');
if (!sessionId) {
    const dateStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    sessionId = 'Chat_' + dateStr;
    localStorage.setItem('claw_session_id', sessionId);
}

function saveToLocal() {
    localStorage.setItem('claw_chat_history', JSON.stringify(messages));

    const hostIp = window.location.hostname || '127.0.0.1';
    fetch(`http://${hostIp}:8080/api/save_history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, messages: messages })
    }).catch(() => {});
}

function clearHistory() {
    messages = [];
    localStorage.removeItem('claw_chat_history');

    const dateStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    sessionId = 'Chat_' + dateStr;
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

        let rawHtml = marked.parse(String(msg.content || ''));
        rawHtml = rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT REMOVED]');
        setSafeHtml(msgDiv, rawHtml);

        const actions = document.createElement('div');
        actions.className = 'msg-actions';

        if (msg.role === 'assistant') {
            actions.appendChild(createActionButton('Regenerate 🎲', () => regenerateFrom(index)));
        }
        if (msg.role === 'user') {
            actions.appendChild(createActionButton('Resend 🚀', () => resendFrom(index)));
        }
        actions.appendChild(createActionButton('Edit', () => startEdit(index)));
        actions.appendChild(createActionButton('Del', () => deleteMsg(index), 'color:rgba(255,255,255,0.3)'));

        wrapper.appendChild(msgDiv);
        wrapper.appendChild(actions);
        chatContainer.appendChild(wrapper);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function startEdit(index) {
    const parent = chatContainer.children[index];
    const msgDiv = parent.querySelector('.message');
    const originalText = String(messages[index].content || '');

    msgDiv.replaceChildren();

    const textarea = document.createElement('textarea');
    textarea.className = 'edit-area';
    textarea.id = `edit-area-${index}`;
    textarea.value = originalText;

    const controls = document.createElement('div');
    controls.style.marginTop = '5px';
    controls.style.display = 'flex';
    controls.style.gap = '10px';

    controls.appendChild(createActionButton('Save', () => saveEdit(index), 'color:var(--neon-blue)'));
    controls.appendChild(createActionButton('Save & Resend', () => saveAndResend(index), 'color:var(--neon-blue)'));
    controls.appendChild(createActionButton('Cancel', () => renderMessages()));

    msgDiv.appendChild(textarea);
    msgDiv.appendChild(controls);

    textarea.style.height = textarea.scrollHeight + 10 + 'px';
}

function saveEdit(index) {
    const newText = document.getElementById(`edit-area-${index}`).value;
    messages[index].content = newText;
    renderMessages();
}

async function saveAndResend(index) {
    const newText = document.getElementById(`edit-area-${index}`).value;
    messages[index].content = newText;
    messages = messages.slice(0, index + 1);
    renderMessages();
    await callApi();
}

async function deleteMsg(index) {
    messages = messages.slice(0, index);
    renderMessages();
    if (messages.length > 0) {
        await callApi();
    }
}

async function resendFrom(index) {
    messages = messages.slice(0, index + 1);
    renderMessages();
    await callApi();
}

async function regenerateFrom(index) {
    messages = messages.slice(0, index);
    renderMessages();
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
            const hostIp = window.location.hostname || '127.0.0.1';
            const searchReq = await fetch(`http://${hostIp}:8080/api/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            });
            if (searchReq.ok) {
                const searchData = await searchReq.json();
                if (searchData.results) {
                    finalPrompt += `\n\n> [!NOTE]\n> **Live Internet Data:** ${searchData.results}\n> *(Please use the data above to answer the primary query if relevant)*`;
                }
            }
        } catch (e) {
            console.error('Web Search Request failed or Orchestrator is disconnected.');
        }
    }

    messages.push({ role: 'user', content: finalPrompt });
    chatInput.value = '';
    chatInput.style.height = 'auto';
    renderMessages();

    await callApi();
}

async function callApi() {
    const botIndex = messages.length;
    messages.push({ role: 'assistant', content: 'generating...' });
    renderMessages();

    try {
        const response = await fetch(KOBOLD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages.slice(0, -1),
                temperature: parseFloat(document.getElementById('temp').value) || 0.7,
                max_tokens: parseInt(document.getElementById('max-tokens').value) || 4096
            })
        });

        const data = await response.json();
        const reply = data.choices[0].message.content;
        const usage = data.usage || { total_tokens: 0 };

        messages[botIndex] = { role: 'assistant', content: reply };

        const max = parseInt(maxContextInput.value) || 32768;
        const used = usage.total_tokens || 0;
        const percent = Math.min(100, (used / max) * 100);

        usageFill.style.width = percent + '%';
        usageText.textContent = `${used.toLocaleString()} / ${(max / 1024).toFixed(0)}k`;

        renderMessages();
    } catch (error) {
        messages[botIndex] = { role: 'assistant', content: `Error: ${error.message}` };
        renderMessages();
    }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

function clearAll() {
    if (confirm('Delete ALL messages?')) {
        messages = [];
        saveToLocal();
        renderMessages();
    }
}

renderMessages();
fetchModels();
fetchModelInfo();
setInterval(fetchModelInfo, 5000);

function exportHistory() {
    if (messages.length === 0) {
        alert('Chat is empty! Nothing to export.');
        return;
    }

    let mdContent = '# 🧠 Memory State Export\n\n';
    messages.forEach((m) => {
        let roleHeading = 'System';
        if (m.role === 'user') roleHeading = 'User';
        if (m.role === 'assistant') roleHeading = 'Assistant';
        mdContent += `## ${roleHeading}\n\n${m.content}\n\n`;
    });

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);

    const dateStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadAnchorNode.setAttribute('download', `agent_memory_state_${dateStr}.md`);

    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importHistory(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const content = e.target.result;

            if (file.name.endsWith('.json')) {
                messages = JSON.parse(content);
            } else {
                const newMessages = [];
                const blocks = content.split(/^## (System|User|Assistant)/m);
                for (let i = 1; i < blocks.length; i += 2) {
                    const roleName = blocks[i].toLowerCase();
                    const msgContent = blocks[i + 1].trim();
                    newMessages.push({ role: roleName, content: msgContent });
                }
                if (newMessages.length === 0) throw new Error('Invalid MD Extracted Structure.');
                messages = newMessages;
            }

            localStorage.setItem('claw_chat_history', JSON.stringify(messages));
            renderMessages();
            alert(`Successfully imported ${messages.length} messages into context.`);
        } catch (error) {
            alert('Parsing Error. Ensure it is a valid Memory State Export (.md or .json).');
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}
