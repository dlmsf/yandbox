import http from 'http';
import { readFileSync, existsSync, writeFileSync, watch } from 'fs';
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
        this.easyai_port = config.easyai_port || ((this.easyai_url == 'localhost') ? 4000 : undefined);
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
        
        // Initialize asynchronously - ensure files exist before starting server
        this.ensureBaseFiles().then(() => {
            this.initServer();
        }).catch(err => {
            console.error('Failed to initialize YandBox:', err);
            process.exit(1);
        });
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
                        console.log(`Generated ${file} from ${jsPath}`);
                    } catch (err) {
                        console.error(`Failed to generate ${file} from ${jsPath}:`, err);
                        throw err;
                    }
                } else {
                    console.warn(`Source JS file ${jsPath} not found; cannot generate ${file}`);
                }
            }
        }
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

            // Serve static files from root
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

        // Watch for changes to main.html in the root directory
        try {
            watch('./main.html', (eventType, filename) => {
                if (eventType === 'change') {
                    try {
                        const updatedHtml = readFileSync('./main.html', 'utf8');
                        this.broadcastSSE({ type: 'update-html', html: updatedHtml });
                    } catch (err) {
                        console.error('Error reading main.html on change:', err);
                    }
                }
            });
        } catch (err) {
            console.error('Error setting up file watcher:', err);
        }

        server.listen(this.port, () => console.log(`YandBox server listening on port ${this.port}`));
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
                console.error('Error processing chat message:', error);
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

// Create and export the YandBox class
export default YandBox;

// Auto-instantiate if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const yandbox = new YandBox();
}