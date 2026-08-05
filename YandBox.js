// YandBox.js - AI-powered HTML page generator with real-time progress and version history
import http from 'http';
import { readFileSync, existsSync, writeFileSync, watch } from 'fs';
import path from 'path';
import { URL } from 'url';
import readline from 'readline';
import EasyAI from '/usr/local/etc/EasyAI/EasyAI.js';

class YandBox {
    
    constructor(config = {}) {
        this.port = config.port || 3000;
        this.tokenPath = path.join(process.cwd(), 'yandbox-config.json');
        this.logPath = path.join(process.cwd(), 'yandbox-log.json');
        this.versionsPath = path.join(process.cwd(), 'yandbox-versions.json');
        
        const saved = this.loadConfig();
        this.keys = saved.keys || {};
        this.activeKey = config.activeKey || saved.activeKey || null;
        this.model = config.model || saved.model || null;
        this.sessionCost = 0;
        this.totalCost = saved.totalCost || 0;
        this.requests = [];
        this.versions = [];
        this.currentGeneration = null;   // { abortController, backupHtml, chatRes, message }
        this._originalFetch = null;      // to restore after generation
        
        if (this.activeKey && this.keys[this.activeKey]) {
            const keyData = this.keys[this.activeKey];
            this.token = keyData.token;
            this.provider = keyData.provider;
        } else {
            this.token = null;
            this.provider = null;
        }
        
        if (!this.model && this.provider) {
            this.model = this.provider === 'deepseek' ? 'deepseek-v4-flash' : 'meta-llama/Meta-Llama-3.1-8B-Instruct';
        }
        
        this.saveConfig();
        this.loadVersions();
        
        if (this.token) {
            const aiConfig = {};
            if (this.provider === 'deepseek') {
                aiConfig.deepseek_token = this.token;
                aiConfig.deepseek_model = this.model;
            } else {
                aiConfig.deepinfra_token = this.token;
                aiConfig.deepinfra_model = this.model;
            }
            this.AI = new EasyAI(aiConfig);
        }
        
        this.sseClients = new Set();
        this.requestCount = 0;
        this.startHUD();
        
        this.ensureBaseFiles().then(() => {
            this.initServer();
        }).catch(err => {
            console.error('Failed to initialize YandBox:', err);
            process.exit(1);
        });
    }

    loadConfig() {
        try {
            if (existsSync(this.tokenPath)) {
                return JSON.parse(readFileSync(this.tokenPath, 'utf8'));
            }
        } catch (err) {}
        return {};
    }

    saveConfig() {
        const config = {
            keys: this.keys,
            activeKey: this.activeKey,
            model: this.model,
            totalCost: this.totalCost,
            requests: this.requests.slice(-50)
        };
        writeFileSync(this.tokenPath, JSON.stringify(config, null, 2));
        
        const log = {
            totalCost: this.totalCost,
            requests: this.requests.slice(-100)
        };
        writeFileSync(this.logPath, JSON.stringify(log, null, 2));
    }

    loadVersions() {
        try {
            if (existsSync(this.versionsPath)) {
                this.versions = JSON.parse(readFileSync(this.versionsPath, 'utf8'));
            }
        } catch (err) {
            this.versions = [];
        }
    }

    saveVersions() {
        // Keep only last 10 versions to limit file size
        if (this.versions.length > 10) {
            this.versions = this.versions.slice(-10);
        }
        writeFileSync(this.versionsPath, JSON.stringify(this.versions, null, 2));
    }

