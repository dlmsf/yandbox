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
 * Replaces the content between two indexes in the file while keeping the start and end indexes intact.
 * The characters at the start and end indexes are included in the replacement.
 * @param {string} path - The file path.
 * @param {Object} config - The configuration object with the following properties:
 * @param {number} config.startIndex - The start index of the content to replace (inclusive).
 * @param {number} config.endIndex - The end index of the content to replace (inclusive).
 * @param {string} config.content - The new content to replace with.
 * @returns {Promise<void>} A promise that resolves when the file is updated.
 *
 * @example
 * // Replace content between indexes 5 and 10 with 'replacement'
 * await PowerFile.Replace('path/to/file.txt', {
 *   startIndex: 5,
 *   endIndex: 10,
 *   content: 'replacement'
 * });
 */
static async Replace(path, config) {
  try {
    // Read the file and get its content as an array of objects with index and char properties
    const data = await PowerFile.Index(path);

    // Retrieve the characters to be replaced
    const start = data[config.startIndex];
    const end = data[config.endIndex];

    // Construct the updatedData array by inserting the new content at the specified indexes
    const updatedData = [
      ...data.slice(0, config.startIndex),
      start,
      ...Array.from(config.content, (char, i) => ({
        index: config.startIndex + i + 1,
        char,
      })),
      end,
      ...data.slice(config.endIndex + 1),
    ];

    // Construct the content string by joining all characters in the updatedData array
    const content = updatedData.map(({ char }) => char).join('');

    // Write the updated content back to the file
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