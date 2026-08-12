// YandBox.js - AI-powered HTML page generator with real-time progress and version history
import http from 'http';
import { readFileSync, existsSync, writeFileSync, watch, unlinkSync } from 'fs';
import path from 'path';
import { URL } from 'url';
import readline from 'readline';
import EasyAI from '/usr/local/etc/EasyAI/EasyAI.js';
import PageRefiner from './._/PageRefiner.js';
import SmallModel from './._/._/refiners/SmallModel.js';

class YandBox {
    
    constructor(config = {}) {
        this.port = config.port || 3000;
        this.tokenPath = path.join(process.cwd(), 'yandbox-config.json');
        this.logPath = path.join(process.cwd(), 'yandbox-log.json');
        this.versionsPath = path.join(process.cwd(), 'yandbox-versions.json');
        this.chatHistoryPath = path.join(process.cwd(), 'yandbox-chat-history.json');
        this.generationStatePath = path.join(process.cwd(), 'yandbox-generation-state.json');
        
        const saved = this.loadConfig();
        
        // Migrate old format if needed
        if (!saved.configs && saved.keys) {
            saved.configs = {};
            for (const name in saved.keys) {
                const entry = saved.keys[name];
                saved.configs[name] = {
                    provider: entry.provider || (entry.token && entry.token.startsWith('sk-') ? 'deepseek' : 'deepinfra'),
                    token: entry.token || null,
                    model: entry.model || null,
                    serverUrl: null,
                    serverPort: null,
                    serverToken: null
                };
            }
            delete saved.keys;
            saved.activeConfig = saved.activeConfig || Object.keys(saved.configs)[0] || null;
            this.saveConfigData(saved);
        }
        
        this.configs = saved.configs || {};
        this.activeConfigName = config.activeConfig || saved.activeConfig || null;
        this.totalCost = saved.totalCost || 0;
        this.sessionCost = 0;
        this.requests = saved.requests || [];
        this.versions = [];
        this.currentGeneration = null;
        this._originalFetch = null;
        
        // Chat history - load last 6 messages
        this.chatHistory = this.loadChatHistory();
        
        // Page generation modes
        this.generationMode = config.generationMode || saved.generationMode || 'balanced';
        this.allowedDomains = config.allowedDomains || saved.allowedDomains || [];
        
        // Page refiner system
        if (config.pageRefiner && config.pageRefiner instanceof PageRefiner) {
            this.pageRefiner = config.pageRefiner;
        } else {
            this.pageRefiner = new PageRefiner()
        }
        
        // Progress tracking state
        this._progressState = {
            lastPercent: 0,
            lastUpdateTime: 0,
            isActive: false
        };
        
        // Apply active configuration
        this._applyActiveConfig();
        
        // Set default model if none
        if (!this.model && this.provider) {
            if (this.provider === 'deepseek') {
                this.model = 'deepseek-v4-flash';
            } else if (this.provider === 'deepinfra') {
                this.model = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
            }
        }
        
        this.saveConfig();
        this.loadVersions();
        
        // Instantiate EasyAI based on provider
        if (this.provider) {
            const aiConfig = {};
            
            if (this.provider === 'deepseek') {
                aiConfig.deepseek_token = this.token;
                aiConfig.deepseek_model = this.model;
            } else if (this.provider === 'deepinfra') {
                aiConfig.deepinfra_token = this.token;
                aiConfig.deepinfra_model = this.model;
            } else if (this.provider === 'local') {
                aiConfig.server_url = this.serverUrl || 'http://localhost';
                aiConfig.server_port = this.serverPort || 4000;
                aiConfig.server_token = this.serverToken || '';
            }
            
            this.AI = new EasyAI(aiConfig);
        } else {
            this.AI = null;
        }
        
        this.sseClients = new Set();
        this.requestCount = 0;
        
        // Start SSE heartbeat to clean stale connections and prevent memory leaks
        this._sseHeartbeat = setInterval(() => {
            const deadClients = new Set();
            this.sseClients.forEach(client => {
                if (client.writableEnded || client.destroyed) {
                    deadClients.add(client);
                    return;
                }
                try {
                    client.write(': heartbeat\n\n');
                } catch (error) {
                    deadClients.add(client);
                }
            });
            deadClients.forEach(client => this.sseClients.delete(client));
        }, 30000);
        
        this.startHUD();
        
        this.ensureBaseFiles().then(() => {
            this.initServer();
            // Clear any stale generation state from previous crash
            this._clearStaleGenerationState();
        }).catch(err => {
            console.error('Failed to initialize YandBox:', err);
            process.exit(1);
        });
    }

    // ============ CHAT HISTORY METHODS ============
    
    loadChatHistory() {
        try {
            if (existsSync(this.chatHistoryPath)) {
                return JSON.parse(readFileSync(this.chatHistoryPath, 'utf8'));
            }
        } catch (err) {}
        return [];
    }

    saveChatHistory() {
        // Keep only last 6 messages
        if (this.chatHistory.length > 6) {
            this.chatHistory = this.chatHistory.slice(-6);
        }
        writeFileSync(this.chatHistoryPath, JSON.stringify(this.chatHistory, null, 2));
    }

    _truncateText(text, maxTokens) {
        // Rough estimation: 1 token ≈ 4 characters for English text
        const maxChars = maxTokens * 4;
        if (text.length <= maxChars) return text;
        return text.substring(0, maxChars - 3) + '...';
    }

    _isFirstGeneration(oldHtml) {
        // Check if this is the first generation (empty or minimal HTML)
        if (!oldHtml || oldHtml.trim().length === 0) return true;
        
        // Check for the default empty template
        const stripped = oldHtml.replace(/\s+/g, '').toLowerCase();
        if (stripped === '<html><body></body></html>') return true;
        if (stripped === '<html><head></head><body></body></html>') return true;
        
        // Check if the HTML is just a loading template (contains "Generating..." title)
        if (oldHtml.includes('Generating...') && oldHtml.includes('YandBox')) return false;
        
        return false;
    }

    _generateDiffSummary(oldHtml, newHtml, maxTokens) {
        // For first generation or empty HTML, note it as initial creation
        if (this._isFirstGeneration(oldHtml)) {
            return 'Initial page creation - generated complete new HTML page from scratch based on user request';
        }
        
        // For subsequent generations, create a meaningful diff
        const oldLines = oldHtml.split('\n');
        const newLines = newHtml.split('\n');
        const changes = [];
        
        // Find added/modified lines
        const newSet = new Set(newLines.map(l => l.trim()));
        const oldSet = new Set(oldLines.map(l => l.trim()));
        
        // Added lines (in new but not in old)
        const added = newLines
            .map(l => l.trim())
            .filter(line => line && !oldSet.has(line))
            .slice(0, 10); // Limit to first 10 new lines
        
        // Removed lines (in old but not in new)
        const removed = oldLines
            .map(l => l.trim())
            .filter(line => line && !newSet.has(line))
            .slice(0, 10); // Limit to first 10 removed lines
        
        if (added.length > 0) {
            const addedText = added.join(' | ').substring(0, Math.floor(maxTokens * 2)); // Half for added
            changes.push(`Added: ${addedText}`);
        }
        
        if (removed.length > 0) {
            const removedText = removed.join(' | ').substring(0, Math.floor(maxTokens * 2)); // Half for removed
            changes.push(`Removed: ${removedText}`);
        }
        
        let summary = changes.join(' ');
        if (!summary) {
            // If no clear line-level changes, summarize by size/structural changes
            const sizeDiff = newHtml.length - oldHtml.length;
            if (Math.abs(sizeDiff) > 100) {
                const direction = sizeDiff > 0 ? 'expanded' : 'reduced';
                summary = `Page ${direction} by approximately ${Math.abs(Math.round(sizeDiff / 100) * 100)} characters with structural modifications`;
            } else {
                summary = 'Applied refinements and modifications to existing page content';
            }
        }
        
        return this._truncateText(summary, maxTokens);
    }

