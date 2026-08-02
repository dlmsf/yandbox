import http from 'http';
import { readFileSync, existsSync, copyFileSync, watch } from 'fs';
import path from 'path';
import { URL } from 'url';
import EasyAI from '/usr/local/etc/EasyAI/EasyAI.js';
import Chat from '/usr/local/etc/EasyAI/core/ChatModule/Chat.js';
import ChatPrompt from '/usr/local/etc/EasyAI/core/MenuCLI/Sandbox/ChatPrompt.js';

class YandBox {
    
    constructor(config = {}) {
        this.Chat = new Chat();
        this.port = config.port || 3000;
        this.easyai_url = config.easyai_url || ((config.openai_token) ? undefined : 'localhost');
        this.easyai_port = config.easyai_port || (this.easyai_url == 'localhost') ? 4000 : undefined;
        this.AI = new EasyAI({
            server_url: this.easyai_url,
            server_port: this.easyai_port,
            openai_token: config.openai_token,
            openai_model: config.openai_model
        });
        
        this.processInputFunction = async (input, displayToken) => {
            this.Chat.NewMessage('User: ', input);
            let historical_prompt = '';
            this.Chat.Historical.forEach(e => {
                historical_prompt = `${historical_prompt}${e.Sender}${e.Content} | `;
            });
            let result = await this.AI.Generate(`${ChatPrompt}${historical_prompt}AI:`, {
                tokenCallback: async (token) => { await displayToken(token.stream.content); },
                stop: ['|']
            });
            this.Chat.NewMessage('AI: ', result.full_text);
            return result;
        };
        
        // Store active SSE connections
        this.sseClients = new Set();
        
        this.ensureBaseFiles();
        this.initServer();
    }

    ensureBaseFiles() {
        const files = ['chat.html', 'main.html', 'index.html'];
        files.forEach(file => {
            const rootPath = path.join(process.cwd(), file);
            const corePath = path.join(process.cwd(), 'core', file);
            if (!existsSync(rootPath)) {
                copyFileSync(corePath, rootPath);
                console.log(`${file} copied to root directory.`);
            }
        });
    }

    initServer() {
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathname = url.pathname;
            
            // Handle CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            // SSE endpoint for real-time HTML updates
            if (pathname === '/events') {
                this.handleSSE(req, res);
                return;
            }

            // Chat message endpoint
            if (pathname === '/chat' && req.method === 'POST') {
                this.handleChatMessage(req, res);
                return;
            }

            // Serve static files
            if (pathname === '/') {
                const indexHtml = readFileSync('./index.html').toString();
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(indexHtml);
                return;
            } else {
                const filePath = path.join(process.cwd(), pathname);
                if (existsSync(filePath)) {
                    const fileContent = readFileSync(filePath).toString();
                    const contentType = pathname.endsWith('.html') ? 'text/html' : 'text/plain';
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(fileContent);
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            }
        });

        // Watch for main.html changes
        watch('./main.html', (eventType, filename) => {
            if (eventType === 'change') {
                const updatedHtml = readFileSync('./main.html', 'utf8');
                this.broadcastSSE({ type: 'update-html', html: updatedHtml });
            }
        });

        server.listen(this.port, () => console.log(`Server listening on port ${this.port}`));
    }

    handleSSE(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Send initial connection message
        res.write('data: {"type":"connected"}\n\n');

        // Add client to set
        this.sseClients.add(res);

        // Remove client on close
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
                
                // Set up SSE response for streaming tokens
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });

                await this.processInputFunction(message, async (responseToken) => {
                    res.write(`data: ${JSON.stringify({ type: 'token', token: responseToken })}\n\n`);
                });

                res.write('data: {"type":"end"}\n\n');
                res.end();
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
}

export default YandBox;

if (import.meta.url === `file://${process.argv[1]}`) {
    //console.log(process.argv[2])
    new YandBox();
  }