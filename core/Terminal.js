import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

class Terminal {
    static async Do(commandLine, config = {}) {
        const execPromise = promisify(exec);
        const options = {};

        // If a path is provided in config, set the cwd (current working directory) option
        if (config.path) {
            options.cwd = config.path;
        }

        try {
            const { stdout, stderr } = await execPromise(commandLine, options);

            // Return the output or error message
            return stdout || stderr;
        } catch (error) {
            // Handle and return the error
            return error.message;
        }
    }
}

export default Terminal