    addToChatHistory(userMessage, oldHtml, newHtml) {
        const maxTokensPerDiff = 200;
        const isFirst = this._isFirstGeneration(oldHtml);
        const diffSummary = this._generateDiffSummary(oldHtml, newHtml, maxTokensPerDiff);
        
        this.chatHistory.push({
            timestamp: new Date().toISOString(),
            user: userMessage,
            diff: diffSummary,
            isFirstGeneration: isFirst
        });
        
        // Keep only last 6
        if (this.chatHistory.length > 6) {
            this.chatHistory = this.chatHistory.slice(-6);
        }
        
        this.saveChatHistory();
    }

    _getChatHistoryContext() {
        if (this.chatHistory.length === 0) return '';
        
        const maxTotalTokens = 1200;
        const maxTokensPerMessage = 200;
        let contextParts = [];
        let totalTokens = 0;
        
        // Process from most recent to oldest
        const recentHistory = [...this.chatHistory].reverse();
        
        for (const entry of recentHistory) {
            if (totalTokens >= maxTotalTokens) break;
            
            const userMsg = this._truncateText(entry.user, maxTokensPerMessage);
            const aiDiff = this._truncateText(entry.diff, maxTokensPerMessage);
            
            const userTokens = Math.ceil(userMsg.length / 4);
            const aiTokens = Math.ceil(aiDiff.length / 4);
            const entryTokens = userTokens + aiTokens;
            
            if (totalTokens + entryTokens <= maxTotalTokens) {
                contextParts.push({
                    user: `User request: ${userMsg}`,
                    ai: `Changes made: ${aiDiff}`
                });
                totalTokens += entryTokens;
            } else {
                // Try to fit truncated versions
                const remainingTokens = maxTotalTokens - totalTokens;
                if (remainingTokens > 40) {
                    const halfTokens = Math.floor(remainingTokens / 2);
                    const truncatedUser = this._truncateText(entry.user, halfTokens);
                    const truncatedDiff = this._truncateText(entry.diff, halfTokens);
                    contextParts.push({
                        user: `User request: ${truncatedUser}`,
                        ai: `Changes: ${truncatedDiff}`
                    });
                }
                break;
            }
        }
        
        // Reverse to chronological order
        contextParts.reverse();
        
        if (contextParts.length === 0) return '';
        
        return `\n\nPREVIOUS CONVERSATION HISTORY (${contextParts.length} interactions):\n${
            contextParts.map((p, i) => `[${i + 1}] ${p.user}\n    ${p.ai}`).join('\n')
        }\n\nUse this context to understand the user's evolving requirements. Build upon previous changes rather than starting from scratch. Maintain consistency with the user's established preferences.\n`;
    }

    clearChatHistory() {
        this.chatHistory = [];
        this.saveChatHistory();
    }

    // ============ GENERATION MODES AND RESTRICTIONS ============

    _getGenerationModeConstraints() {
        const modeConstraints = {
            vanilla: `
EXTERNAL RESOURCES RESTRICTION (VANILLA MODE):
⚠️ ABSOLUTELY NO EXTERNAL REQUESTS ALLOWED ⚠️
- NO external CDN links (no Google Fonts, no CDNJS, no unpkg, etc.)
- NO external images (use inline SVG, CSS gradients, or data URIs only)
- NO external fonts (use system fonts only: -apple-system, sans-serif, etc.)
- NO external scripts (all JavaScript must be inline)
- NO external stylesheets (all CSS must be inline or in <style> tags)
- NO external API calls or fetch requests
- ALL resources must be self-contained within the HTML file
- Use emoji or Unicode characters for icons instead of icon libraries
- Create CSS art and designs using only CSS/HTML capabilities
- Implement all functionality with vanilla JavaScript only`,
            
            balanced: `
EXTERNAL RESOURCES GUIDELINES (BALANCED MODE):
- Minimize external requests for better performance
- Prefer inline SVG over external images when possible
- Use system fonts as primary, with one optional web font if needed
- Keep external dependencies to a minimum
- Inline critical CSS, defer non-critical styles
- Use CDN links sparingly and only for essential functionality`,
            
            external: `
EXTERNAL RESOURCES GUIDELINES (EXTERNAL MODE):
- Free to use external CDN resources and libraries
- Can reference external images, fonts, and stylesheets
- May use popular frameworks if beneficial (Tailwind, Bootstrap, etc.)
- Can include external API calls and third-party services
- Use any resources that enhance the design and functionality`
        };
        
        return modeConstraints[this.generationMode] || modeConstraints.balanced;
    }

    _getDomainRestrictions() {
        if (this.generationMode === 'vanilla') {
            return '\n⚠️ ZERO EXTERNAL REQUESTS - All content must be self-contained\n';
        }
        
        if (this.allowedDomains.length > 0) {
            return `\nALLOWED EXTERNAL DOMAINS: ${this.allowedDomains.join(', ')}\nOnly these domains are permitted for external resources.\n`;
        }
        
        return '';
    }

    _applyActiveConfig() {
        const cfg = this.configs[this.activeConfigName] || {};
        this.provider = cfg.provider || null;
        this.token = cfg.token || null;
        this.model = cfg.model || null;
        this.serverUrl = cfg.serverUrl || null;
        this.serverPort = cfg.serverPort || 4000;
        this.serverToken = cfg.serverToken || null;
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
        this.saveConfigData({
            configs: this.configs,
            activeConfig: this.activeConfigName,
            totalCost: this.totalCost,
            requests: this.requests.slice(-50),
            generationMode: this.generationMode,
            allowedDomains: this.allowedDomains
        });
    }