    startHUD() {
        const updateHUD = () => {
            console.clear();
            const w = 50;
            const top = '╔' + '═'.repeat(w - 2) + '╗';
            const mid = '╠' + '═'.repeat(w - 2) + '╣';
            const bot = '╚' + '═'.repeat(w - 2) + '╝';
            
            console.log('\x1b[36m' + top + '\x1b[0m');
            console.log('\x1b[36m║\x1b[0m' + '  \x1b[1mYandBox AI Page Generator\x1b[0m' + ' '.repeat(w - 28) + '\x1b[36m║\x1b[0m');
            console.log('\x1b[36m' + mid + '\x1b[0m');
            
            const modelDisplay = (this.model || 'none').length > 30 ? (this.model || 'none').substring(0, 27) + '...' : (this.model || 'none');
            
            const lines = [
                ['Provider', '\x1b[33m' + (this.provider || 'none').toUpperCase() + '\x1b[0m'],
                ['Model', '\x1b[32m' + modelDisplay + '\x1b[0m'],
                ['Port', '\x1b[34m' + this.port + '\x1b[0m'],
                ['Requests', '\x1b[35m' + this.requestCount + '\x1b[0m'],
                ['Session Cost', '\x1b[31m$' + this.sessionCost.toFixed(8) + '\x1b[0m'],
                ['Total Cost', '\x1b[31m$' + this.totalCost.toFixed(8) + '\x1b[0m'],
                ['Generation', this.currentGeneration ? '\x1b[33mACTIVE\x1b[0m' : '\x1b[90midle\x1b[0m']
            ];
            
            lines.forEach(([label, value]) => {
                const line = ` ${label}: ${value}`;
                const cleanLine = line.replace(/\x1b\[\d+m/g, '');
                const padding = w - cleanLine.length - 2;
                console.log('\x1b[36m║\x1b[0m' + line + ' '.repeat(Math.max(0, padding)) + '\x1b[36m║\x1b[0m');
            });
            
            console.log('\x1b[36m' + mid + '\x1b[0m');
            
            const lastRequests = this.requests.slice(-5);
            if (lastRequests.length > 0) {
                lastRequests.forEach(req => {
                    const modelShort = req.model.substring(0, 22).padEnd(22);
                    const cost = '$' + req.cost.toFixed(8);
                    const tokens = String(req.tokens).padEnd(5) + 't';
                    const line = ` \x1b[90m${modelShort}\x1b[0m \x1b[31m${cost}\x1b[0m \x1b[33m${tokens}\x1b[0m`;
                    const cleanLine = line.replace(/\x1b\[\d+m/g, '');
                    const padding = w - cleanLine.length - 2;
                    console.log('\x1b[36m║\x1b[0m' + line + ' '.repeat(Math.max(0, padding)) + '\x1b[36m║\x1b[0m');
                });
            } else {
                const empty = '  No requests yet...';
                console.log('\x1b[36m║\x1b[0m' + empty + ' '.repeat(w - empty.length - 2) + '\x1b[36m║\x1b[0m');
            }
            
            console.log('\x1b[36m' + bot + '\x1b[0m');
        };
        
        updateHUD();
        this.hudInterval = setInterval(updateHUD, 1000);
    }

    async ensureBaseFiles() {
        const files = ['index.html', 'chat.html', 'main.html'];
        const rootDir = process.cwd();

        for (const file of files) {
            const rootPath = path.join(rootDir, file);
            if (!existsSync(rootPath)) {
                const baseName = path.basename(file, '.html');
                const jsPath = path.join(rootDir, '._', `${baseName}.js`);
                if (existsSync(jsPath)) {
                    try {
                        const module = await import(`file://${jsPath}`);
                        const htmlContent = module.default;
                        writeFileSync(rootPath, htmlContent, 'utf8');
                    } catch (err) {
                        console.error(`Failed to generate ${file}:`, err);
                        throw err;
                    }
                }
            }
        }
    }

    initServer() {
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathname = url.pathname;
            
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            // SSE endpoint (used by index.html and loading template)
            if (pathname === '/events') {
                this.handleSSE(req, res);
                return;
            }

            // Chat endpoint – now triggers page generation
            if (pathname === '/chat' && req.method === 'POST') {
                this.handleChatMessage(req, res);
                return;
            }

            // Cancel current generation
            if (pathname === '/cancel-generation' && req.method === 'POST') {
                this.cancelGeneration();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
                return;
            }

            // Version history list
            if (pathname === '/api/versions' && req.method === 'GET') {
                const list = this.versions.map((v, i) => ({
                    index: i,
                    timestamp: v.timestamp,
                    request: v.request.substring(0, 50) + '...',
                    size: v.html.length
                }));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(list));
                return;
            }

            // Revert to a specific version
            if (pathname === '/api/revert' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { index } = JSON.parse(body);
                        await this.revertToVersion(index);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    } catch (err) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });
                return;
            }

            // Serve static files
            if (pathname === '/') {
                try {
                    const indexHtml = readFileSync('./index.html').toString();
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(indexHtml);
                } catch (err) {
                    res.writeHead(500);
                    res.end('Error loading index.html');
                }
                return;
            } else {
                const filePath = path.join(process.cwd(), pathname);
                if (existsSync(filePath)) {
                    try {
                        const fileContent = readFileSync(filePath).toString();
                        const contentType = pathname.endsWith('.html') ? 'text/html' : 'text/plain';
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(fileContent);
                    } catch (err) {
                        res.writeHead(500);
                        res.end('Error loading file');
                    }
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            }
        });

        // Watch main.html for external changes
        try {
            watch('./main.html', (eventType, filename) => {
                if (eventType === 'change' && !this.currentGeneration) {
                    try {
                        const updatedHtml = readFileSync('./main.html', 'utf8');
                        this.broadcastSSE({ type: 'update-html', html: updatedHtml });
                    } catch (err) {}
                }
            });
        } catch (err) {}

        server.listen(this.port, () => {});
    }

    handleSSE(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        res.write('data: {"type":"connected"}\n\n');
        this.sseClients.add(res);

        req.on('close', () => {
            this.sseClients.delete(res);
        });
    }

    broadcastSSE(data) {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        this.sseClients.forEach(client => {
            client.write(message);
        });
    }

    // ---------- Generation logic ----------

    getLoadingTemplate(progressPercent = 0) {
        return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Generating...</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #1e1e1e; color: #ccc; display: flex; align-items: center; justify-content: center; height: 100vh; margin:0; }
  .container { text-align: center; max-width: 400px; width: 90%; }
  .progress-bar { width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden; margin: 20px 0; }
  .progress-fill { height: 100%; width: ${progressPercent}%; background: #0af; transition: width 0.2s; }
  .actions { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }
  button, select { background: #2a2a2a; border: 1px solid #444; color: #ddd; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px; }
  button:hover { background: #3a3a3a; }
  select { min-width: 200px; }
  .status { font-size: 13px; color: #aaa; margin-top: 8px; }
</style>
</head>
<body>
<div class="container">
  <h2>⚡ Generating new page...</h2>
  <div class="progress-bar"><div class="progress-fill" id="fill"></div></div>
  <div class="status" id="status">0%</div>
  <div class="actions">
    <button id="cancelBtn">✕ Cancel</button>
    <select id="versionSelect"><option value="">← Previous versions</option></select>
  </div>
</div>
<script>
  const fill = document.getElementById('fill');
  const status = document.getElementById('status');
  const cancelBtn = document.getElementById('cancelBtn');
  const versionSelect = document.getElementById('versionSelect');
  
  // Load versions list
  fetch('/api/versions')
    .then(r => r.json())
    .then(versions => {
      versions.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.index;
        opt.textContent = v.timestamp + ' – ' + v.request;
        versionSelect.appendChild(opt);
      });
    });
  
  versionSelect.addEventListener('change', () => {
    if (versionSelect.value === '') return;
    fetch('/api/revert', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ index: parseInt(versionSelect.value) })
    }).then(() => {
      // The page will be replaced by SSE update-html shortly
    });
  });
  
  cancelBtn.addEventListener('click', () => {
    fetch('/cancel-generation', { method: 'POST' });
  });
  
  // Listen to progress updates
  const evtSource = new EventSource('/events');
  evtSource.addEventListener('message', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'progress') {
        const p = data.percent || 0;
        fill.style.width = p + '%';
        status.textContent = p + '%';
      }
    } catch(ex) {}
  });
