import http from 'http';
import WebSocket from './core/WebSocket.js';
import { readFileSync, existsSync, copyFileSync,watch } from 'fs';
import path from 'path';
import EasyAI from '@massudy/easyai';
import Chat from '@massudy/easyai/core/ChatModule/Chat.js';
import ChatPrompt from '@massudy/easyai/core/MenuCLI/Sandbox/ChatPrompt.js';

class Brain {
    constructor(config = {}) {
        
        this.Chat = new Chat()

        this.port = config.port || 3000;
        this.easyai_url = config.easyai_url || ((config.openai_token) ? undefined : 'localhost')
        this.easyai_port = config.easyai_port || (this.easyai_url == 'localhost') ? 4000 : undefined
        this.AI = new EasyAI({server_url : this.easyai_url,server_port : this.easyai_port,openai_token : config.openai_token,openai_model : config.openai_model})
        this.processInputFunction = async (input,displayToken) => {
            this.Chat.NewMessage('User: ',input)
            let historical_prompt = ''
            this.Chat.Historical.forEach(e => {
             historical_prompt = `${historical_prompt}${e.Sender}${e.Content} | `
            })
            let result = await this.AI.Generate(`${ChatPrompt}${historical_prompt}AI:`,{tokenCallback : async (token) => {await displayToken(token.stream.content)},stop : ['|']})
            this.Chat.NewMessage('AI: ',result.full_text)
        }
        
        this.ensureBaseFiles();
        this.initServer();
    }

    ensureBaseFiles() {
        const files = ['chat.html', 'main.html','index.html'];
        files.forEach(file => {
            const rootPath = path.join(process.cwd(), file);
            const corePath = path.join(process.cwd(), 'core', file);
            if (!existsSync(rootPath)) {
                // Copy file from core to root if it doesn't exist in the root
                copyFileSync(corePath, rootPath);
                console.log(`${file} copied to root directory.`);
            }
        });
    }

    initServer() {
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                // Serve the combined index.html
                const indexHtml = readFileSync('./index.html').toString();
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(indexHtml);
                return;
            } else {
                // Serve other files or handle 404
                const filePath = path.join(process.cwd(), req.url);
                if (existsSync(filePath)) {
                    const fileContent = readFileSync(filePath).toString();
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(fileContent);
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            }
        });

        const ws = new WebSocket(this.port+1)

        
            ws.on('message', async (socket,message) => {
                await this.processInputFunction(message, async (responseToken) => {
                    ws.send(socket,JSON.stringify({type : 'token', token : responseToken})); // Send each token back to the client
                });
                ws.send(socket,"END_OF_RESPONSE"); // Signal the end of response processing
            });
       

        watch('./main.html', (eventType, filename) => {
            if (eventType === 'change') {
                const updatedHtml = readFileSync('./main.html', 'utf8');
               
                    ws.broadcast(JSON.stringify({ type: 'update-html', html: updatedHtml }));
               
            }
        });


        server.listen(this.port,() => console.log(`Server and WebSocket listening on port 3000`));
    
    
    }

}

export default Brain;
