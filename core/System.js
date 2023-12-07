import os from 'os';

function System() {
    const platform = os.platform();

    const systemType = platform === 'win32' ? 'Windows' : 'Linux';

    // Windows Commands
    const windowsCommands = {
        'echo text > file.txt': 'Writes text to a file (overwrites existing content)',
        'echo text >> file.txt': 'Appends text to a file',
        'notepad file.txt': 'Opens the file in Notepad for editing',
        'mkdir': 'Creates a directory',
        'dir': 'Lists directory contents',
        'copy': 'Copies one or more files to another location',
        'move': 'Moves files and directories to another location',
        'del': 'Deletes one or more files',
        'md': 'Creates a directory',
        'cd': 'Displays the name of or changes the current directory',
        'cls': 'Clears the screen',
        'exit': 'Quits the CMD.EXE program (command interpreter)',
        'find': 'Searches for a text string in a file or files',
        'ipconfig': 'Displays all current TCP/IP network configuration values',
        'netstat': 'Displays active TCP connections, ports on which the computer is listening',
        'ping': 'Sends ICMP Echo Request messages to network hosts',
        'powercfg': 'Controls power settings and configures drivers',
        'reg': 'Read, set, delete keys and values in the registry',
        'tasklist': 'Displays a list of currently running processes on the local computer',
        'type': 'Displays the contents of a text file',
        'xcopy': 'Copies files and directory trees',
        'path': 'Displays or sets a search path for executable files',
        'ren': 'Renames a file or files',
        'rmdir': 'Removes a directory',
        'shutdown': 'Allows proper local or remote shutdown of machine',
        'systeminfo': 'Displays machine specific properties and configuration',
        'taskkill': 'Kill or stop a running process or application',
        'time': 'Displays or sets the system time',
        'title': 'Sets the window title for a CMD.EXE session',
        'ver': 'Displays the Windows version',
        'vol': 'Displays a disk volume label and serial number',
        'attrib': 'Displays or changes file attributes',
        'chkdsk': 'Checks a disk and displays a status report',
        'diskpart': 'Disk partition utility',
        'driverquery': 'Displays current device driver status and properties',
        // More commands can be added here
    };

    // Linux Commands
    const linuxCommands = {
        'echo "text" > file.txt': 'Writes text to a file (overwrites existing content)',
        'echo "text" >> file.txt': 'Appends text to a file',
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
        'du': 'Estimates file space usage',
        'tar': 'Archives files',
        'gzip': 'Compresses files',
        'gunzip': 'Decompresses files',
        'chmod': 'Changes file modes or Access Control Lists',
        'chown': 'Changes file owner and group',
        'ps': 'Reports a snapshot of the current processes',
        'top': 'Displays tasks',
        'kill': 'Sends a signal to a process',
        'nano': 'Easy to use, customizable text editor',
        'vi': 'Visual text editor',
        'ping': 'Sends ICMP ECHO_REQUEST to network hosts',
        'wget': 'Non-interactive network downloader',
        'curl': 'Transfers data from or to a server',
        'ssh': 'OpenSSH SSH client (remote login program)',
        'scp': 'Secure copy (remote file copy program)',
        'iptables': 'Administration tool for IPv4/IPv6 packet filtering and NAT',
        'ifconfig': 'Configures a network interface',
        'netstat': 'Prints network connections, routing tables, interface statistics',
        'uptime': 'Shows how long the system has been running',
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