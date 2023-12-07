import EasyAI from "@massudy/easyai";
import { fileURLToPath } from 'url';
import path from 'path';
import System from './core/System.js'
import Terminal from './core/Terminal.js'
import Framework from './core/Framework.js'
import FrameworkCompare from './core/FrameworkCompare.js'
import completeAndParseJSON from "./useful/CompleteAndParseJSON.js";

class Brain {
    constructor(config = {easyai_url : 'api.easyai.com.br',start_path : ''}){
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        
        this.Info = System()
        this.ActualPath = config.start_path || process.cwd()
        this.Main_EasyAI = new EasyAI({server_url : config.easyai_url})
        this.Terminal = Terminal
        this.Framework = async (path = this.ActualPath,config = {ignore : ['node_modules','package-lock.json'],ignoreStartsWith : ['.git']}) => {
            return await Framework(path,config)
        }
        this.FrameworkCompare = FrameworkCompare
       

    }

    async Do(prompt = 'Create a nodejs hello world',config = {}){

        const base_files = await this.Framework()

        let lasts = [{command : '',message : '',result : ''}]
        lasts.splice(0,1)

        let lasts_string = ''

        let parsed = null
        
        let command_object = {
            action : 'command',
            command : '',
            message : ''
        }

     while(command_object.action != 'stop'){

        lasts.forEach(e => {lasts_string = `${lasts_string}
Command : ${e.command} | Message : ${e.message} | Result : ${e.result}`})
        if(lasts_string){
        console.log(`Historico de Comandos : 
${lasts_string}`)}

        parsed = null

        while(parsed == null){

            let generate_response = await this.Main_EasyAI.Generate(`You are a AI that will work into a nodejs project (so the most of things will be in javascript, but can make any terminal command or write in another languages) and will recive a 'User :' objective and will analyze the context of files (initial files and actual after modifications and creation),system commands and last commands and predict the next command line in this format -> {"action":"command","command":"","message":""} with a 'FINISH' word after the json 

- Remember that you will predict only the json, nothing more than it, the text after 'AI :' tag will be only the json in the format described

The next tag <<EXAMPLE>>   <</EXAMPLE>> will demonstrate some examples, but all simple, you will need consider the files,commands and last commands to predict the next to achieve the user goal

// Example Section with Detailed Scenarios for Windows Machine
            // These examples demonstrate how the AI should handle user demands on a Windows machine, taking into account the sequence of prompts.

            // Example 1: Single Command Task
            // This shows a task achievable with one command. The AI should recognize when the task is complete.
            <<EXAMPLE>>
            User : Delete 'temp.txt'
            AI : {"action":"command","command":"del temp.txt","message":"Deleting 'temp.txt'"}FINISH
            // After execution, the AI receives updated Files Change and Last Commands
            <<FILES_CHANGE>>
            temp.txt - Deleted
            <</FILES_CHANGE>>
            <<LAST_COMMANDS>>
            - Command : del temp.txt | Message : Deleting 'temp.txt' | Result :
            <</LAST_COMMANDS>>
            // The AI interprets the changes and concludes the task.
            User : Delete 'temp.txt'
            AI : {"action":"stop","command":"","message":"File 'temp.txt' deleted successfully"}FINISH
            <</EXAMPLE>>

            // Example 2: Multi-Command Task
            // This example requires multiple steps. The AI suggests commands step-by-step until the goal is achieved.
            <<EXAMPLE>>
            User : Set up a basic server in 'server.js'
            AI : {"action":"command","command":"type NUL > server.js","message":"Creating 'server.js' file"}FINISH
            // After execution, the AI receives updated Files Change and Last Commands
            <<FILES_CHANGE>>
            server.js - New File
            <</FILES_CHANGE>>
            <<LAST_COMMANDS>>
            - Command : type NUL > server.js | Message : Creating 'server.js' file | Result :
            <</LAST_COMMANDS>>
            // The AI evaluates the changes and suggests the next step.
            User : Set up a basic server in 'server.js'
            AI : {"action":"command","command":"echo const express = require('express'); const app = express(); app.listen(3000); > server.js","message":"Adding basic server setup to 'server.js'"}FINISH
            <<FILES_CHANGE>>
            server.js - Modified
            <</FILES_CHANGE>>
            <<LAST_COMMANDS>>
            - Command : echo const express = require('express'); const app = express(); app.listen(3000); > server.js | Message : Adding basic server setup to 'server.js' | Result :
            <</LAST_COMMANDS>>
            // Finally, the AI determines that the user's goal has been met.
            User : Set up a basic server in 'server.js'
            AI : {"action":"stop","command":"","message":"Basic server in 'server.js' set up successfully"}FINISH
            <</EXAMPLE>>

            // These examples are specifically for a Windows environment. They demonstrate the AI's capability to understand the sequential nature of command execution and file changes, adapting its responses accordingly.

//Below starts a real cenario

<<SYSTEM_INFORMATION>>
System : ${this.Info.System}
Commands : ${this.Info.Commands}
- Note : cd command only will work if the next command stay in the same command line with &&, example : 'cd folder1 && .> test.js'
<</SYSTEM_INFORMATION>>

<<BASE_FILES>>
${base_files}
<</BASE_FILES>>

//This part is important to check if the goal/objective is completed and if yes set the next action to 'stop'
<<FILES_CHANGE>>
${this.FrameworkCompare(base_files,await this.Framework())}
<</FILES_CHANGE>>

//This part is important to check the last commands, to if dont stop, predict the next
<<LAST_COMMANDS>>
${lasts_string}
<</LAST_COMMANDS>>

//Analyzing all the things above, now read the User objective and predict the JSON in format {"action":"command","command":"","message":""} after te 'AI :' tag, remember that you will predict only 1 JSON and stop, nothing more, and with FINISH word after the JSON

- Remember that the only have 2 types to "action" propiety, command or stop

User : ${prompt}
AI : {"action"`,{stop : ['FINISH']})

parsed = completeAndParseJSON(generate_response.full_text)

if(parsed == null){console.log('Erro no parse, repetindo o Generate...')}

    }

//console.log(parsed)

command_object = parsed

if(command_object.action == 'command'){
    let terminalresult = await this.Terminal.Do(command_object.command)
    lasts.push({command : command_object.command,message : command_object.message,result : terminalresult})
}



}

console.log('Objetivo concluido !')



    
    }

}

export default Brain