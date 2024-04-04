// Brain.js
import http from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';

class Brain {
    constructor(processInputFunction) {
        this.processInputFunction = processInputFunction;
        this.initServer();
    }

    initServer() {
        const server = http.createServer((req, res) => {
            // Serve the combined HTML (blank.html + chat.html)
            if (req.url === '/') {
                const chatHtml = readFileSync('./core/chat.html').toString();
                const blankHtml = readFileSync('./core/blank.html').toString();
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(blankHtml + chatHtml);
                return;
            }
            res.writeHead(404);
            res.end();
        });

        const wss = new WebSocketServer({ server });

        wss.on('connection', ws => {
            ws.on('message', async message => {
                // Process the input and send back responses token by token
                await this.processInputFunction(message, async (responseToken) => {
                    ws.send(responseToken); // Send each token back to the client
                });
            });
        });

        server.listen(3000, () => console.log(`Server and WebSocket listening on port 3000`));
    }
}

export default Brain;
