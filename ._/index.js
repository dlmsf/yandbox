// ._/index.js – Exports the HTML for index.html (main frame + iframe)
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Blank Page</title>
    <style>
      body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
        }
        iframe {
            border: 0;
            position: fixed;
            z-index: 1000;
            width: 40px;
            height: 40px;
            right: 20px;
            bottom: 20px;
            background: transparent !important;
            transition: none;
        }
    </style>
</head>
<body>
    <div id="main-content">
        <!-- Main content will be dynamically loaded and updated here -->
    </div>
    <iframe id="chat-frame" src="chat.html" frameborder="0" allowtransparency="true"></iframe>

    <script>
        (function() {
            const iframe = document.getElementById('chat-frame');
            const PADDING = 20;
            const ICON_SIZE = 40;

            let currentLeft = window.innerWidth - ICON_SIZE - PADDING;
            let currentTop  = window.innerHeight - ICON_SIZE - PADDING;
            let currentWidth = ICON_SIZE;
            let currentHeight = ICON_SIZE;

            function applyPosition() {
                iframe.style.left = currentLeft + 'px';
                iframe.style.top  = currentTop + 'px';
                iframe.style.width  = currentWidth + 'px';
                iframe.style.height = currentHeight + 'px';
                iframe.style.right = '';
                iframe.style.bottom = '';
            }

            applyPosition();

            window.addEventListener('message', function(event) {
                const data = event.data;
                if (data && data.type === 'position') {
                    currentLeft = data.left;
                    currentTop  = data.top;
                    currentWidth = data.width;
                    currentHeight = data.height;
                    applyPosition();
                }
            });

            // SSE connection to handle dynamic updates
            const eventSource = new EventSource('/events');
            
            eventSource.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'update-html') {
                        const mainContent = document.getElementById('main-content');
                        mainContent.innerHTML = '';
                        insertAndExecuteScripts(mainContent, data.html);
                        updatePageTitle(data.html);
                    }
                } catch (e) {
                    console.error(\`Failed to parse incoming message: \${e.message}\`);
                }
            };

            eventSource.onerror = function(error) {
                console.error('SSE connection error:', error);
            };

            function updatePageTitle(htmlString) {
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = htmlString;
                const titleElement = tempContainer.querySelector('title');
                if (titleElement && titleElement.textContent) {
                    document.title = titleElement.textContent;
                }
            }

            function insertAndExecuteScripts(container, htmlString) {
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = htmlString;

                const titleElement = tempContainer.querySelector('title');
                if (titleElement) {
                    document.title = titleElement.textContent;
                    titleElement.remove();
                }

                Array.from(tempContainer.childNodes).forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SCRIPT') {
                        container.appendChild(node.cloneNode(true));
                    }
                });

                const scripts = tempContainer.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    if (script.src) {
                        newScript.src = script.src;
                    } else {
                        newScript.textContent = script.textContent;
                    }
                    document.body.appendChild(newScript).parentNode.removeChild(newScript);
                });
            }

            document.addEventListener('DOMContentLoaded', function() {
                fetch('main.html')
                    .then(response => response.text())
                    .then(html => {
                        const mainContent = document.getElementById('main-content');
                        mainContent.innerHTML = html;
                        updatePageTitle(html);
                    });
            });
        })();
    <\/script>
</body>
</html>`;

export default html;

// ----- CLI functionality (unchanged) -----
if (import.meta.url === `file://${process.argv[1]}`) {
    import('fs').then(({ writeFileSync, readFileSync, existsSync }) => {
        import('path').then(({ resolve, basename }) => {
            const args = process.argv.slice(2);
            const cmd = args[0];
            const escapeForTemplate = (str) =>
                str.replace(/`/g, '\\`').replace(/\${/g, '\\${');

            if (cmd === '--gen') {
                const outDir = args[1] || '.';
                const outPath = resolve(outDir, 'index.html');
                writeFileSync(outPath, html, 'utf8');
                console.log(`Generated index.html at ${outPath}`);
            } else if (cmd === '--update') {
                const inFile = args[1] || 'index.html';
                if (!existsSync(inFile)) {
                    console.error(`File ${inFile} not found.`);
                    process.exit(1);
                }
                const newHtml = readFileSync(inFile, 'utf8');
                const selfPath = import.meta.url.replace(/^file:\/\//, '');
                const selfContent = readFileSync(selfPath, 'utf8');
                const updatedContent = selfContent.replace(
                    /(const html = )`([\s\S]*?)`;/,
                    (_, prefix, oldContent) => `${prefix}\`${escapeForTemplate(newHtml)}\`;`
                );
                writeFileSync(selfPath, updatedContent, 'utf8');
                console.log(`Updated ${selfPath} with content from ${inFile}`);
            } else {
                console.log(`Usage:
  node ${basename(import.meta.url)} --gen [outputDir]   Generate index.html in outputDir (default .)
  node ${basename(import.meta.url)} --update [inputFile] Update this JS file with content from inputFile (default index.html)`);
            }
        });
    });
}