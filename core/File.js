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
   * Implements content into a file with high precision, supporting advanced insertion strategies.
   * This method accommodates complex scenarios, including inserting content between similar markers.
   *
   * @param {string} path - The path to the file where content will be implemented.
   * @param {string} contentToImplement - The content to be inserted into the file.
   * @param {Object} options - Configuration options for precise insertion.
   * @param {'beforeMarker'|'afterMarker'|'atIndex'|'betweenMarkers'} [options.method='atIndex'] - The method of insertion:
   *        'beforeMarker': Inserts content before the specified marker.
   *        'afterMarker': Inserts content after the specified marker.
   *        'atIndex': Inserts content at a specific character index in the file.
   *        'betweenMarkers': Inserts content between two specified markers.
   * @param {string} [options.marker] - The marker relative to which content will be implemented. Required for 'beforeMarker' and 'afterMarker'.
   * @param {string} [options.startMarker] - The starting marker when using 'betweenMarkers' method. Defines the start of the insertion area.
   * @param {string} [options.endMarker] - The ending marker when using 'betweenMarkers' method. Defines the end of the insertion area.
   * @param {number} [options.index] - The exact character index at which to implement content. Required for 'atIndex'.
   * @param {number} [options.instance=0] - For files with multiple instances of the same marker, specifies which instance to target.
   * @param {'start'|'end'} [options.position='end'] - For 'beforeMarker' and 'afterMarker', specifies insertion at the start or end of the marker when multiple instances are found.
   * @returns {Promise<void>} - A promise that resolves when the content has been successfully implemented.
   */
 static async Implement(path, contentToImplement, options = {}) {
  try {
    let content = await fs.readFile(path, 'utf8');

    switch (options.method) {
      case 'beforeMarker':
      case 'afterMarker':
        if (!options.marker) throw new Error('Marker is required for beforeMarker and afterMarker methods.');
        const parts = content.split(options.marker);
        if (parts.length <= 1) throw new Error('Marker not found.');
        if (options.method === 'beforeMarker') {
          content = parts.join(options.marker + contentToImplement);
        } else {
          content = contentToImplement + parts.join(options.marker);
        }
        break;
      case 'atIndex':
        if (options.index === undefined || options.index < 0 || options.index > content.length) {
          throw new Error('Invalid index.');
        }
        content = content.substring(0, options.index) + contentToImplement + content.substring(options.index);
        break;
      case 'betweenMarkers':
        if (!options.startMarker || !options.endMarker) throw new Error('Start and end markers are required for betweenMarkers method.');
        const startIndex = content.indexOf(options.startMarker);
        const endIndex = content.indexOf(options.endMarker, startIndex + options.startMarker.length);
        if (startIndex === -1 || endIndex === -1) throw new Error('Markers not found.');
        content = content.substring(0, startIndex + options.startMarker.length) + contentToImplement + content.substring(endIndex);
        break;
      default:
        throw new Error('Invalid method specified.');
    }

    await fs.writeFile(path, content);
    console.log(`Content implemented successfully in ${path}.`);
  } catch (error) {
    console.error(`Failed to implement content: ${error}`);
  }
}

}

export default File;