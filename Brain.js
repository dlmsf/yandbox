import http from 'http';
import { readFileSync } from 'fs';
import url from 'url';

class Brain {
    constructor(processInputFunction) {
        this.processInputFunction = processInputFunction;
        this.messageQueue = []; // Queue of message tokens to be sent to the client

        this.httpServer = http.createServer((req, res) => this.handleRequest(req, res));
    }

    async handleRequest(request, response) {
        const parsedUrl = url.parse(request.url, true);

        if (parsedUrl.pathname === '/') {
            const chatHtml = readFileSync('./core/chat.html').toString();
            const blankHtml = readFileSync('./core/blank.html').toString();
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(blankHtml + chatHtml);
        } else if (parsedUrl.pathname === '/send') {
            let body = '';
            request.on('data', chunk => body += chunk.toString());
            request.on('end', async () => {
                const { message } = JSON.parse(body);
                // Process the input and populate the queue
                await this.processInputFunction(message, (responseMessage) => {
                    this.messageQueue.push(...responseMessage.split(" ")); // Splitting message into tokens
                });
                response.writeHead(204); // No content to send back immediately
                response.end();
            });
        } else if (parsedUrl.pathname === '/poll') {
            if (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift(); // Get the next token
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message }));
            } else {
                response.writeHead(204); // No content if the queue is empty
                response.end();
            }
        } else {
            response.writeHead(404);
            response.end();
        }
    }

    listen(port = 3000) {
        this.httpServer.listen(port, () => console.log(`Server listening on port ${port}`));
    }
}

export default Brain;
