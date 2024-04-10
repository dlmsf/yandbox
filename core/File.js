import { promises as fs } from 'fs';

/**
 * Advanced file manipulation utilities designed for creating, editing,
 * and precisely implementing content with flexibility and ease of use.
 */
class File {
  /**
   * Creates or overwrites a file with the specified content. Defaults to an empty file if content is not provided.
   * @param {string} path Path to the file.
   * @param {string} [content=''] Content to write to the file.
   * @returns {Promise<void>} Resolves on successful file creation.
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
   * @param {string} path Path to the file.
   * @param {Array<{searchValue: string | RegExp, newValue: string, instance?: number}>} edits Edits to perform, with optional instance to target specific occurrences.
   * @returns {Promise<void>} Resolves on successful file edit.
   */
  static async Edit(path, edits) {
    try {
      let content = await fs.readFile(path, 'utf8');
      
      edits.forEach(({ searchValue, newValue, instance }) => {
        if (typeof instance === 'number') {
          const matches = content.match(new RegExp(searchValue, 'g')) || [];
          if (matches.length >= instance + 1) {
            let i = 0;
            content = content.replace(new RegExp(searchValue, 'g'), (match) => {
              i++;
              return i - 1 === instance ? newValue : match;
            });
          }
        } else {
          content = content.replace(new RegExp(searchValue, 'g'), newValue);
        }
      });

      await fs.writeFile(path, content);
      console.log(`File edited: ${path}`);
    } catch (error) {
      console.error(`Failed to edit file: ${error}`);
    }
  }

  /**
 * Implements content with precision into a file, designed for complex and extensive codebases.
 * Offers several options for specifying the exact location for the content implementation,
 * including support for multiple identical markers and proximity-based insertion.
 * 
 * @param {string} path Path to the file where content will be implemented.
 * @param {string} contentToImplement The content to be inserted into the file.
 * @param {Object} options Configuration options to define the precise insertion point and behavior.
 * @param {'beforeMarker' | 'afterMarker' | 'atIndex'} [options.method='atIndex'] Specifies the method of insertion: before or after a marker, or at a specific index.
 * @param {string} [options.marker] The marker relative to which content will be implemented (required for 'beforeMarker' and 'afterMarker' methods).
 * @param {number} [options.index] The exact index at which to implement content (required for 'atIndex' method).
 * @param {number} [options.instance=0] For files with multiple instances of the same marker, specifies which instance to target. The first instance is 0.
 * @param {'start' | 'end'} [options.position='end'] For 'beforeMarker' and 'afterMarker' methods, specifies whether to insert at the start or end of the marker when multiple instances are found.
 * @returns {Promise<void>} Resolves when the content has been successfully implemented.
 */
static async Implement(path, contentToImplement, options = {}) {
  try {
    let content = await fs.readFile(path, 'utf8');
    const { method = 'atIndex', marker, index, instance = 0, position = 'end' } = options;

    if (method === 'beforeMarker' || method === 'afterMarker') {
      if (!marker) throw new Error('Marker is required for beforeMarker and afterMarker methods.');

      let parts = content.split(marker);
      if (parts.length <= 1) throw new Error('Marker not found.');

      // Adjusting parts array to target specific instance.
      if (instance >= 0 && instance < parts.length - 1) {
        let targetedPart = parts.splice(instance, 2).join(marker);
        targetedPart = method === 'beforeMarker' ? contentToImplement + targetedPart : targetedPart + contentToImplement;
        parts.splice(instance, 0, targetedPart);
      } else {
        throw new Error('Specified instance of marker not found.');
      }

      content = parts.join(marker);
    } else if (method === 'atIndex') {
      if (index === undefined || index < 0 || index > content.length) throw new Error('Invalid index.');
      content = content.substring(0, index) + contentToImplement + content.substring(index);
    } else {
      throw new Error('Invalid method.');
    }

    await fs.writeFile(path, content);
    console.log(`Content implemented successfully in ${path}.`);
  } catch (error) {
    console.error(`Failed to implement content: ${error}`);
  }
}

}

export default File;