import { promises as fs } from 'fs';

/**
 * Provides advanced utilities for creating, editing, and accurately implementing content in files,
 * designed to handle complex scenarios with high precision.
 */
class File {
  /**
   * Creates or overwrites a file with the specified content.
   * @param {string} path - Path to the file.
   * @param {string} [content=''] - Content to write to the file. Defaults to an empty file.
   * @returns {Promise<void>} - Resolves on successful file creation.
   */
  static async Create(path, content = '') {
    try {
      await fs.writeFile(path, content);
      console.log(`File created: ${path}`);
    } catch (error) {
      console.error(`Failed to create file: ${error}`);
    }
  }

  /**
   * Edits a file with high precision, allowing for targeted replacements in files with multiple identical parts.
   * @param {string} path - Path to the file.
   * @param {Array<{searchValue: string | RegExp, newValue: string, instance?: number}>} edits - Edits to perform, with optional instance to target specific occurrences.
   * @returns {Promise<void>} - Resolves on successful file edit.
   */
  static async Edit(path, edits) {
    try {
      let content = await fs.readFile(path, 'utf8');
      
      edits.forEach(({ searchValue, newValue, instance }) => {
        if (typeof instance === 'number') {
          const parts = content.split(searchValue);
          let occurrenceCount = 0;
          content = parts.reduce((acc, currentPart, index) => {
            if (index < parts.length - 1) { // Avoid adding the searchValue after the last part
              if (occurrenceCount === instance) {
                acc += newValue + currentPart;
              } else {
                acc += searchValue + currentPart;
              }
              occurrenceCount++;
            } else {
              acc += currentPart; // Add the last part without appending searchValue
            }
            return acc;
          }, '');
        } else if (searchValue instanceof RegExp) {
          content = content.replace(searchValue, newValue);
        } else {
          content = content.split(searchValue).join(newValue); // Replace all occurrences if instance is not specified
        }
      });

      await fs.writeFile(path, content);
      console.log(`File edited: ${path}`);
    } catch (error) {
      console.error(`Failed to edit file: ${error}`);
    }
  }

  /**
   * Implements content with precision into a file, supporting complex conditions for insertion.
   * @param {string} path - Path to the file.
   * @param {string} contentToImplement - Content to be implemented.
   * @param {Object} options - Insertion options, supporting markers or indices, and specifying whether before or after the marker/index.
   * @returns {Promise<void>} - Resolves on successful content implementation.
   */
  static async Implement(path, contentToImplement, options) {
    try {
      let fileContent = await fs.readFile(path, 'utf8');
      if ('marker' in options && options.marker) {
        const segments = fileContent.split(options.marker);
        if (segments.length > 1) { // Marker found at least once
          const markerIndex = options.instance && options.instance > 0 && options.instance < segments.length ? options.instance : 0;
          fileContent = segments.slice(0, markerIndex + 1).join(options.marker) + contentToImplement + segments.slice(markerIndex + 1).join(options.marker);
        } else {
          throw new Error('Marker not found.');
        }
      } else if ('index' in options && typeof options.index === 'number') {
        fileContent = fileContent.substring(0, options.index) + contentToImplement + fileContent.substring(options.index);
      } else {
        throw new Error('Invalid options for implementing content.');
      }

      await fs.writeFile(path, fileContent);
      console.log(`Content implemented in ${path}.`);
    } catch (error) {
      console.error(`Failed to implement content: ${error}`);
    }
  }
}

export default File;