import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class Framework {
    // Utility method to get the current directory
    static getCurrentDirectory() {
        return process.cwd();
    }

    // Utility method to determine if a file should be ignored
    static shouldIgnore(relativeFilePath, config) {
        if (config.ignore && config.ignore.includes(relativeFilePath)) {
            return true;
        }
        if (config.ignoreStartsWith) {
            return config.ignoreStartsWith.some(prefix => relativeFilePath.startsWith(prefix));
        }
        return false;
    }

    // Recursive method to read files from a directory
    static async readFiles(directory, baseFolder, config, output, currentLevel = 0, tokenCount = 0) {
        if (config.level !== -1 && currentLevel > config.level) {
            return tokenCount;
        }

        const files = await fs.readdir(directory);
        if (files.length === 0) {
            const emptyDirStr = `#<># ${path.relative(baseFolder, directory)} - Empty Directory\n`;
            if (tokenCount + emptyDirStr.length <= config.max_tokens) {
                output.push(emptyDirStr);
                return tokenCount + emptyDirStr.length;
            }
            return tokenCount;
        }

        for (const file of files) {
            const relativeFilePath = path.relative(baseFolder, path.join(directory, file));
            if (Framework.shouldIgnore(relativeFilePath, config)) {
                continue;
            }

            const filePath = path.join(directory, file);
            const fileStat = await fs.stat(filePath);

            if (fileStat.isDirectory()) {
                tokenCount = await Framework.readFiles(filePath, baseFolder, config, output, currentLevel + 1, tokenCount);
                if (tokenCount >= config.max_tokens) {
                    return tokenCount;
                }
            } else {
                const content = await fs.readFile(filePath, 'utf8');
                const fileContentStr = `#<># ${relativeFilePath}\n${content}\n`;
                if (tokenCount + fileContentStr.length <= config.max_tokens) {
                    output.push(fileContentStr);
                    tokenCount += fileContentStr.length;
                } else {
                    return tokenCount;
                }
            }
        }
        return tokenCount;
    }

  /**
 * Reads the contents of files and directories from a specified folder,
 * returning them as a string. This method is configurable to include
 * or ignore specific files and directories.
 *
 * @param {Object} [config={}] - Configuration options for reading files.
 * @param {string} [config.folderPath=Framework.getCurrentDirectory()] - The path of the folder to be read.
 * @param {string[]} [config.ignore] - List of file paths to ignore.
 * @param {string[]} [config.ignoreStartsWith] - List of prefix strings to ignore.
 * @param {boolean} [config.subtitle=false] - Include a default subtitle explaining the tagging system.
 * @param {string} [config.customSubtitle] - Custom explanatory subtitle, if provided.
 * @param {number} [config.level=2] - The depth level for directory traversal. 
 *                                    -1 for unlimited depth, 0 for the current directory only, 
 *                                    1 for one level of subdirectories, etc.
 * @param {number} [config.max_tokens=Infinity] - The maximum number of tokens allowed in the output string.
 *                                                The token count is approximated based on characters, 
 *                                                assuming roughly 4 characters per token.
 * @returns {Promise<string>} A promise that resolves to a string containing the contents of the files.
 */

  static async Get(config = {}) {
    const folderPath = config.folderPath || Framework.getCurrentDirectory();
    let output = [];
    config.level = (typeof config.level === 'undefined') ? 2 : config.level;
    config.max_tokens = (typeof config.max_tokens === 'undefined') ? Infinity : config.max_tokens;

    if (config.subtitle) {
        output.push(`#<># Subtitle: Each entry starts with '#<>#' followed by the file or folder name.\n`);
    }
    if (config.customSubtitle) {
        output.push(`#<># ${config.customSubtitle}\n`);
    }

    try {
        await Framework.readFiles(folderPath, folderPath, config, output);
    } catch (error) {
        console.error('Error reading folder:', error);
        return '';
    }

    return output.join('\n').trim();
}
    // Method to parse framework string into a map
    static parseFrameworkString(frameworkStr) {
        const fileMap = new Map();
        const fileSections = frameworkStr.split('#<>#').slice(1);

        for (const section of fileSections) {
            const [relativeFilePath, ...contents] = section.split('\n');
            fileMap.set(relativeFilePath.trim(), contents.join('\n').trim());
        }

        return fileMap;
    }

 /**
     * Compares two frameworks and identifies changes.
     *
     * @param {string} baseFramework - The string output from the base Framework.
     * @param {string} afterFramework - The string output from the after Framework.
     * @param {Object} [config={}] - Configuration options for comparison.
     * @param {boolean} [config.subtitle=false] - Include a default subtitle explaining the tagging system.
     * @param {string} [config.customSubtitle] - Custom explanatory subtitle, if provided.
     * @returns {string} A string listing modified, new, or deleted files.
     */

    // Compare method
    static Compare(baseFramework, afterFramework, config = {}) {
        const baseMap = Framework.parseFrameworkString(baseFramework);
        const afterMap = Framework.parseFrameworkString(afterFramework);
        let output = [];
    
        if (config.subtitle || config.customSubtitle) {
            output.push(`#<># Subtitle: Each entry starts with '#<>#' indicating the change type and file or folder name.`);
            output.push(`#<># Note: Moving a file will be shown as the file being deleted in its old location and newly created in its new location.`);
            output.push(`#<># Example: Moving 'example.txt' from 'folder1' to 'folder2' will show as 'folder1\\example.txt - Deleted' and 'folder2\\example.txt - New File'.\n`);
        }
        if (config.customSubtitle) {
            output.push(`#<># ${config.customSubtitle}\n`);
        }
    
        for (const [filePath, fileContent] of afterMap.entries()) {
            if (!baseMap.has(filePath)) {
                output.push(`#<># ${filePath} - New File\n`);
            } else if (baseMap.get(filePath) !== fileContent) {
                output.push(`#<># ${filePath} - Modified\n${fileContent}\n`);
            }
        }
    
        for (const filePath of baseMap.keys()) {
            if (!afterMap.has(filePath)) {
                output.push(`#<># ${filePath} - Deleted\n`);
            }
        }
    
        return output.join('').trim();
    }
}

export default Framework;