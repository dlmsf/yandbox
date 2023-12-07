import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function getCurrentDirectory() {
    return path.dirname(fileURLToPath(import.meta.url));
}

function shouldIgnore(relativeFilePath, config) {
    if (config.ignore && config.ignore.includes(relativeFilePath)) {
        return true;
    }
    if (config.ignoreStartsWith) {
        return config.ignoreStartsWith.some(prefix => relativeFilePath.startsWith(prefix));
    }
    return false;
}

async function readFiles(directory, baseFolder, config, output) {
    const files = await fs.readdir(directory);

    if (files.length === 0) {
        // Add an entry for an empty directory
        output.push(`//${path.relative(baseFolder, directory)} - Empty Directory\n`);
        return;
    }

    for (const file of files) {
        const relativeFilePath = path.relative(baseFolder, path.join(directory, file));

        if (shouldIgnore(relativeFilePath, config)) {
            continue;
        }

        const filePath = path.join(directory, file);
        const fileStat = await fs.stat(filePath);

        if (fileStat.isDirectory()) {
            await readFiles(filePath, baseFolder, config, output);
        } else {
            const content = await fs.readFile(filePath, 'utf8');
            output.push(`//${relativeFilePath}\n${content}\n`);
        }
    }
}

async function Framework(folderPath = getCurrentDirectory(), config = {}) {
    let output = [];

    try {
        await readFiles(folderPath, folderPath, config, output);
    } catch (error) {
        console.error('Error reading folder:', error);
        return ''; // Return an empty string in case of an error
    }

    return output.join('\n').trim();
}

export default Framework;
