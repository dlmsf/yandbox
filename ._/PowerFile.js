import fs from 'fs'
import util from 'util'

/**
 * A class for manipulating file content.
 */
class PowerFile {
  /**
   * A promisified version of fs.readFile.
   * @param {string} path - The file path.
   * @param {string} [options] - The encoding option.
   * @returns {Promise<string>} The file content.
   */
  static readFile = util.promisify(fs.readFile);

  /**
   * A promisified version of fs.writeFile.
   * @param {string} path - The file path.
   * @param {string} data - The data to write.
   * @param {string} [options] - The encoding option.
   * @returns {Promise<void>} A promise that resolves when the file is written.
   */
  static writeFile = util.promisify(fs.writeFile);

/**
 * Indexes the file content and returns an array of objects with the character and its index.
 * If config.saveToFile is true, saves the result in a file named 'fileindex.txt'.
 * If config.minified is true, returns the result in a minified string format.
 * @param {string} path - The file path.
 * @param {Object} [config] - Configuration object (optional).
 * @param {number} [config.startIndex] - The start index (inclusive).
 * @param {number} [config.finishIndex] - The finish index (exclusive).
 * @param {boolean} [config.minified] - If true, returns the result in a minified string format.
 * @param {boolean} [config.saveToFile] - If true, saves the result in a file named 'fileindex.txt'.
 * @returns {Promise<string|Array<{index: number, char: string}>>} The indexed file content.
 */
static async Index(path, config = {}) {
  try {
    const data = await PowerFile.readFile(path, 'utf8');
    let startIndex = config.startIndex || 0;
    let finishIndex = config.finishIndex || data.length;

    // Adjust indices to fit within the data length
    startIndex = Math.max(0, Math.min(startIndex, data.length));
    finishIndex = Math.max(0, Math.min(finishIndex, data.length));

    const result = data.slice(startIndex, finishIndex).split('').map((char, index) => ({ index: startIndex + index, char }));

    if (config.minified) {
      const minifiedResult = result.map(({ index, char }) => `index${index}:${char.replace(/\n/g, '\\n')}`).join('\n');
      if (config.saveToFile) {
        await PowerFile.writeFile('fileindex.txt', minifiedResult);
        return 'Result saved in fileindex.txt';
      }
      return minifiedResult;
    }

    if (config.saveToFile) {
      await PowerFile.writeFile('fileindex.txt', JSON.stringify(result));
      return 'Result saved in fileindex.txt';
    }

    return result;
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    return [];
  }
}



 /**
 * This method is designed to replace the content between two specified indexes in a file.
 * The characters at the start and end indexes are not replaced and remain intact.
 * @param {string} path - The file path where the replacement should occur.
 * @param {Object} config - The configuration object that holds the necessary information for the replacement. It contains the following properties:
 * @param {number} config.startIndex - The starting index of the content to replace. This character will not be replaced.
 * @param {number} config.endIndex - The ending index of the content to replace. This character will not be replaced.
 * @param {string} config.content - The new content that will replace the original content between the start and end indexes.
 * @returns {Promise<void>} A promise that resolves when the file is successfully updated.
 *
 * @example
 * // Given a file with the content '0123456789abcdef', the following call:
 * await PowerFile.Replace('path/to/file.txt', {
 *   startIndex: 5,  // '5' will not be replaced
 *   endIndex: 10,  // 'a' will not be replaced
 *   content: 'REPL'
 * });
 * // Will result in the file content being '012345REPLabcdef'. As you can see, the characters at indexes 6, 7, 8, and 9 have been replaced with 'REPL'.
 */
static async Replace(path, config) {
  try {
    // Read the file and convert its content into an array of objects. Each object contains an index and a char property.
    const data = await PowerFile.Index(path);

    // Retrieve the characters at the start and end indexes. These characters will not be replaced.
    const start = data[config.startIndex];
    const end = data[config.endIndex];

    // Create a new array called updatedData. This array will contain the original data up to the start index,
    // the character at the start index, the new content, the character at the end index, and the original data after the end index.
    const updatedData = [
      ...data.slice(0, config.startIndex), // Original data up to the start index
      start, // Character at the start index
      ...Array.from(config.content, (char, i) => ({
        index: config.startIndex + i + 1, // Assign new indexes to the new content
        char,
      })), // The new content
      end, // Character at the end index
      ...data.slice(config.endIndex + 1), // Original data after the end index
    ];

    // Convert the updatedData array back into a string by joining all the characters together.
    const content = updatedData.map(({ char }) => char).join('');

    // Write the updated content back to the file.
    await PowerFile.writeFile(path, content);
  } catch (error) {
    console.error(`Error replacing content: ${error}`);
  }
}


  

  /**
   * Implements content in the file at the specified index.
   * @param {string} path - The file path.
   * @param {Object} implement - The implement object with the following properties:
   * @param {number} implement.index - The index to implement the content at.
   * @param {string} implement.content - The content to implement.
   * @returns {Promise<void>} A promise that resolves when the file is updated.
   */
  static async Implement(path, implement) {
    try {
      const data = await PowerFile.Index(path);
      const updatedData = [
        ...data.slice(0, implement.index),
        data[implement.index],
        { index: implement.index + 1, char: implement.content },
        ...data.slice(implement.index + 1),
      ];
      const content = updatedData.map(({ char }) => char).join('');
      await PowerFile.writeFile(path, content);
    } catch (error) {
      console.error(`Error implementing content: ${error}`);
    }
  }
  
}

export default PowerFile;