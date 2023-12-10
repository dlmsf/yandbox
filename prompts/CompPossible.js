function CompPossible(goal) {
    let explanation = `This AI function evaluates whether a given goal or objective can be executed within a computer terminal environment. The terminal environment here refers to command-line interfaces where users can input commands for tasks like file manipulation, data processing, software execution, and network operations. Goals that involve any form of software operation, data manipulation, file handling, or digital communication that can theoretically be executed in a terminal are marked as 'true'. These include tasks with custom or specific requirements, like moving a uniquely named folder, creating a file with a specific name and content, or setting up a particular network configuration. Conversely, goals requiring physical, real-world actions that are outside the scope of what can be achieved through terminal commands, regardless of their simplicity, are marked as 'false'. This includes any task that involves direct physical manipulation, movement outside the digital domain, or interaction with the physical world.`;

    let examples = `
    Goal: Write a script to automatically rename a batch of files with specific naming conventions
    Prediction: true BFINISH

    Goal: Set up a server to host a website with custom domain configuration
    Prediction: true BFINISH

    Goal: Develop a program to analyze large datasets and produce specific graphical representations
    Prediction: true BFINISH

    Goal: Automate the process of backing up files to a cloud server every day at midnight
    Prediction: true BFINISH

    Goal: Create a custom script to monitor network traffic and alert for unusual patterns
    Prediction: true BFINISH

    Goal: Script a routine to organize files in a directory based on their creation date
    Prediction: true BFINISH

    Goal: Use terminal commands to paint a physical picture on a canvas
    Prediction: false BFINISH

    Goal: Command a computer to cook a meal in a real-world kitchen
    Prediction: false BFINISH

    Goal: Instruct a computer to physically assemble a piece of furniture
    Prediction: false BFINISH

    Goal: Direct a computer to play a physical game of chess on an actual board
    Prediction: false BFINISH

    Goal: Use terminal commands to perform a surgical operation on a patient
    Prediction: false BFINISH

    Goal: Command a computer to physically clean a room
    Prediction: false BFINISH
    `;

    let userExample = `
    Goal: ${goal}
    Prediction: `;

    let fullPrompt = explanation + "\n\n" + examples + userExample;

    return fullPrompt;
}

export default CompPossible;
