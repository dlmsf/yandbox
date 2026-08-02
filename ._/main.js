// ._/main.js – Exports the HTML for main.html (blank page for dynamic content)
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Blank Page</title>
</head>
<body>
    <!-- This content can be dynamically modified based on the input from chat.html -->
</body>
</html>`;

export default html;

// ----- CLI functionality -----
if (import.meta.url === `file://${process.argv[1]}`) {
    import('fs').then(({ writeFileSync, readFileSync, existsSync }) => {
        import('path').then(({ resolve, basename }) => {
            const args = process.argv.slice(2);
            const cmd = args[0];

            const escapeForTemplate = (str) =>
                str.replace(/`/g, '\\`').replace(/\${/g, '\\${');

            if (cmd === '--gen') {
                const outDir = args[1] || '.';
                const outPath = resolve(outDir, 'main.html');
                writeFileSync(outPath, html, 'utf8');
                console.log(`Generated main.html at ${outPath}`);
            } else if (cmd === '--update') {
                const inFile = args[1] || 'main.html';
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
  node ${basename(import.meta.url)} --gen [outputDir]   Generate main.html in outputDir (default .)
  node ${basename(import.meta.url)} --update [inputFile] Update this JS file with content from inputFile (default main.html)`);
            }
        });
    });
}