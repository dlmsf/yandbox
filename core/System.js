import os from 'os';

function System() {
    const platform = os.platform();

    const systemType = platform === 'win32' ? 'Windows' : 'Linux';

    // Windows Commands
    const windowsCommands = {
        'echo text > file.txt': 'Writes text to a file (overwrites existing content)',
        'echo text >> file.txt': 'Appends text to a file',
        'type nul > file.txt': 'Create a new file',
        'notepad file.txt': 'Opens the file in Notepad for editing',
        'mkdir': 'Creates a directory',
        'dir': 'Lists directory contents',
        'copy': 'Copies one or more files to another location',
        'move': 'Moves files and directories to another location',
        'del': 'Deletes one or more files',
        'md': 'Creates a directory',
        'cd': 'Displays the name of or changes the current directory',
        'cls': 'Clears the screen'
        // More commands can be added here
    };

    // Linux Commands
    const linuxCommands = {
        'echo "text" > file.txt': 'Writes text to a file (overwrites existing content)',
        'echo "text" >> file.txt': 'Appends text to a file',
        'touch File.js': 'Create a new file',
        'ls': 'Lists directory contents',
        'cp': 'Copies files and directories',
        'mv': 'Moves files and directories',
        'rm': 'Removes files or directories',
        'mkdir': 'Creates a directory',
        'cd': 'Changes the current directory',
        'pwd': 'Prints the current working directory',
        'cat': 'Concatenates and displays file contents',
        'echo': 'Displays message on screen',
        'grep': 'Searches for patterns in files',
        'find': 'Searches for files in a directory hierarchy',
        'df': 'Displays disk space usage',
        'du': 'Estimates file space usage'
        // More commands can be added here
    };

    const formatCommands = (commands) => {
        return Object.entries(commands)
                     .map(([command, description]) => `${command}: ${description}`)
                     .join('\n');
    };

    let commandList = '';

    if (platform === 'win32') {
        commandList = formatCommands(windowsCommands);
    } else {
        // Default to Linux commands for Linux or unknown platforms
        commandList = formatCommands(linuxCommands);
    }

    // Return an object with System and Commands properties
    return {
        System: systemType,
        Commands: commandList
    };
}

export default System