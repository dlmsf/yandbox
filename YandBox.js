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
        
        const saved = this.loadConfig();
        this.keys = saved.keys || {};
        this.activeKey = config.activeKey || saved.activeKey || null;
        this.model = config.model || saved.model || null;
        this.sessionCost = 0;
        this.totalCost = saved.totalCost || 0;
        this.requests = [];
        
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
            // Store reference to the underlying API instance from EasyAI
            this.DirectAPI = this.provider === 'deepseek' ? this.AI.DeepSeek : this.AI.DeepInfra;
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

    startHUD() {
        const updateHUD = () => {
            console.clear();
            const w = 50;
            const top = '╔' + '═'.repeat(w - 2) + '╗';
            const mid = '╠' + '═'.repeat(w - 2) + '╣';
            const bot = '╚' + '═'.repeat(w - 2) + '╝';
            
            console.log('\x1b[36m' + top + '\x1b[0m');
            console.log('\x1b[36m║\x1b[0m' + '  \x1b[1mYandBox AI Chat Server\x1b[0m' + ' '.repeat(w - 26) + '\x1b[36m║\x1b[0m');
            console.log('\x1b[36m' + mid + '\x1b[0m');
            
            const modelDisplay = (this.model || 'none').length > 30 ? (this.model || 'none').substring(0, 27) + '...' : (this.model || 'none');
            
            const lines = [
                ['Provider', '\x1b[33m' + (this.provider || 'none').toUpperCase() + '\x1b[0m'],
                ['Model', '\x1b[32m' + modelDisplay + '\x1b[0m'],
                ['Port', '\x1b[34m' + this.port + '\x1b[0m'],
                ['Requests', '\x1b[35m' + this.requestCount + '\x1b[0m'],
                ['Session Cost', '\x1b[31m$' + this.sessionCost.toFixed(8) + '\x1b[0m'],
                ['Total Cost', '\x1b[31m$' + this.totalCost.toFixed(8) + '\x1b[0m']
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

            if (pathname === '/events') {
                this.handleSSE(req, res);
                return;
            }

            if (pathname === '/chat' && req.method === 'POST') {
                this.handleChatMessage(req, res);
                return;
            }

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

        try {
            watch('./main.html', (eventType, filename) => {
                if (eventType === 'change') {
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

    async handleChatMessage(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { message } = JSON.parse(body);
                
                if (!this.DirectAPI) {
                    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                    res.write('data: {"type":"token","token":"No API token configured."}\n\n');
                    res.write('data: {"type":"end"}\n\n');
                    res.end();
                    return;
                }
                
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });

                let fullResponse = '';
                
                const messages = [{ role: 'user', content: message }];
                
                const result = await this.DirectAPI.Chat(messages, {
                    tokenCallback: async (data) => {
                        const token = data.stream?.content || data.content || '';
                        if (token) {
                            fullResponse += token;
                            res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
                        }
                    }
                });

                let cost = 0;
                let tokens = 0;
                
                if (result.metadata?.usage) {
                    const usage = result.metadata.usage;
                    tokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
                    
                    // DeepInfra provides estimated_cost directly
                    if (usage.estimated_cost) {
                        cost = usage.estimated_cost;
                    } 
                    // DeepSeek - use the class's _calculateCost method
                    else if (typeof this.DirectAPI._calculateCost === 'function') {
                        cost = this.DirectAPI._calculateCost(this.model, usage);
                    }
                }
                
                if (tokens > 0) {
                    this.requestCount++;
                    this.sessionCost += cost;
                    this.totalCost += cost;
                    
                    this.requests.push({
                        model: this.model || 'unknown',
                        cost: cost,
                        tokens: tokens,
                        time: new Date().toLocaleTimeString()
                    });
                    
                    this.saveConfig();
                }

                res.write('data: {"type":"end"}\n\n');
                res.end();
                
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

// CLI helpers
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

// Get models from EasyAI's internal classes
function getModels(provider) {
    // Create a dummy EasyAI instance to access the static Models
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