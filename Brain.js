import http from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync, existsSync, copyFileSync,watch } from 'fs';
import path from 'path';

function Sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

function tokenize(text) {
    return text.trim().match(/(?:^|\s+)(\S+)/g);
  }

let default_function = async (input,display) => {

    let frase = [' Você',' Digitou ',...tokenize(input.toString())]
  
    for(const w of frase){
      await display(w)
      await Sleep(20)
    }
}

class Brain {
    constructor(config = {inputFunction : undefined}) {
        this.processInputFunction = config.inputFunction || default_function
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

        const wss = new WebSocketServer({ server });

        wss.on('connection', ws => {
            ws.on('message', async message => {
                await this.processInputFunction(message, async (responseToken) => {
                    ws.send(JSON.stringify({type : 'token', token : responseToken})); // Send each token back to the client
                });
                ws.send("END_OF_RESPONSE"); // Signal the end of response processing
            });
        });

        watch('./main.html', (eventType, filename) => {
            if (eventType === 'change') {
                const updatedHtml = readFileSync('./main.html', 'utf8');
                wss.clients.forEach(client => {
                    client.send(JSON.stringify({ type: 'update-html', html: updatedHtml }));
                });
            }
        });


        server.listen(3000, () => console.log(`Server and WebSocket listening on port 3000`));
    
    
    }

}

export default Brain;