    saveConfigData(data) {
        writeFileSync(this.tokenPath, JSON.stringify(data, null, 2));
        
        const log = {
            totalCost: data.totalCost || this.totalCost,
            requests: (data.requests || this.requests).slice(-100)
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
        if (this.versions.length > 10) {
            this.versions = this.versions.slice(-10);
        }
        writeFileSync(this.versionsPath, JSON.stringify(this.versions, null, 2));
    }

    startHUD() {
        const updateHUD = () => {
            console.clear();
            const w = 55;
            const top = '╔' + '═'.repeat(w - 2) + '╗';
            const mid = '╠' + '═'.repeat(w - 2) + '╣';
            const bot = '╚' + '═'.repeat(w - 2) + '╝';
            
            console.log('\x1b[36m' + top + '\x1b[0m');
            console.log('\x1b[36m║\x1b[0m' + '  \x1b[1mYandBox AI Page Generator\x1b[0m' + ' '.repeat(w - 28) + '\x1b[36m║\x1b[0m');
            console.log('\x1b[36m' + mid + '\x1b[0m');
            
            const providerDisplay = '\x1b[33m' + (this.provider || 'none').toUpperCase() + '\x1b[0m';
            let modelDisplay;
            
            if (this.provider === 'local') {
                const urlStr = this.serverUrl ? `${this.serverUrl}:${this.serverPort}` : 'localhost:4000';
                modelDisplay = '\x1b[32m' + (this.model || urlStr) + '\x1b[0m';
            } else {
                const modelStr = this.model || 'none';
                modelDisplay = '\x1b[32m' + (modelStr.length > 30 ? modelStr.substring(0, 27) + '...' : modelStr) + '\x1b[0m';
            }
            
            const modeColors = { vanilla: '\x1b[32m', balanced: '\x1b[33m', external: '\x1b[31m' };
            const modeColor = modeColors[this.generationMode] || '\x1b[37m';
            
            const lines = [
                ['Provider', providerDisplay],
                ['Model', modelDisplay],
                ['Mode', modeColor + this.generationMode.toUpperCase() + '\x1b[0m'],
                ['Port', '\x1b[34m' + this.port + '\x1b[0m'],
                ['Requests', '\x1b[35m' + this.requestCount + '\x1b[0m'],
                ['Chat History', '\x1b[36m' + this.chatHistory.length + '/6 msgs\x1b[0m'],
                ['Session Cost', '\x1b[31m$' + this.sessionCost.toFixed(8) + '\x1b[0m'],
                ['Total Cost', '\x1b[31m$' + this.totalCost.toFixed(8) + '\x1b[0m'],
                ['Generation', this.currentGeneration ? '\x1b[33mACTIVE\x1b[0m' : '\x1b[90midle\x1b[0m']
            ];
            
            if (this.provider === 'local') {
                lines.splice(2, 0, ['Server', '\x1b[34m' + (this.serverUrl || 'localhost') + ':' + (this.serverPort || 4000) + '\x1b[0m']);
            }
            
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
                    const modelShort = (req.model || 'unknown').substring(0, 22).padEnd(22);
                    const cost = '$' + (req.cost || 0).toFixed(8);
                    const tokens = String(req.tokens || 0).padEnd(5) + 't';
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
                        // Create minimal valid HTML instead of crashing
                        writeFileSync(rootPath, '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YandBox</title></head><body><h1>YandBox Ready</h1></body></html>', 'utf8');
                    }
                } else {
                    // Create minimal valid HTML if source doesn't exist
                    writeFileSync(rootPath, '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YandBox</title></head><body><h1>YandBox Ready</h1></body></html>', 'utf8');
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

            // SSE endpoint
            if (pathname === '/events') {
                this.handleSSE(req, res);
                return;
            }

            // Chat endpoint
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

            // Clear chat history endpoint
            if (pathname === '/api/clear-history' && req.method === 'POST') {
                this.clearChatHistory();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Chat history cleared' }));
                return;
            }

            // Get chat history endpoint
            if (pathname === '/api/chat-history' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    history: this.chatHistory,
                    count: this.chatHistory.length,
                    maxMessages: 6
                }));
                return;
            }

            // Mode management endpoints
            if (pathname === '/api/mode' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    mode: this.generationMode,
                    allowedDomains: this.allowedDomains 
                }));
                return;
            }

            if (pathname === '/api/mode' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { mode, domains } = JSON.parse(body);
                        if (mode && ['vanilla', 'balanced', 'external'].includes(mode)) {
                            this.generationMode = mode;
                        }
                        if (domains && Array.isArray(domains)) {
                            this.allowedDomains = domains;
                        }
                        this.saveConfig();
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, mode: this.generationMode }));
                    } catch (err) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });
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

            // Test connection endpoint
            if (pathname === '/api/test-connection' && req.method === 'GET') {
                this.handleTestConnection(req, res);
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
        const deadClients = new Set();
        
        this.sseClients.forEach(client => {
            if (client.writableEnded || client.destroyed) {
                deadClients.add(client);
                return;
            }
            try {
                client.write(message);
            } catch (error) {
                deadClients.add(client);
            }
        });
        
        deadClients.forEach(client => this.sseClients.delete(client));
    }

    async handleTestConnection(req, res) {
        if (!this.AI) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                connected: false, 
                error: 'No AI instance configured',
                provider: this.provider
            }));
            return;
        }
        
        try {
            const testMessages = [
                { role: 'user', content: 'Say "connected" and nothing else.' }
            ];
            
            const result = await this.AI.Chat(testMessages, { stream: false });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                connected: true,
                provider: this.provider,
                serverUrl: this.serverUrl,
                serverPort: this.serverPort,
                response: result?.full_text || result?.choices?.[0]?.message?.content || 'Response received'
            }));
        } catch (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                connected: false,
                error: err.message,
                provider: this.provider,
                serverUrl: this.serverUrl,
                serverPort: this.serverPort
            }));
        }
    }

    _calculateProgress(generatedLength, estimatedTotal, structure, elapsedSeconds, tokenCount) {
        let charRatio = Math.min(1, generatedLength / Math.max(estimatedTotal, 1));
        let charProgress = 70 * (Math.log(1 + 9 * charRatio) / Math.log(10));
        
        let structureProgress = 0;
        if (structure.tags > 0) {
            const closingRatio = Math.min(1, structure.closingTags / Math.max(structure.tags, 1));
            structureProgress = 15 * (closingRatio < 0.5 
                ? 2 * closingRatio * closingRatio 
                : -1 + (4 - 2 * closingRatio) * closingRatio);
        }
        
        let timeProgress;
        if (elapsedSeconds < 3) {
            timeProgress = 10 * (elapsedSeconds / 3) * 0.5;
        } else if (elapsedSeconds < 15) {
            timeProgress = 5 + 5 * ((elapsedSeconds - 3) / 12);
        } else {
            timeProgress = 10 * (1 - Math.exp(-elapsedSeconds / 30));
        }
        
        const tokensPerSecond = elapsedSeconds > 0 ? tokenCount / elapsedSeconds : 0;
        const velocityProgress = Math.min(5, tokensPerSecond * 0.5);
        
        return Math.min(95, Math.max(0, Math.round(charProgress + structureProgress + timeProgress + velocityProgress)));
    }

    _sendProgress(percent, force = false) {
        const now = Date.now();
        const state = this._progressState;
        
        const minInterval = percent < 30 ? 100 : (percent < 60 ? 200 : (percent < 90 ? 300 : 150));
        const percentChanged = percent !== state.lastPercent;
        
        if (force || percentChanged || (now - state.lastUpdateTime) >= minInterval) {
            state.lastPercent = percent;
            state.lastUpdateTime = now;
            
            this.broadcastSSE({ 
                type: 'progress', 
                percent: percent,
                title: `Generating... ${percent}% - YandBox`
            });
        }
    }

    _resetProgress() {
        this._progressState = {
            lastPercent: 0,
            lastUpdateTime: 0,
            isActive: false
        };
    }

    getLoadingTemplate(progressPercent = 0) {
        return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Generating... ${progressPercent}% - YandBox</title>
<style>
  body { font-family: -apple-system, sans-serif; background: #1e1e1e; color: #ccc; display: flex; align-items: center; justify-content: center; height: 100vh; margin:0; }
  .container { text-align: center; max-width: 400px; width: 90%; }
  .progress-bar { width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden; margin: 20px 0; }
  .progress-fill { height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, #0af, #0ff); transition: width 0.2s ease; }
  .actions { display: flex; gap: 10px; justify-content: center; margin-top: 15px; flex-wrap: wrap; }
  button, select { background: #2a2a2a; border: 1px solid #444; color: #ddd; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px; }
  button:hover { background: #3a3a3a; }
  select { min-width: 200px; }
  .status { font-size: 13px; color: #aaa; margin-top: 8px; min-height: 20px; }
  .mode-toggle { margin-top: 10px; }
  .mode-btn { font-size: 12px; padding: 4px 8px; }
  .mode-btn.active { background: #0af; color: #000; }
</style>
</head>
<body>
<div class="container">
  <h2>⚡ Generating new page...</h2>
  <div class="progress-bar"><div class="progress-fill" id="fill"></div></div>
  <div class="status" id="status">Initializing...</div>
  <div class="actions">
    <button id="cancelBtn">✕ Cancel</button>
    <select id="versionSelect"><option value="">← Previous versions</option></select>
  </div>
  <div class="mode-toggle">
    <button class="mode-btn" data-mode="vanilla">🍦 Vanilla</button>
    <button class="mode-btn active" data-mode="balanced">⚖️ Balanced</button>
    <button class="mode-btn" data-mode="external">🌐 External</button>
  </div>
</div>
<script>
  (function() {
    const fill = document.getElementById('fill');
    const status = document.getElementById('status');
    const cancelBtn = document.getElementById('cancelBtn');
    const versionSelect = document.getElementById('versionSelect');
    const modeBtns = document.querySelectorAll('.mode-btn');
    let eventSource = null;
    let progressReceived = false;
    let currentMode = 'balanced';
    
    fetch('/api/mode')
      .then(r => r.json())
      .then(data => {
        currentMode = data.mode || 'balanced';
        updateModeButtons();
      })
      .catch(() => {});
    
    function updateModeButtons() {
      modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === currentMode);
      });
    }
    
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        fetch('/api/mode', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ mode })
        }).then(r => r.json()).then(data => {
          currentMode = data.mode;
          updateModeButtons();
        }).catch(() => {});
      });
    });
    
    fetch('/api/versions')
      .then(r => r.json())
      .then(versions => {
        versions.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.index;
          opt.textContent = v.timestamp + ' – ' + v.request;
          versionSelect.appendChild(opt);
        });
      })
      .catch(() => {});
    
    versionSelect.addEventListener('change', () => {
      if (versionSelect.value === '') return;
      cleanupSSE();
      fetch('/api/revert', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ index: parseInt(versionSelect.value) })
      }).catch(() => {});
    });
    
    cancelBtn.addEventListener('click', () => {
      cleanupSSE();
      fetch('/cancel-generation', { method: 'POST' }).catch(() => {});
    });
    
    function cleanupSSE() {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    }
    
    function connectSSE() {
      cleanupSSE();
      
      eventSource = new EventSource('/events');
      
      eventSource.addEventListener('message', (e) => {
        try {
          const data = JSON.parse(e.data);
          
          if (data.type === 'progress') {
            const p = data.percent || 0;
            fill.style.width = p + '%';
            status.textContent = p + '% Complete';
            if (data.title) {
              document.title = data.title;
            }
            progressReceived = true;
          } else if (data.type === 'connected') {
            if (!progressReceived) {
              status.textContent = 'Connected...';
            }
          } else if (data.type === 'update-html') {
            cleanupSSE();
          }
        } catch(ex) {
          console.error('SSE parse error:', ex);
        }
      });
      
      eventSource.addEventListener('error', () => {
        status.textContent = 'Connection lost, reconnecting...';
        setTimeout(() => {
          if (eventSource) {
            connectSSE();
          }
        }, 1000);
      });
    }
    
    connectSSE();
    
    window.addEventListener('beforeunload', () => {
      cleanupSSE();
    });
  })();
