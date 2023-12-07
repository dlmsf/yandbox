/**
 * Parses the framework string to create a map of file paths to contents.
 * @param {string} frameworkStr - The string output from the Framework function.
 * @returns {Map<string, string>} - A map where keys are file paths and values are file contents.
 */

/**
 * Compares two frameworks and identifies modified or new files.
 * @param {string} baseFramework - The string output from the base Framework.
 * @param {string} afterFramework - The string output from the after Framework.
 * @returns {string} - A string listing modified or new files.
 */
function parseFrameworkString(frameworkStr) {
    const fileMap = new Map();
    const fileSections = frameworkStr.split('//').slice(1);

    for (const section of fileSections) {
        const [relativeFilePath, ...contents] = section.split('\n');
        fileMap.set(relativeFilePath.trim(), contents.join('\n').trim());
    }

    return fileMap;
}

function FrameworkCompare(baseFramework, afterFramework) {
    const baseMap = parseFrameworkString(baseFramework);
    const afterMap = parseFrameworkString(afterFramework);
    let output = '';

    for (const [filePath, fileContent] of afterMap.entries()) {
        if (!baseMap.has(filePath)) {
            output += `//${filePath} - New File\n`;
        } else if (baseMap.get(filePath) !== fileContent) {
            output += `//${filePath} - Modified\n${fileContent}\n`;
        }
    }

    for (const filePath of baseMap.keys()) {
        if (!afterMap.has(filePath)) {
            output += `//${filePath} - Deleted\n`;
        }
    }

    return output.trim();
}

export default FrameworkCompare
