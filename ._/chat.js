// ._/chat.js – Exports the HTML for chat.html (the floating chat widget)
//
// IMPROVEMENTS:
// - Widget can be dragged anywhere on the entire page (iframe follows it).
// - Only the exact widget area blocks clicks – no oversized overlay.
// - Precision hit area: the circle when minimized, the box when open.
// - Drag threshold prevents accidental open during drag.
// - Widget always stays within viewport edges.
// - Magnetic snap to bottom‑right when released near default.
// - All original chat functionality preserved.
// - FIXED: Iframe no longer resizes during active SSE streaming.

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Chat</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: transparent !important;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    #chat-container {
        position: relative;
        width: 100%;
        height: 100%;
        user-select: none;
    }

    /* ---------- Minimised state: icon circle fills the 40x40 iframe ---------- */
    #chat-icon {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: #007BFF;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        cursor: grab;
    }
    #chat-icon::before {
        content: '';
        width: 0;
        height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-bottom: 10px solid white;
        transform: rotate(90deg);
        pointer-events: none;
    }

    /* ---------- Expanded chat box fills the 300x400 iframe ---------- */
    #chat-box {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #007BFF;
        color: white;
        border-radius: 15px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    #chat-box-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        cursor: grab;
    }

    #close-icon {
        width: 20px;
        height: 20px;
        position: relative;
        cursor: pointer;
        opacity: 0.8;
    }
    #close-icon:hover { opacity: 1; }
    #close-icon::before, #close-icon::after {
        content: '';
        position: absolute;
        width: 18px;
        height: 2px;
        background-color: white;
        top: 9px;
        left: 1px;
        pointer-events: none;
    }
    #close-icon::before { transform: rotate(45deg); }
    #close-icon::after  { transform: rotate(-45deg); }

    #chat-content {
        flex: 1;
        overflow-y: auto;
        padding: 0 15px 10px;
        scrollbar-width: thin;
        scrollbar-color: #0056b3 #007BFF;
        cursor: auto;
    }
    #chat-content::-webkit-scrollbar {
        width: 6px;
    }
    #chat-content::-webkit-scrollbar-track {
        background: #007BFF;
    }
    #chat-content::-webkit-scrollbar-thumb {
        background: #0056b3;
        border-radius: 3px;
    }

    #chat-input-area {
        display: flex;
        align-items: center;
        background: white;
        border-radius: 20px;
        margin: 0 10px 10px;
        padding: 5px;
        cursor: auto;
    }
    #chat-input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 10px;
        font-size: 14px;
        color: #333;
        outline: none;
    }
    #chat-input::placeholder { color: #666; }
    #send-button {
        background: none;
        border: none;
        color: #007BFF;
        font-size: 24px;
        cursor: pointer;
        padding: 0 5px;
    }

    .chat-message {
        background-color: #0056b3;
        padding: 8px 12px;
        margin: 5px 0;
        border-radius: 20px;
        font-size: 14px;
        word-break: break-word;
    }
</style>
</head>
<body>

<div id="chat-container">
    <div id="chat-icon"></div>
    <div id="chat-box">
        <div id="chat-box-header">
            <span style="font-weight:bold;">Chat</span>
            <div id="close-icon"></div>
        </div>
        <div id="chat-content"></div>
        <div id="chat-input-area">
            <input type="text" id="chat-input" placeholder="Type your message…" autocomplete="off">
            <button id="send-button">➤</button>
        </div>
    </div>
</div>