</script>
</body>
</html>`;
    }

    abortGeneration() {
        const gen = this.currentGeneration;
        if (!gen) return;
        
        if (gen.abortController) {
            gen.abortController.abort();
        }
        
        if (gen.chatRes && !gen.chatRes.writableEnded) {
            gen.chatRes.write(`data: ${JSON.stringify({ type: 'token', token: '❌ Canceled.' })}\n\n`);
            gen.chatRes.write('data: {"type":"end"}\n\n');
            gen.chatRes.end();
        }
        
        if (this._originalFetch) {
            globalThis.fetch = this._originalFetch;
            this._originalFetch = null;
        }
        
        this._resetProgress();
        this.currentGeneration = null;
        this._clearGenerationState();
    }

    cancelGeneration() {
        const gen = this.currentGeneration;
        if (!gen) return;
        
        const backupHtml = gen.backupHtml;
        this.abortGeneration();
        
        // Ensure we write valid HTML
        const safeHtml = this._ensureValidHtml(backupHtml);
        writeFileSync('./main.html', safeHtml, 'utf8');
        this.broadcastSSE({ type: 'update-html', html: safeHtml });
    }

    async revertToVersion(index) {
        if (index < 0 || index >= this.versions.length) {
            throw new Error('Invalid version index');
        }
        this.abortGeneration();
        
        const versionHtml = this.versions[index].html;
        const safeHtml = this._ensureValidHtml(versionHtml);
        writeFileSync('./main.html', safeHtml, 'utf8');
        this.broadcastSSE({ type: 'update-html', html: safeHtml });
    }

    // ============ HTML VALIDATION UTILITY ============
    
    _ensureValidHtml(html) {
        if (!html || typeof html !== 'string' || html.trim().length < 20) {
            return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YandBox</title><style>body{font-family:-apple-system,sans-serif;padding:2rem;background:#1e1e1e;color:#ccc}</style></head><body><h1>Page Reset</h1><p>The previous page was empty or invalid. Use the chat to generate a new page.</p></body></html>';
        }
        
        let cleaned = html.trim();
        
        // Remove markdown code fences
        cleaned = cleaned.replace(/^```html\s*\n?/i, '');
        cleaned = cleaned.replace(/\n?```\s*$/i, '');
        cleaned = cleaned.replace(/^```\s*\n?/i, '');
        cleaned = cleaned.replace(/\n?```\s*$/i, '');
        cleaned = cleaned.trim();
        
        // If after cleaning it's too short or doesn't look like HTML
        if (cleaned.length < 50 || (!cleaned.toLowerCase().includes('<!doctype') && !cleaned.toLowerCase().includes('<html'))) {
            return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YandBox</title><style>body{font-family:-apple-system,sans-serif;padding:2rem;background:#1e1e1e;color:#ccc}</style></head><body><h1>Generation Failed</h1><p>The AI generated invalid content. Please try again with a more specific request.</p></body></html>';
        }
        
        // Ensure it has basic HTML structure
        if (!cleaned.toLowerCase().includes('<!doctype')) {
            cleaned = '<!DOCTYPE html>\n' + cleaned;
        }
        
        // Ensure scrolling CSS is present
        if (!cleaned.includes('overflow-y') && !cleaned.includes('overflow-y:')) {
            const scrollCSS = '<style>html{overflow-y:auto!important;height:auto!important}body{overflow-y:auto!important;min-height:100vh!important;padding-bottom:2rem}</style>';
            if (cleaned.includes('</head>')) {
                cleaned = cleaned.replace('</head>', scrollCSS + '</head>');
            } else if (cleaned.includes('<head>')) {
                cleaned = cleaned.replace('<head>', '<head>' + scrollCSS);
            }
        }
        
        return cleaned;
    }

    // ============ GENERATION STATE MANAGEMENT ============
    
    _saveGenerationState(message, currentHtml) {
        try {
            const state = {
                message: message,
                currentHtml: currentHtml,
                timestamp: Date.now()
            };
            writeFileSync(this.generationStatePath, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Failed to save generation state:', error);
        }
    }

    _clearGenerationState() {
        try {
            if (existsSync(this.generationStatePath)) {
                unlinkSync(this.generationStatePath);
            }
        } catch (error) {
            // Silently ignore cleanup errors
        }
    }

    _clearStaleGenerationState() {
        // On startup, clear any stale generation state to prevent recovery of old interrupted generations
        if (existsSync(this.generationStatePath)) {
            try {
                unlinkSync(this.generationStatePath);
                console.log('Cleared stale generation state from previous session');
                
                // Also restore main.html if it's a loading template
                if (existsSync('./main.html')) {
                    const mainHtml = readFileSync('./main.html', 'utf8');
                    if (mainHtml.includes('Generating...') && mainHtml.includes('YandBox')) {
                        // It's a loading template, restore to a clean state
                        const cleanHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YandBox</title><style>body{font-family:-apple-system,sans-serif;padding:2rem;background:#1e1e1e;color:#ccc}</style></head><body><h1>YandBox Ready</h1><p>Use the chat to generate a new page.</p></body></html>';
                        writeFileSync('./main.html', cleanHtml, 'utf8');
                        console.log('Restored main.html from interrupted generation');
                    }
                }
            } catch (error) {
                console.error('Failed to clear stale generation state:', error);
            }
        }
        
        // Ensure main.html exists and is valid
        try {
            if (!existsSync('./main.html')) {
                const cleanHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YandBox</title><style>body{font-family:-apple-system,sans-serif;padding:2rem;background:#1e1e1e;color:#ccc}</style></head><body><h1>YandBox Ready</h1><p>Use the chat to generate a new page.</p></body></html>';
                writeFileSync('./main.html', cleanHtml, 'utf8');
            } else {
                const mainHtml = readFileSync('./main.html', 'utf8');
                if (!mainHtml || mainHtml.trim().length < 20) {
                    const cleanHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YandBox</title><style>body{font-family:-apple-system,sans-serif;padding:2rem;background:#1e1e1e;color:#ccc}</style></head><body><h1>YandBox Ready</h1><p>Use the chat to generate a new page.</p></body></html>';
                    writeFileSync('./main.html', cleanHtml, 'utf8');
                }
            }
        } catch (error) {
            console.error('Failed to ensure main.html exists:', error);
        }
    }

    // ============ MAIN GENERATION METHOD ============

    async startGeneration(message, chatRes, isRecovery = false) {
        // Validate input message
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            console.error('Invalid generation message');
            if (chatRes && !chatRes.writableEnded) {
                chatRes.write(`data: ${JSON.stringify({ type: 'token', token: '❌ Error: Invalid request message' })}\n\n`);
                chatRes.write('data: {"type":"end"}\n\n');
                chatRes.end();
            }
            return;
        }
        
        // Read current HTML with validation
        let currentHtml;
        try {
            currentHtml = readFileSync('./main.html', 'utf8');
            currentHtml = this._ensureValidHtml(currentHtml);
            // Write back the validated HTML
            writeFileSync('./main.html', currentHtml, 'utf8');
        } catch (error) {
            currentHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YandBox</title><style>body{font-family:-apple-system,sans-serif;padding:2rem;background:#1e1e1e;color:#ccc}</style></head><body><h1>YandBox Ready</h1><p>Use the chat to generate a new page.</p></body></html>';
            writeFileSync('./main.html', currentHtml, 'utf8');
        }
        
        // Save state for crash recovery
        if (!isRecovery) {
            this._saveGenerationState(message, currentHtml);
        }
        
        const estimatedOutputLength = Math.max(currentHtml.length * 1.5, 800);
    
        const abortController = new AbortController();
        this.currentGeneration = {
            abortController,
            backupHtml: currentHtml,
            chatRes,
            message
        };
    
        this._resetProgress();
        this._progressState.isActive = true;
    
        const loadingHtml = this.getLoadingTemplate(0);
        this.broadcastSSE({ type: 'update-html', html: loadingHtml });
        
        this._sendProgress(0, true);
    
        const originalFetch = globalThis.fetch;
        this._originalFetch = originalFetch;
        globalThis.fetch = (url, options) => {
            options = options || {};
            options.signal = abortController.signal;
            return originalFetch(url, options);
        };
    
        // Generation variables
        const MAX_RETRIES = 3;
        let attempt = 0;
        let lastError = null;
        let finalHtml = '';
        let success = false;
        let successfulResult = null;
        let tokenCount = 0;
    
        while (attempt < MAX_RETRIES && !success) {
            attempt++;
            
            if (attempt > 1) {
                console.log(`Retry attempt ${attempt}/${MAX_RETRIES}...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            let generatedBuffer = '';
            tokenCount = 0;
            const generationStartTime = Date.now();
            
            const htmlStructure = { tags: 0, closingTags: 0 };
    
            try {
                const modeConstraints = this._getGenerationModeConstraints();
                const domainRestrictions = this._getDomainRestrictions();
                const refinerPrompt = await this.pageRefiner.GetPrompt({ 
                    mode: this.generationMode,
                    domains: this.allowedDomains 
                });
                const chatHistoryContext = this._getChatHistoryContext();
                
                const systemPrompt = `You are an expert web developer. The user wants to modify the HTML page. Provide the complete new HTML code.
    
    CRITICAL SCROLLING REQUIREMENT - READ THIS FIRST:
    ⚠️ THE PAGE MUST BE SCROLLABLE WITH MOUSE WHEEL AND SCROLLBAR ⚠️
    - Set html { overflow-y: auto !important; height: auto !important; }
    - Set body { overflow-y: auto !important; min-height: 100vh !important; }
    - NEVER use "overflow: hidden" on html or body
    - NEVER set "height: 100vh" with "overflow: hidden" on the body
    - Ensure content is longer than viewport to enable natural scrolling
    - Add padding-bottom: 2rem or more to body to ensure scrollability
    
    ${modeConstraints}
    ${domainRestrictions}
    
    DESIGN AND LOGICAL INSTRUCT REFINEMENTS:
    ${refinerPrompt}
    ${chatHistoryContext}
    Output ONLY the raw HTML without markdown fences or explanations. Ensure the HTML is valid, complete with DOCTYPE, and includes all necessary tags.`;
    
                const userPrompt = `Current HTML:\n${currentHtml}\n\nUser request: ${message}\n\nREMEMBER: The page must be scrollable. DO NOT lock scrolling. Include overflow-y: auto on html/body. Provide complete new HTML:`;
                
                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ];
    
                const chatConfig = {
                    stream: true,
                    tokenCallback: (data) => {
                        let token = null;
                        
                        if (data.stream?.content) {
                            token = data.stream.content;
                        } else if (data.content) {
                            token = data.content;
                        } else if (data.choices?.[0]?.delta?.content) {
                            token = data.choices[0].delta.content;
                        } else if (data.choices?.[0]?.text) {
                            token = data.choices[0].text;
                        } else if (typeof data === 'string') {
                            token = data;
                        }
                        
                        if (token) {
                            generatedBuffer += token;
                            tokenCount++;
                            
                            if (token.includes('<') && !token.includes('</')) htmlStructure.tags++;
                            if (token.includes('</')) htmlStructure.closingTags++;
                            if (token.includes('/>')) {
                                htmlStructure.tags++;
                                htmlStructure.closingTags++;
                            }
                            
                            const elapsedSeconds = (Date.now() - generationStartTime) / 1000;
                            const percent = this._calculateProgress(
                                generatedBuffer.length, 
                                estimatedOutputLength, 
                                htmlStructure, 
                                elapsedSeconds,
                                tokenCount
                            );
                            
                            this._sendProgress(percent);
                        }
                    }
                };
    
                if (this.provider === 'deepseek') {
                    chatConfig.deepseek = true;
                } else if (this.provider === 'deepinfra') {
                    chatConfig.deepinfra = true;
                }
    
                const result = await this.AI.Chat(messages, chatConfig);
    
                // Extract generated content
                if (!generatedBuffer && result) {
                    if (result.full_text) {
                        generatedBuffer = result.full_text;
                    } else if (result.choices?.[0]?.message?.content) {
                        generatedBuffer = result.choices[0].message.content;
                    } else if (typeof result === 'string') {
                        generatedBuffer = result;
                    }
                } else if (result && result.full_text && result.full_text.length > generatedBuffer.length) {
                    generatedBuffer = result.full_text;
                }
    
                this._sendProgress(100, true);
                this.broadcastSSE({ 
                    type: 'progress', 
                    percent: 100,
                    title: '✓ Complete - YandBox'
                });
                
                await new Promise(resolve => setTimeout(resolve, 150));
    
                // Validate and clean the generated HTML
                finalHtml = this._ensureValidHtml(generatedBuffer);
                
                // Double check - if ensureValidHtml returned the error template
                if (finalHtml.includes('Generation Failed') || finalHtml.includes('invalid content')) {
                    throw new Error('Generated content failed validation');
                }
    
                success = true;
                successfulResult = result;
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    lastError = error;
                    break;
                }
                
                lastError = error;
                console.error(`Generation attempt ${attempt} failed:`, error.message);
                
                if (attempt >= MAX_RETRIES) {
                    break;
                }
            }
        }
    
        // Handle final result
        if (success && finalHtml) {
            // Atomic write - ensure we never write empty content
            try {
                // Verify HTML is valid before writing
                const validatedHtml = this._ensureValidHtml(finalHtml);
                if (validatedHtml.includes('Generation Failed')) {
                    throw new Error('Final HTML failed validation');
                }
                
                // Write to a temp file first, then rename for atomicity
                writeFileSync('./main.html.tmp', validatedHtml, 'utf8');
                writeFileSync('./main.html', validatedHtml, 'utf8');
                
                // Clean up temp file
                try { unlinkSync('./main.html.tmp'); } catch (e) {}
                
                // Verify the write was successful
                const writtenHtml = readFileSync('./main.html', 'utf8');
                if (!writtenHtml || writtenHtml.trim().length < 50) {
                    throw new Error('Written HTML is empty or too short');
                }
                
                finalHtml = validatedHtml;
            } catch (writeError) {
                console.error('Failed to write final HTML:', writeError);
                // Restore backup
                writeFileSync('./main.html', currentHtml, 'utf8');
                finalHtml = currentHtml;
                
                if (chatRes && !chatRes.writableEnded) {
                    chatRes.write(`data: ${JSON.stringify({ type: 'token', token: '❌ Error: Failed to save generated page' })}\n\n`);
                    chatRes.write('data: {"type":"end"}\n\n');
                    chatRes.end();
                }
                
                // Cleanup and return
                globalThis.fetch = this._originalFetch;
                this._originalFetch = null;
                this.currentGeneration = null;
                this._resetProgress();
                this._clearGenerationState();
                return;
            }
    
            // Add to chat history
            this.addToChatHistory(message, currentHtml, finalHtml);
    
            // Save version
            this.versions.push({
                timestamp: new Date().toLocaleString(),
                request: message,
                html: finalHtml
            });
            this.saveVersions();
    
            // Broadcast final HTML to all connected clients
            this.broadcastSSE({ type: 'update-html', html: finalHtml });
    
            // Send completion message to chat
            if (chatRes && !chatRes.writableEnded) {
                chatRes.write(`data: ${JSON.stringify({ type: 'token', token: '✅ Page updated successfully!' })}\n\n`);
                chatRes.write('data: {"type":"end"}\n\n');
                chatRes.end();
            }
    
            this.requestCount++;
            
            // Track costs
            if (successfulResult && successfulResult.metadata?.usage) {
                const usage = successfulResult.metadata.usage;
                const tokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
                let cost = 0;
                
                if (usage.estimated_cost !== undefined && usage.estimated_cost !== null) {
                    cost = usage.estimated_cost;
                } else if (this.provider === 'deepseek' && this.AI.DeepSeek) {
                    cost = this.AI.DeepSeek._calculateCost(this.model, usage);
                } else if (this.provider === 'deepinfra' && this.AI.DeepInfra) {
                    cost = this.AI.DeepInfra._calculateCost(this.model, usage);
                }
                
                if (tokens > 0 || cost > 0) {
                    this.sessionCost += cost;
                    this.totalCost += cost;
                    this.requests.push({
                        model: successfulResult.metadata.model || this.model || this.provider,
                        cost,
                        tokens,
                        time: new Date().toLocaleTimeString()
                    });
                }
            } else if (this.provider === 'local') {
                this.requests.push({
                    model: this.model || 'local-model',
                    cost: 0,
                    tokens: tokenCount,
                    time: new Date().toLocaleTimeString()
                });
            }
            
            this.saveConfig();
            
        } else {
            // All attempts failed
            console.error('All generation attempts failed.');
            
            // Restore backup HTML - ensure it's valid
            const safeBackup = this._ensureValidHtml(currentHtml);
            writeFileSync('./main.html', safeBackup, 'utf8');
            this.broadcastSSE({ type: 'update-html', html: safeBackup });
            
            // Send error message to chat
            if (chatRes && !chatRes.writableEnded) {
                chatRes.write(`data: ${JSON.stringify({ type: 'token', token: '❌ Error: ' + (lastError?.message || 'Generation failed after ' + MAX_RETRIES + ' attempts') })}\n\n`);
                chatRes.write('data: {"type":"end"}\n\n');
                chatRes.end();
            }
        }
    
        // Cleanup
        globalThis.fetch = this._originalFetch;
        this._originalFetch = null;
        this.currentGeneration = null;
        this._resetProgress();
        this._clearGenerationState();
    }

    async handleChatMessage(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { message } = JSON.parse(body);
                
                if (!message || typeof message !== 'string' || message.trim().length === 0) {
                    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                    res.write(`data: ${JSON.stringify({ type: 'token', token: '❌ Please enter a valid message.' })}\n\n`);
                    res.write('data: {"type":"end"}\n\n');
                    res.end();
                    return;
                }
                
                if (!this.AI) {
                    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                    res.write('data: {"type":"token","token":"No AI provider configured. Please run: node YandBox.js keys"}\n\n');
                    res.write('data: {"type":"end"}\n\n');
                    res.end();
                    return;
                }

                if (this.currentGeneration) {
                    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                    res.write(`data: ${JSON.stringify({ type: 'token', token: '⏳ A generation is already in progress. Please wait or cancel it.' })}\n\n`);
                    res.write('data: {"type":"end"}\n\n');
                    res.end();
                    return;
                }
                
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });

                res.write(`data: ${JSON.stringify({ type: 'token', token: '🔄 Generating new page...' })}\n\n`);
                
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