</script>
</body>
</html>`;
    }

    // Abort current generation without touching main.html (used when reverting while generating)
    abortGeneration() {
        const gen = this.currentGeneration;
        if (!gen) return;
        
        // Abort the AI request
        if (gen.abortController) {
            gen.abortController.abort();
        }
        
        // End the chat SSE stream with cancel message
        if (gen.chatRes && !gen.chatRes.writableEnded) {
            gen.chatRes.write(`data: ${JSON.stringify({ type: 'token', token: '❌ Canceled.' })}\n\n`);
            gen.chatRes.write('data: {"type":"end"}\n\n');
            gen.chatRes.end();
        }
        
        // Restore original fetch if overridden
        if (this._originalFetch) {
            globalThis.fetch = this._originalFetch;
            this._originalFetch = null;
        }
        
        this.currentGeneration = null;
    }

    // Cancel and revert to backup
    cancelGeneration() {
        const gen = this.currentGeneration;
        if (!gen) return;
        
        const backupHtml = gen.backupHtml;
        this.abortGeneration();
        
        // Restore the previous HTML
        writeFileSync('./main.html', backupHtml, 'utf8');
        this.broadcastSSE({ type: 'update-html', html: backupHtml });
    }

    // Revert to a specific version by index
    async revertToVersion(index) {
        if (index < 0 || index >= this.versions.length) {
            throw new Error('Invalid version index');
        }
        // Cancel any active generation (without reverting to backup)
        this.abortGeneration();
        
        const versionHtml = this.versions[index].html;
        writeFileSync('./main.html', versionHtml, 'utf8');
        this.broadcastSSE({ type: 'update-html', html: versionHtml });
    }

    // Start the AI generation for a user request
    async startGeneration(message, chatRes) {
        // Read current main.html as backup
        let currentHtml;
        try {
            currentHtml = readFileSync('./main.html', 'utf8');
        } catch (err) {
            currentHtml = '<html><body></body></html>';
        }
        const prevLength = currentHtml.length;

        // Save backup and create generation state
        const abortController = new AbortController();
        this.currentGeneration = {
            abortController,
            backupHtml: currentHtml,
            chatRes,
            message
        };

        // Broadcast loading template to all SSE clients (main page)
        const loadingHtml = this.getLoadingTemplate(0);
        this.broadcastSSE({ type: 'update-html', html: loadingHtml });

        // Override global fetch to support abort
        const originalFetch = globalThis.fetch;
        this._originalFetch = originalFetch;
        globalThis.fetch = (url, options) => {
            options = options || {};
            options.signal = abortController.signal;
            return originalFetch(url, options);
        };

        try {
            const systemPrompt = `You are an expert web developer. The user wants to modify the HTML page. Provide the complete new HTML code. Output ONLY the raw HTML without markdown fences or explanations. Ensure the HTML is valid and includes all necessary tags.`;
            const userPrompt = `Current HTML:\n${currentHtml}\n\nUser request: ${message}\n\nNew HTML:`;
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            let generatedBuffer = '';
            let tokenCount = 0;

            const chatConfig = {
                tokenCallback: async (data) => {
                    const token = data.stream?.content || data.content || '';
                    if (token) {
                        generatedBuffer += token;
                        tokenCount++;
                        const percent = Math.min(100, Math.round((generatedBuffer.length / prevLength) * 100));
                        this.broadcastSSE({ type: 'progress', percent });
                    }
                }
            };

            if (this.provider === 'deepseek') {
                chatConfig.deepseek = true;
            } else {
                chatConfig.deepinfra = true;
            }

            const result = await this.AI.Chat(messages, chatConfig);

            // Extract final HTML (remove possible code fences)
            let finalHtml = generatedBuffer.trim();
            // Remove leading/trailing ```html fences
            finalHtml = finalHtml.replace(/^```html\s*/, '').replace(/```$/, '');
            // If still wrapped in ```, strip
            if (finalHtml.startsWith('```') && finalHtml.endsWith('```')) {
                finalHtml = finalHtml.slice(3, -3).trim();
            }

            // Save the new main.html
            writeFileSync('./main.html', finalHtml, 'utf8');

            // Add version to history
            this.versions.push({
                timestamp: new Date().toLocaleString(),
                request: message,
                html: finalHtml
            });
            this.saveVersions();

            // Broadcast final update
            this.broadcastSSE({ type: 'update-html', html: finalHtml });

            // Send success to chat
            chatRes.write(`data: ${JSON.stringify({ type: 'token', token: '✅ Page updated successfully!' })}\n\n`);
            chatRes.write('data: {"type":"end"}\n\n');
            chatRes.end();

            // Update cost (optional)
            if (result.metadata?.usage) {
                const usage = result.metadata.usage;
                const tokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
                let cost = 0;
                if (usage.estimated_cost) {
                    cost = usage.estimated_cost;
                } else if (this.provider === 'deepseek' && this.AI.DeepSeek) {
                    cost = this.AI.DeepSeek._calculateCost(this.model, usage);
                }
                if (tokens > 0) {
                    this.requestCount++;
                    this.sessionCost += cost;
                    this.totalCost += cost;
                    this.requests.push({
                        model: this.model || 'unknown',
                        cost,
                        tokens,
                        time: new Date().toLocaleTimeString()
                    });
                    this.saveConfig();
                }
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                // Generation was cancelled
                // Already handled by abortGeneration / cancelGeneration
                return;
            }
            // Other error
            console.error('Generation error:', error);
            // Restore backup
            writeFileSync('./main.html', this.currentGeneration.backupHtml, 'utf8');
            this.broadcastSSE({ type: 'update-html', html: this.currentGeneration.backupHtml });
            if (!chatRes.writableEnded) {
                chatRes.write(`data: ${JSON.stringify({ type: 'token', token: '❌ Error generating page.' })}\n\n`);
                chatRes.write('data: {"type":"end"}\n\n');
                chatRes.end();
            }
        } finally {
            // Restore fetch and clean up
            globalThis.fetch = this._originalFetch;
            this._originalFetch = null;
            this.currentGeneration = null;
        }
    }

    async handleChatMessage(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { message } = JSON.parse(body);
                
                if (!this.AI) {
                    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                    res.write('data: {"type":"token","token":"No API token configured."}\n\n');
                    res.write('data: {"type":"end"}\n\n');
                    res.end();
                    return;
                }

                if (this.currentGeneration) {
                    // Another generation already in progress
                    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                    res.write(`data: ${JSON.stringify({ type: 'token', token: '⏳ A generation is already in progress. Please wait or cancel it.' })}\n\n`);
                    res.write('data: {"type":"end"}\n\n');
                    res.end();
                    return;
                }
                
                // Set up SSE response for chat
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });

                // Send initial chat message
                res.write(`data: ${JSON.stringify({ type: 'token', token: '🔄 Generating new page...' })}\n\n`);
                
                // Start generation asynchronously (it will use res to stream final message)
                this.startGeneration(message, res);

            } catch (error) {
                if (!res.headersSent) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: error.message }));
                } else {
                    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
                    res.end();
                }
            }
        });
    }
}

