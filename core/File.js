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
   * Implements content with precision into a file. This method simplifies insertion operations allowing for appending, prepending, and specific positioning.
   * @param {string} path Path to the file.
   * @param {string} contentToImplement Content to be implemented.
   * @param {Object} [options={}] Insertion options. If not specified, content is appended.
   * @param {'start' | 'end' | 'before' | 'after'} [options.position='end'] Position relative to the marker or file for the content.
   * @param {string} [options.marker] Marker indicating where to implement the content. Required if position is 'before' or 'after'.
   * @param {number} [options.index] Index at which to implement the content, overriding position if specified.
   * @returns {Promise<void>} Resolves on successful content implementation.
   */
  static async Implement(path, contentToImplement, options = {}) {
    try {
      let content = await fs.readFile(path, 'utf8');
      const { position = 'end', marker, index } = options;

      if (typeof index === 'number') {
        content = content.slice(0, index) + contentToImplement + content.slice(index);
      } else if (marker) {
        const markerIndex = content.indexOf(marker);
        if (markerIndex === -1) throw new Error('Marker not found.');

        switch (position) {
          case 'before':
            content = content.slice(0, markerIndex) + contentToImplement + content.slice(markerIndex);
            break;
          case 'after':
            content = content.slice(0, markerIndex + marker.length) + contentToImplement + content.slice(markerIndex + marker.length);
            break;
          // No default needed as 'end' will be handled next
        }
      } else if (position === 'start') {
        content = contentToImplement + content;
      } else { // Default to append at 'end'
        content += contentToImplement;
      }

      await fs.writeFile(path, content);
      console.log(`Content implemented in ${path}.`);
    } catch (error) {
      console.error(`Failed to implement content: ${error}`);
    }
  }
}

export default File;