// ---------- CLI helpers ----------
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
    if (provider === 'local') return [];
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
    if (provider === 'local') {
        const modelInput = await question('\n\x1b[36mModel name (optional, Enter to skip):\x1b[0m \x1b[90m> \x1b[0m');
        return modelInput.trim() || null;
    }
    
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
    let saved = existsSync(tokenPath) ? JSON.parse(readFileSync(tokenPath, 'utf8')) : {};
    
    if (!saved.configs && saved.keys) {
        saved.configs = {};
        for (const name in saved.keys) {
            const entry = saved.keys[name];
            saved.configs[name] = {
                provider: entry.provider || (entry.token && entry.token.startsWith('sk-') ? 'deepseek' : 'deepinfra'),
                token: entry.token || null,
                model: entry.model || null,
                serverUrl: null,
                serverPort: null,
                serverToken: null
            };
        }
        delete saved.keys;
        saved.activeConfig = saved.activeConfig || Object.keys(saved.configs)[0] || null;
        writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
    }
    
    const configs = saved.configs || {};
    const activeConfig = saved.activeConfig || null;
    
    console.clear();
    const w = 50;
    const top = '\x1b[36m╔' + '═'.repeat(w - 2) + '╗\x1b[0m';
    const mid = '\x1b[36m╠' + '═'.repeat(w - 2) + '╣\x1b[0m';
    const bot = '\x1b[36m╚' + '═'.repeat(w - 2) + '╝\x1b[0m';
    
    console.log(top);
    console.log('\x1b[36m║\x1b[0m' + '  \x1b[1mConfiguration Manager\x1b[0m' + ' '.repeat(w - 25) + '\x1b[36m║\x1b[0m');
    console.log(mid);
    
    const configNames = Object.keys(configs);
    if (configNames.length > 0) {
        configNames.forEach((name) => {
            const cfg = configs[name];
            const isActive = name === activeConfig;
            const prefix = isActive ? '\x1b[32m*\x1b[0m' : ' ';
            
            let providerStr = cfg.provider.toUpperCase();
            let detailStr = '';
            
            if (cfg.provider === 'local') {
                const urlStr = cfg.serverUrl ? `${cfg.serverUrl}:${cfg.serverPort || 4000}` : 'localhost:4000';
                detailStr = `\x1b[90m${urlStr}\x1b[0m`;
            } else if (cfg.token) {
                const masked = cfg.token.substring(0, 8) + '...' + cfg.token.substring(cfg.token.length - 4);
                detailStr = `\x1b[90m${masked}\x1b[0m`;
            }
            
            const modelStr = (cfg.model || 'default').substring(0, 20);
            const line = ` ${prefix} ${name.padEnd(10)} ${providerStr.padEnd(10)} ${modelStr}`;
            const cleanLine = line.replace(/\x1b\[\d+m/g, '');
            console.log('\x1b[36m║\x1b[0m' + line + ' '.repeat(Math.max(0, w - cleanLine.length - 2)) + '\x1b[36m║\x1b[0m');
            
            if (detailStr) {
                const cleanDetail = detailStr.replace(/\x1b\[\d+m/g, '');
                console.log('\x1b[36m║\x1b[0m   ' + detailStr + ' '.repeat(Math.max(0, w - cleanDetail.length - 5)) + '\x1b[36m║\x1b[0m');
            }
        });
    } else {
        console.log('\x1b[36m║\x1b[0m  No configurations saved...' + ' '.repeat(w - 27) + '\x1b[36m║\x1b[0m');
    }
    
    console.log(mid);
    console.log('\x1b[36m║\x1b[0m  \x1b[33ma\x1b[0m - Add    \x1b[33ms\x1b[0m - Select    \x1b[33mm\x1b[0m - Model    \x1b[33md\x1b[0m - Del    \x1b[33mq\x1b[0m - Quit\x1b[36m║\x1b[0m');
    console.log(bot);
    
    const action = await question('\n\x1b[36mAction:\x1b[0m \x1b[90m> \x1b[0m');
    
    if (action === 'a') {
        console.log('\n\x1b[36mSelect provider type:\x1b[0m');
        console.log('  \x1b[33m1\x1b[0m. DeepSeek (cloud API)');
        console.log('  \x1b[33m2\x1b[0m. DeepInfra (cloud API)');
        console.log('  \x1b[33m3\x1b[0m. EasyAI Server (local/remote)');
        
        const provChoice = await question('\n\x1b[90m> \x1b[0m');
        
        let provider, token = null, model = null, serverUrl = null, serverPort = null, serverToken = null;
        
        if (provChoice === '1') {
            provider = 'deepseek';
            console.log('\n\x1b[36mPaste DeepSeek API token:\x1b[0m');
            console.log('\x1b[90m(Starts with sk-...)\x1b[0m');
            token = (await question('\x1b[90m> \x1b[0m')).trim();
            if (!token) return false;
            model = await selectModel('deepseek');
            
        } else if (provChoice === '2') {
            provider = 'deepinfra';
            console.log('\n\x1b[36mPaste DeepInfra API token:\x1b[0m');
            token = (await question('\x1b[90m> \x1b[0m')).trim();
            if (!token) return false;
            model = await selectModel('deepinfra');
            
        } else if (provChoice === '3') {
            provider = 'local';
            console.log('\n\x1b[36mEnter EasyAI server URL:\x1b[0m');
            console.log('\x1b[90mExamples: localhost, http://192.168.1.100\x1b[0m');
            serverUrl = (await question('\x1b[90m> \x1b[0m')).trim();
            if (!serverUrl) serverUrl = 'localhost';
            
            console.log('\n\x1b[36mPort (Enter for default 4000):\x1b[0m');
            const portStr = (await question('\x1b[90m> \x1b[0m')).trim();
            serverPort = portStr ? parseInt(portStr) : 4000;
            
            console.log('\n\x1b[36mServer token (Enter to skip if no auth):\x1b[0m');
            serverToken = (await question('\x1b[90m> \x1b[0m')).trim() || null;
            
            model = await selectModel('local');
            
        } else {
            return false;
        }
        
        const name = await question('\n\x1b[36mConfiguration name (Enter for default):\x1b[0m \x1b[90m> \x1b[0m');
        const configName = name.trim() || 'default';
        
        configs[configName] = { provider, token, model, serverUrl, serverPort, serverToken };
        saved.configs = configs;
        if (!saved.activeConfig) saved.activeConfig = configName;
        
        writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
        console.log('\n\x1b[32m✓ Configuration added!\x1b[0m');
        return true;
        
    } else if (action === 's' && configNames.length > 0) {
        console.log('\n\x1b[36mAvailable configurations:\x1b[0m');
        configNames.forEach(name => {
            const marker = name === activeConfig ? '\x1b[32m* \x1b[0m' : '  ';
            console.log(`${marker}${name}`);
        });
        
        const name = await question('\n\x1b[36mConfiguration name to activate:\x1b[0m \x1b[90m> \x1b[0m');
        if (configs[name.trim()]) {
            saved.activeConfig = name.trim();
            writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
            console.log('\n\x1b[32m✓ Active configuration: ' + name.trim() + '\x1b[0m');
        } else {
            console.log('\n\x1b[31m✗ Configuration not found\x1b[0m');
        }
        return true;
        
    } else if (action === 'm' && configNames.length > 0) {
        const targetName = activeConfig || configNames[0];
        const cfg = configs[targetName];
        if (!cfg) return true;
        
        console.log(`\n\x1b[36mChanging model for: \x1b[33m${targetName}\x1b[0m`);
        const newModel = await selectModel(cfg.provider);
        cfg.model = newModel || null;
        saved.configs = configs;
        writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
        console.log('\n\x1b[32m✓ Model updated!\x1b[0m');
        return true;
        
    } else if (action === 'd' && configNames.length > 0) {
        const name = await question('\n\x1b[36mConfiguration name to delete:\x1b[0m \x1b[90m> \x1b[0m');
        if (configs[name.trim()]) {
            delete configs[name.trim()];
            saved.configs = configs;
            if (saved.activeConfig === name.trim()) saved.activeConfig = Object.keys(configs)[0] || null;
            writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
            console.log('\n\x1b[32m✓ Configuration deleted!\x1b[0m');
        } else {
            console.log('\n\x1b[31m✗ Configuration not found\x1b[0m');
        }
        return true;
    }
    
    return false;
}

async function parseArgs() {
    const args = process.argv.slice(2);
    const config = {};
    const tokenPath = path.join(process.cwd(), 'yandbox-config.json');
    let saved = existsSync(tokenPath) ? JSON.parse(readFileSync(tokenPath, 'utf8')) : {};
    
    if (!saved.configs && saved.keys) {
        saved.configs = {};
        for (const name in saved.keys) {
            const entry = saved.keys[name];
            saved.configs[name] = {
                provider: entry.provider || (entry.token && entry.token.startsWith('sk-') ? 'deepseek' : 'deepinfra'),
                token: entry.token || null,
                model: entry.model || null,
                serverUrl: null,
                serverPort: null,
                serverToken: null
            };
        }
        delete saved.keys;
        saved.activeConfig = saved.activeConfig || Object.keys(saved.configs)[0] || null;
        writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
    }
    
    if (args.includes('new')) {
        console.log('\x1b[33m🆕 Starting fresh with new HTML pages...\x1b[0m\n');
        
        // Clear generation state
        const genStatePath = path.join(process.cwd(), 'yandbox-generation-state.json');
        if (existsSync(genStatePath)) {
            try { unlinkSync(genStatePath); console.log('\x1b[32m  ✓ Cleared generation state\x1b[0m'); } catch (err) {}
        }
        
        const htmlFiles = ['index.html', 'chat.html', 'main.html'];
        let removed = 0;
        
        for (const file of htmlFiles) {
            const filePath = path.join(process.cwd(), file);
            if (existsSync(filePath)) {
                try {
                    unlinkSync(filePath);
                    console.log(`\x1b[32m  ✓ Removed ${file}\x1b[0m`);
                    removed++;
                } catch (err) {
                    console.log(`\x1b[31m  ✗ Failed to remove ${file}: ${err.message}\x1b[0m`);
                }
            }
        }
        
        console.log(`\n\x1b[36m✓ Cleaned ${removed} HTML file(s). Run "node YandBox.js" to start fresh.\x1b[0m\n`);
        process.exit(0);
    }
    
    if (args.includes('reset')) {
        console.log('\x1b[33m🔄 Resetting YandBox...\x1b[0m\n');
        
        // Clear generation state first
        const genStatePath = path.join(process.cwd(), 'yandbox-generation-state.json');
        if (existsSync(genStatePath)) {
            try { unlinkSync(genStatePath); console.log('\x1b[32m  ✓ Cleared generation state\x1b[0m'); } catch (err) {}
        }
        
        const filesToRemove = ['index.html', 'chat.html', 'main.html'];
        const jsonFiles = ['yandbox-config.json', 'yandbox-log.json', 'yandbox-versions.json', 'yandbox-chat-history.json'];
        let removed = 0;
        
        for (const file of [...filesToRemove, ...jsonFiles]) {
            const filePath = path.join(process.cwd(), file);
            if (existsSync(filePath)) {
                try {
                    unlinkSync(filePath);
                    console.log(`\x1b[32m  ✓ Removed ${file}\x1b[0m`);
                    removed++;
                } catch (err) {
                    console.log(`\x1b[31m  ✗ Failed to remove ${file}: ${err.message}\x1b[0m`);
                }
            }
        }
        
        console.log(`\n\x1b[36m✓ Reset complete! Run "node YandBox.js" to start fresh.\x1b[0m\n`);
        process.exit(0);
    }
    
    if (args.includes('keys') || args.includes('models')) {
        await manageKeys();
        saved = existsSync(tokenPath) ? JSON.parse(readFileSync(tokenPath, 'utf8')) : {};
        if (saved.activeConfig && saved.configs?.[saved.activeConfig]) return config;
        process.exit(0);
    }
    
    if (args.includes('--clear')) {
        writeFileSync(tokenPath, JSON.stringify({ 
            configs: saved.configs || {}, 
            activeConfig: saved.activeConfig || null,
            totalCost: saved.totalCost || 0,
            generationMode: saved.generationMode || 'balanced',
            allowedDomains: saved.allowedDomains || []
        }, null, 2));
        console.log('\x1b[32m✓ Logs cleared (configurations preserved)\x1b[0m');
        process.exit(0);
    }

    for (const arg of args) {
        if (arg.startsWith('--port=')) config.port = parseInt(arg.split('=')[1]);
        if (arg.startsWith('--mode=')) {
            const mode = arg.split('=')[1];
            if (['vanilla', 'balanced', 'external'].includes(mode)) {
                saved.generationMode = mode;
                writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
                console.log(`\n\x1b[32m✓ Generation mode set to: ${mode}\x1b[0m\n`);
            }
        }
    }

    for (const arg of args) {
        if (!arg.startsWith('--')) {
            const configs = saved.configs || {};
            
            if (configs[arg]) {
                saved.activeConfig = arg;
                writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
                console.log(`\n\x1b[32m✓ Activated configuration: ${arg}\x1b[0m\n`);
                return config;
            }
            
            const provider = arg.startsWith('sk-') ? 'deepseek' : 'deepinfra';
            const defaultModel = provider === 'deepseek' ? 'deepseek-v4-flash' : 'meta-llama/Meta-Llama-3.1-8B-Instruct';
            
            configs['default'] = { provider, token: arg, model: defaultModel, serverUrl: null, serverPort: null, serverToken: null };
            saved.configs = configs;
            saved.activeConfig = 'default';
            writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
            
            console.log('\n\x1b[32m✓ ' + provider.toUpperCase() + ' token saved!\x1b[0m\n');
            return config;
        }
    }

    if (!saved.activeConfig || !saved.configs?.[saved.activeConfig]) {
        console.log('\x1b[33mNo API configuration found.\x1b[0m\n');
        console.log('\x1b[36mChoose provider type:\x1b[0m');
        console.log('  \x1b[33m1\x1b[0m. DeepSeek (cloud API)');
        console.log('  \x1b[33m2\x1b[0m. DeepInfra (cloud API)');
        console.log('  \x1b[33m3\x1b[0m. EasyAI Server (local/remote)');
        
        const choice = await question('\n\x1b[90m> \x1b[0m');
        
        let provider, token = null, model = null, serverUrl = null, serverPort = null, serverToken = null;
        
        if (choice === '1') {
            provider = 'deepseek';
            console.log('\n\x1b[36mPaste DeepSeek API token:\x1b[0m');
            token = (await question('\x1b[90m> \x1b[0m')).trim();
            if (!token) { console.log('\x1b[31mNo token provided. Exiting.\x1b[0m'); process.exit(0); }
            model = 'deepseek-v4-flash';
        } else if (choice === '2') {
            provider = 'deepinfra';
            console.log('\n\x1b[36mPaste DeepInfra API token:\x1b[0m');
            token = (await question('\x1b[90m> \x1b[0m')).trim();
            if (!token) { console.log('\x1b[31mNo token provided. Exiting.\x1b[0m'); process.exit(0); }
            model = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
        } else if (choice === '3') {
            provider = 'local';
            console.log('\n\x1b[36mEnter EasyAI server URL:\x1b[0m');
            serverUrl = (await question('\x1b[90m> \x1b[0m')).trim() || 'localhost';
            console.log('\n\x1b[36mPort (Enter for default 4000):\x1b[0m');
            const portStr = (await question('\x1b[90m> \x1b[0m')).trim();
            serverPort = portStr ? parseInt(portStr) : 4000;
            console.log('\n\x1b[36mServer token (Enter to skip):\x1b[0m');
            serverToken = (await question('\x1b[90m> \x1b[0m')).trim() || null;
            model = null;
        } else {
            console.log('\x1b[31mInvalid choice. Exiting.\x1b[0m');
            process.exit(0);
        }
        
        const configs = saved.configs || {};
        configs['default'] = { provider, token, model, serverUrl, serverPort, serverToken };
        saved.configs = configs;
        saved.activeConfig = 'default';
        writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
        console.log('\n\x1b[32m✓ Configuration saved! Starting server...\x1b[0m\n');
        return config;
    }

    return config;
}

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
    const config = await parseArgs();
    const yandbox = new YandBox(config);
}

export default YandBox;