// ---------- CLI helpers (unchanged) ----------
async function question(q) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(q, ans => {
        rl.close();
        resolve(ans);
    }));
}

function getModels(provider) {
    const dummyConfig = {};
    if (provider === 'deepseek') {
        dummyConfig.deepseek_token = 'dummy';
    } else {
        dummyConfig.deepinfra_token = 'dummy';
    }
    const tempAI = new EasyAI(dummyConfig);
    const api = provider === 'deepseek' ? tempAI.DeepSeek : tempAI.DeepInfra;
    return api.constructor.Models;
}

async function selectModel(provider) {
    const models = getModels(provider);
    const defaultModel = provider === 'deepseek' ? 'deepseek-v4-flash' : 'meta-llama/Meta-Llama-3.1-8B-Instruct';
    
    console.log(`\n\x1b[36mAvailable ${provider.toUpperCase()} models:\x1b[0m`);
    console.log(`  \x1b[90mDefault: \x1b[32m${defaultModel}\x1b[0m\n`);
    models.forEach((model, i) => {
        console.log(`  \x1b[33m${i + 1}\x1b[0m. \x1b[32m${model}\x1b[0m`);
    });

    const choice = await question('\n\x1b[36mSelect model (1-' + models.length + ') or Enter for default:\x1b[0m \x1b[90m> \x1b[0m');

    if (choice && !isNaN(choice) && choice >= 1 && choice <= models.length) {
        return models[choice - 1];
    }
    return defaultModel;
}