<script>
(function() {
    // ---------- DOM references ----------
    const chatIcon = document.getElementById('chat-icon');
    const chatBox = document.getElementById('chat-box');
    const closeIcon = document.getElementById('close-icon');
    const chatContent = document.getElementById('chat-content');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    // ---------- Constants ----------
    const ICON_SIZE = 40;
    const BOX_WIDTH = 300;
    const BOX_HEIGHT = 400;
    const PADDING = 20;
    const DRAG_THRESHOLD = 3;
    const SNAP_DISTANCE = 60;

    // Default position (bottom-right with padding)
    const defaultX = window.parent.innerWidth - ICON_SIZE - PADDING;
    const defaultY = window.parent.innerHeight - ICON_SIZE - PADDING;

    // ---------- State ----------
    let isOpen = false;
    let dragging = false;
    let dragStartAbsX, dragStartAbsY;
    let initialAbsLeft, initialAbsTop;
    let hasMoved = false;

    // Current absolute position and size of the widget (and the iframe)
    let currentAbsLeft = defaultX;
    let currentAbsTop  = defaultY;
    let currentWidth = ICON_SIZE;
    let currentHeight = ICON_SIZE;

    // ---------- Communicate with parent ----------
    function sendPosition() {
        window.parent.postMessage({
            type: 'position',
            left: currentAbsLeft,
            top: currentAbsTop,
            width: currentWidth,
            height: currentHeight
        }, '*');
    }

    // ---------- Clamp position so the widget stays inside the parent viewport ----------
    function clampPosition(left, top, width, height) {
        const maxLeft = window.parent.innerWidth - width;
        const maxTop  = window.parent.innerHeight - height;
        left = Math.max(0, Math.min(left, maxLeft));
        top  = Math.max(0, Math.min(top, maxTop));
        return { left, top };
    }

    // ---------- Magnetic snap ----------
    function snapToDefault() {
        currentAbsLeft = defaultX;
        currentAbsTop  = defaultY;
    }

    function isNearDefault(left, top) {
        return Math.abs(left - defaultX) < SNAP_DISTANCE &&
               Math.abs(top - defaultY)  < SNAP_DISTANCE;
    }

    // ---------- Open / Close ----------
    function openChat() {
        if (isOpen) return;

        // The icon's bottom-right becomes the box's bottom-right
        let newLeft = currentAbsLeft - (BOX_WIDTH - ICON_SIZE);
        let newTop  = currentAbsTop  - (BOX_HEIGHT - ICON_SIZE);

        const clamped = clampPosition(newLeft, newTop, BOX_WIDTH, BOX_HEIGHT);
        newLeft = clamped.left;
        newTop  = clamped.top;

        currentAbsLeft = newLeft;
        currentAbsTop  = newTop;
        currentWidth   = BOX_WIDTH;
        currentHeight  = BOX_HEIGHT;
        isOpen = true;

        // Show box, hide icon
        chatIcon.style.display = 'none';
        chatBox.style.display = 'flex';

        sendPosition();
        chatInput.focus();
    }

    function closeChat() {
        if (!isOpen) return;

        // The box's bottom-right becomes the icon's bottom-right
        let newLeft = currentAbsLeft + (BOX_WIDTH - ICON_SIZE);
        let newTop  = currentAbsTop  + (BOX_HEIGHT - ICON_SIZE);

        const clamped = clampPosition(newLeft, newTop, ICON_SIZE, ICON_SIZE);
        newLeft = clamped.left;
        newTop  = clamped.top;

        // Magnetic snap to default position
        if (isNearDefault(newLeft, newTop)) {
            newLeft = defaultX;
            newTop  = defaultY;
        }

        currentAbsLeft = newLeft;
        currentAbsTop  = newTop;
        currentWidth   = ICON_SIZE;
        currentHeight  = ICON_SIZE;
        isOpen = false;

        chatIcon.style.display = 'flex';
        chatBox.style.display = 'none';

        sendPosition();
    }

    // ---------- Drag handling ----------
    function getAbsolutePosition(clientX, clientY) {
        // clientX/clientY are relative to the iframe's viewport.
        // The iframe's top-left in the parent = (currentAbsLeft, currentAbsTop).
        return {
            x: currentAbsLeft + clientX,
            y: currentAbsTop  + clientY
        };
    }

    function onDragStart(e) {
        if (e.target.closest('input, button, #close-icon')) return;
        e.preventDefault();

        const point = e.touches ? e.touches[0] : e;
        const abs = getAbsolutePosition(point.clientX, point.clientY);
        dragStartAbsX = abs.x;
        dragStartAbsY = abs.y;
        initialAbsLeft = currentAbsLeft;
        initialAbsTop  = currentAbsTop;
        dragging = true;
        hasMoved = false;

        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
    }

    function onDragMove(e) {
        if (!dragging) return;
        e.preventDefault();

        const point = e.touches ? e.touches[0] : e;
        const abs = getAbsolutePosition(point.clientX, point.clientY);
        const dx = abs.x - dragStartAbsX;
        const dy = abs.y - dragStartAbsY;

        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
            hasMoved = true;
        }

        let newLeft = initialAbsLeft + dx;
        let newTop  = initialAbsTop  + dy;

        const clamped = clampPosition(newLeft, newTop, currentWidth, currentHeight);
        currentAbsLeft = clamped.left;
        currentAbsTop  = clamped.top;

        sendPosition(); // update iframe position during drag
    }

    function onDragEnd() {
        if (!dragging) return;
        dragging = false;

        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
        window.removeEventListener('touchmove', onDragMove);
        window.removeEventListener('touchend', onDragEnd);

        // If no movement, treat as click → toggle open/close
        if (!hasMoved) {
            isOpen ? closeChat() : openChat();
            return;
        }

        // After drag, magnetic snap when minimized
        if (!isOpen && isNearDefault(currentAbsLeft, currentAbsTop)) {
            snapToDefault();
            sendPosition();
        }
    }

    chatIcon.addEventListener('mousedown', onDragStart);
    chatIcon.addEventListener('touchstart', onDragStart, { passive: false });
    // Also allow dragging the chat box header when open
    document.getElementById('chat-box-header').addEventListener('mousedown', onDragStart);
    document.getElementById('chat-box-header').addEventListener('touchstart', onDragStart, { passive: false });

    // ---------- Close button ----------
    closeIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        closeChat();
    });

    // ---------- Message handling (UNCHANGED from original working version) ----------
    let responseBeingProcessed = false;
    let aiMessageContainer = null;

    function saveChatState() {
        localStorage.setItem('chatHistory', chatContent.innerHTML);
    }

    function loadChatState() {
        const saved = localStorage.getItem('chatHistory');
        if (saved) chatContent.innerHTML = saved;
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || responseBeingProcessed) return;

        chatInput.disabled = true;
        sendButton.disabled = true;
        responseBeingProcessed = true;

        const userMsgDiv = document.createElement('div');
        userMsgDiv.classList.add('chat-message');
        userMsgDiv.textContent = 'You: ' + message;
        chatContent.appendChild(userMsgDiv);
        chatInput.value = '';

        aiMessageContainer = null;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '{"type":"end"}') {
                            chatInput.disabled = false;
                            sendButton.disabled = false;
                            responseBeingProcessed = false;
                            chatInput.focus();
                            saveChatState();
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'token') {
                                if (!aiMessageContainer) {
                                    aiMessageContainer = document.createElement('div');
                                    aiMessageContainer.classList.add('chat-message');
                                    aiMessageContainer.textContent = 'AI: ';
                                    chatContent.appendChild(aiMessageContainer);
                                }
                                aiMessageContainer.textContent += parsed.token;
                                chatContent.scrollTop = chatContent.scrollHeight;
                            }
                        } catch (e) {
                            console.error('SSE parse error:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Send error:', error);
        } finally {
            chatInput.disabled = false;
            sendButton.disabled = false;
            responseBeingProcessed = false;
        }
    }

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    loadChatState();

    // Initial position broadcast
    sendPosition();

    // When parent window resizes, we may need to re-clamp.
    window.addEventListener('resize', () => {
        const clamped = clampPosition(currentAbsLeft, currentAbsTop, currentWidth, currentHeight);
        if (clamped.left !== currentAbsLeft || clamped.top !== currentAbsTop) {
            currentAbsLeft = clamped.left;
            currentAbsTop  = clamped.top;
            sendPosition();
        }
    });

})();
<\/script>
</body>
</html>`;

export default html;

// ----- CLI functionality (unchanged) -----
if (import.meta.url === `file://${process.argv[1]}`) {
    import('fs').then(({ writeFileSync, readFileSync, existsSync }) => {
        import('path').then(({ resolve, basename }) => {
            const args = process.argv.slice(2);
            const cmd = args[0];

            const escapeForTemplate = (str) =>
                str.replace(/`/g, '\\`').replace(/\${/g, '\\${');

            if (cmd === '--gen') {
                const outDir = args[1] || '.';
                const outPath = resolve(outDir, 'chat.html');
                writeFileSync(outPath, html, 'utf8');
                console.log(`Generated chat.html at ${outPath}`);
            } else if (cmd === '--update') {
                const inFile = args[1] || 'chat.html';
                if (!existsSync(inFile)) {
                    console.error(`File ${inFile} not found.`);
                    process.exit(1);
                }
                const newHtml = readFileSync(inFile, 'utf8');
                const selfPath = import.meta.url.replace(/^file:\/\//, '');
                const selfContent = readFileSync(selfPath, 'utf8');
                const updatedContent = selfContent.replace(
                    /(const html = )`([\s\S]*?)`;/,
                    (_, prefix, oldContent) => `${prefix}\`${escapeForTemplate(newHtml)}\`;`
                );
                writeFileSync(selfPath, updatedContent, 'utf8');
                console.log(`Updated ${selfPath} with content from ${inFile}`);
            } else {
                console.log(`Usage:
  node ${basename(import.meta.url)} --gen [outputDir]   Generate chat.html in outputDir (default .)
  node ${basename(import.meta.url)} --update [inputFile] Update this JS file with content from inputFile (default chat.html)`);
            }
        });
    });
}