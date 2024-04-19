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
   * @returns {Promise<void>} Resolves on successful file creation or rejects with error.
   */
  static async Create(path, content = '') {
    return fs.writeFile(path, content)
      .then(() => console.log(`File created: ${path}`))
      .catch(error => console.error(`Failed to create file: ${error}`));
  }

  /**
   * Edits a file with high precision, allowing for targeted replacements in files with multiple identical parts.
   * @param {string} path Path to the file.
   * @param {Array<{searchValue: string | RegExp, newValue: string, instance?: number}>} edits Edits to perform, with optional instance to target specific occurrences.
   * @returns {Promise<void>} Resolves on successful file edit or rejects with error.
   */
  static async Edit(path, edits) {
    try {
      let content = await fs.readFile(path, 'utf8');

      for (const { searchValue, newValue, instance } of edits) {
        if (typeof instance === 'number') {
          const matches = [...content.matchAll(new RegExp(searchValue, 'g'))];
          if (matches.length > instance) {
            content = content.substring(0, matches[instance].index) +
              content.substring(matches[instance].index).replace(searchValue, newValue);
          }
        } else {
          content = content.replace(new RegExp(searchValue, 'g'), newValue);
        }
      }

      await fs.writeFile(path, content);
      console.log(`File edited: ${path}`);
    } catch (error) {
      console.error(`Failed to edit file: ${error}`);
    }
  }

  /**
   * Implements content into a file with high precision, supporting advanced insertion strategies.
   * @param {string} path - The path to the file where content will be implemented.
   * @param {string} contentToImplement - The content to be inserted.
   * @param {Object} options - Configuration options for precise insertion.
   * @param {'beforeMarker'|'afterMarker'|'atIndex'|'betweenMarkers'} [options.method='atIndex'] - The method of insertion.
   * @param {string} [options.marker] - The marker for 'beforeMarker' and 'afterMarker' methods.
   * @param {string} [options.startMarker] - The start marker for 'betweenMarkers' method.
   * @param {string} [options.endMarker] - The end marker for 'betweenMarkers' method.
   * @param {number} [options.index] - The character index for 'atIndex' method.
   * @param {number} [options.instance=0] - Specifies which instance to target for multiple occurrences.
   * @param {'start'|'end'} [options.position='end'] - Specifies position relative to the marker.
   * @returns {Promise<void>} - Resolves when content has been implemented or rejects with error.
   */
  static async Implement(path, contentToImplement, options = {}) {
    try {
      let content = await fs.readFile(path, 'utf8');
      let index;

      switch (options.method) {
        case 'beforeMarker':
        case 'afterMarker':
          if (!options.marker) throw new Error('Marker is required for beforeMarker and afterMarker methods.');
          const regex = new RegExp(options.marker, 'g');
          const markers = [...content.matchAll(regex)];
          if (markers.length === 0) throw new Error('Marker not found.');

          index = markers[options.instance || 0].index;
          if (options.method === 'beforeMarker') {
            content = content.slice(0, index) + contentToImplement + content.slice(index);
          } else {
            index += options.marker.length;
            content = content.slice(0, index) + contentToImplement + content.slice(index);
          }
          break;

        case 'atIndex':
          if (options.index === undefined || options.index < 0 || options.index > content.length) {
            throw new Error('Invalid index.');
          }
          content = content.slice(0, options.index) + contentToImplement + content.slice(options.index);
          break;

        case 'betweenMarkers':
          if (!options.startMarker || !options.endMarker) throw new Error('Start and end markers are required for betweenMarkers method.');
          const start = content.indexOf(options.startMarker);
          const end = content.indexOf(options.endMarker, start + options.startMarker.length);
          if (start === -1 || end === -1) throw new Error('Markers not found.');

          content = content.slice(0, start + options.startMarker.length) + contentToImplement + content.slice(end);
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
