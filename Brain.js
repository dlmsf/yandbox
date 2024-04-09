import http from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync, existsSync, copyFileSync } from 'fs';
import path from 'path';

class Brain {
    constructor(processInputFunction) {
        this.processInputFunction = processInputFunction;
        this.ensureBaseFiles();
        this.initServer();
    }

    ensureBaseFiles() {
        const files = ['chat.html', 'main.html'];
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
                // Now serving from the root directory
                const chatHtml = readFileSync('./chat.html').toString();
                const mainHtml = readFileSync('./main.html').toString();
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(mainHtml + chatHtml);
                return;
            }
            res.writeHead(404);
            res.end();
        });

        const wss = new WebSocketServer({ server });

        wss.on('connection', ws => {
            ws.on('message', async message => {
                await this.processInputFunction(message, async (responseToken) => {
                    ws.send(responseToken); // Send each token back to the client
                });
                ws.send("END_OF_RESPONSE"); // Signal the end of response processing
            });
        });

        server.listen(3000, () => console.log(`Server and WebSocket listening on port 3000`));
    }
}

export default Brain;