async function manageKeys() {
    const tokenPath = path.join(process.cwd(), 'yandbox-config.json');
    const saved = existsSync(tokenPath) ? JSON.parse(readFileSync(tokenPath, 'utf8')) : {};
    const keys = saved.keys || {};
    const activeKey = saved.activeKey || null;
    
    console.clear();
    const w = 50;
    const top = '\x1b[36m╔' + '═'.repeat(w - 2) + '╗\x1b[0m';
    const mid = '\x1b[36m╠' + '═'.repeat(w - 2) + '╣\x1b[0m';
    const bot = '\x1b[36m╚' + '═'.repeat(w - 2) + '╝\x1b[0m';
    
    console.log(top);
    console.log('\x1b[36m║\x1b[0m' + '  \x1b[1mAPI Keys Manager\x1b[0m' + ' '.repeat(w - 20) + '\x1b[36m║\x1b[0m');
    console.log(mid);
    
    const keyNames = Object.keys(keys);
    if (keyNames.length > 0) {
        keyNames.forEach((name) => {
            const isActive = name === activeKey;
            const prefix = isActive ? '\x1b[32m*\x1b[0m' : ' ';
            const masked = keys[name].token.substring(0, 8) + '...' + keys[name].token.substring(keys[name].token.length - 4);
            const provider = keys[name].provider.toUpperCase();
            const model = (keys[name].model || 'default').substring(0, 20);
            const line = ` ${prefix} ${name.padEnd(10)} ${provider.padEnd(10)} ${model}`;
            const cleanLine = line.replace(/\x1b\[\d+m/g, '');
            console.log('\x1b[36m║\x1b[0m' + line + ' '.repeat(Math.max(0, w - cleanLine.length - 2)) + '\x1b[36m║\x1b[0m');
            console.log(`\x1b[36m║\x1b[0m   \x1b[90m${masked}\x1b[0m` + ' '.repeat(Math.max(0, w - masked.length - 5)) + '\x1b[36m║\x1b[0m');
        });
    } else {
        console.log('\x1b[36m║\x1b[0m  No keys saved...' + ' '.repeat(w - 20) + '\x1b[36m║\x1b[0m');
    }
    
    console.log(mid);
    console.log('\x1b[36m║\x1b[0m  \x1b[33ma\x1b[0m - Add    \x1b[33ms\x1b[0m - Select    \x1b[33mm\x1b[0m - Model    \x1b[33md\x1b[0m - Del    \x1b[33mq\x1b[0m - Quit\x1b[36m║\x1b[0m');
    console.log(bot);
    
    const action = await question('\n\x1b[36mAction:\x1b[0m \x1b[90m> \x1b[0m');
    
    if (action === 'a') {
        console.log('\n\x1b[36mPaste API token:\x1b[0m');
        console.log('\x1b[90m(DeepSeek tokens start with sk-, others = DeepInfra)\x1b[0m');
        const token = (await question('\x1b[90m> \x1b[0m')).trim();
        if (!token) return false;
        
        const provider = token.startsWith('sk-') ? 'deepseek' : 'deepinfra';
        console.log(`\n\x1b[90mDetected: \x1b[33m${provider.toUpperCase()}\x1b[0m`);
        
        const name = await question('\x1b[36mKey name (Enter for default):\x1b[0m \x1b[90m> \x1b[0m');
        const keyName = name.trim() || 'default';
        
        keys[keyName] = { token, provider };
        saved.keys = keys;
        
        if (!saved.activeKey) {
            saved.activeKey = keyName;
        }
        
        writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
        console.log('\x1b[32m✓ Key added! Using default model.\x1b[0m');
        console.log('\x1b[90m  Run "node YandBox.js models" to change model.\x1b[0m');
        return true;
        
    } else if (action === 's' && keyNames.length > 0) {
        const name = await question('\x1b[36mKey name to activate:\x1b[0m \x1b[90m> \x1b[0m');
        if (keys[name.trim()]) {
            saved.activeKey = name.trim();
            writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
            console.log('\x1b[32m✓ Active key: ' + name.trim() + '\x1b[0m');
        }
        return true;
        
    } else if (action === 'm' && keyNames.length > 0) {
        const targetKey = activeKey || keyNames[0];
        if (keys[targetKey]) {
            const model = await selectModel(keys[targetKey].provider);
            keys[targetKey].model = model;
            saved.model = model;
            saved.keys = keys;
            writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
            console.log('\x1b[32m✓ Model updated: ' + model + '\x1b[0m');
        }
        return true;
        
    } else if (action === 'd' && keyNames.length > 0) {
        const name = await question('\x1b[36mKey name to delete:\x1b[0m \x1b[90m> \x1b[0m');
        if (keys[name.trim()]) {
            delete keys[name.trim()];
            saved.keys = keys;
            if (saved.activeKey === name.trim()) {
                saved.activeKey = Object.keys(keys)[0] || null;
            }
            writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
            console.log('\x1b[32m✓ Key deleted!\x1b[0m');
        }
        return true;
        
    } else if (action === 'q') {
        return false;
    }
    
    return false;
}

async function parseArgs() {
    const args = process.argv.slice(2);
    const config = {};
    const tokenPath = path.join(process.cwd(), 'yandbox-config.json');
    let saved = existsSync(tokenPath) ? JSON.parse(readFileSync(tokenPath, 'utf8')) : {};
    
    if (args.includes('keys') || args.includes('models')) {
        await manageKeys();
        saved = existsSync(tokenPath) ? JSON.parse(readFileSync(tokenPath, 'utf8')) : {};
        if (saved.activeKey && saved.keys?.[saved.activeKey]) {
            return config;
        }
        process.exit(0);
    }
    
    if (args.includes('--clear')) {
        writeFileSync(tokenPath, JSON.stringify({ keys: saved.keys || {} }, null, 2));
        console.log('\x1b[32m✓ Config cleared\x1b[0m');
        process.exit(0);
    }

    for (const arg of args) {
        if (arg.startsWith('--port=')) {
            config.port = parseInt(arg.split('=')[1]);
        }
    }

    for (const arg of args) {
        if (!arg.startsWith('--')) {
            const provider = arg.startsWith('sk-') ? 'deepseek' : 'deepinfra';
            const name = 'default';
            saved.keys = saved.keys || {};
            saved.keys[name] = { token: arg, provider };
            saved.activeKey = name;
            saved.model = provider === 'deepseek' ? 'deepseek-v4-flash' : 'meta-llama/Meta-Llama-3.1-8B-Instruct';
            writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
            console.log('\x1b[32m✓ ' + provider.toUpperCase() + ' token saved! Starting with default model.\x1b[0m');
            console.log('\x1b[90m  Run "node YandBox.js models" to change.\x1b[0m\n');
            return config;
        }
    }

    if (!saved.activeKey || !saved.keys?.[saved.activeKey]) {
        console.log('\x1b[33mNo API key configured.\x1b[0m');
        console.log('\x1b[90mPaste your API token (sk-... = DeepSeek, other = DeepInfra):\x1b[0m\n');
        const token = (await question('\x1b[90m> \x1b[0m')).trim();
        if (!token) {
            console.log('\x1b[31mNo token provided. Exiting.\x1b[0m');
            process.exit(0);
        }
        
        const provider = token.startsWith('sk-') ? 'deepseek' : 'deepinfra';
        const name = 'default';
        saved.keys = saved.keys || {};
        saved.keys[name] = { token, provider };
        saved.activeKey = name;
        saved.model = provider === 'deepseek' ? 'deepseek-v4-flash' : 'meta-llama/Meta-Llama-3.1-8B-Instruct';
        writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
        console.log('\x1b[32m✓ ' + provider.toUpperCase() + ' configured! Starting server...\x1b[0m\n');
        return config;
    }

    if (!saved.model && saved.activeKey && saved.keys?.[saved.activeKey]) {
        const provider = saved.keys[saved.activeKey].provider;
        saved.model = provider === 'deepseek' ? 'deepseek-v4-flash' : 'meta-llama/Meta-Llama-3.1-8B-Instruct';
        writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
    }

    return config;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const config = await parseArgs();
    const yandbox = new YandBox(config);
}

export default YandBox;