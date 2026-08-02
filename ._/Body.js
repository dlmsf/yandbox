import fs from 'fs';

class Body {
    static getBodyWithTags(html) {
        const bodyMatch = html.match(/<body[^>]*>[\s\S]*<\/body>/i);
        return bodyMatch ? bodyMatch[0] : '';
    }

    static replaceBodyContent(html, newBody) {
        // Ensure newBody doesn't have the <body> tag
        if (newBody.includes('<body>')) {
            newBody = newBody.replace(/<body[^>]*>/i, '').replace(/<\/body>/i, '');
        }
        return html.replace(/<body[^>]*>[\s\S]*<\/body>/i, `<body>${newBody}</body>`);
    }

    static Get(config = {}) {
        const filePath = config.filePath || './main.html';
        const html = fs.readFileSync(filePath, 'utf8');
        return Body.getBodyWithTags(html);
    }

    static Replace(newBody, config = {}) {
        const filePath = config.filePath || './main.html';
        let html = fs.readFileSync(filePath, 'utf8');
        html = Body.replaceBodyContent(html, newBody);
        fs.writeFileSync(filePath, html, 'utf8');
    }
}

export default Body;
