import EasyAI from "@massudy/easyai";
import { fileURLToPath } from 'url';
import path from 'path';
import System from './core/System.js'
import Terminal from './core/Terminal.js'
import Framework from './core/Framework.js'
import FrameworkCompare from './core/FrameworkCompare.js'

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

        let command_object = {
            action : 'command',
            command : '',
            message : ''
        }

    //    while(command_object.action != 'stop'){

        lasts.forEach(e => {lasts_string = `${lasts_string}
Command : ${e.command} | Message : ${e.message} | Result : ${e.result}`})

            let generate_response = await this.Main_EasyAI.Generate(`You are a AI that will work into a nodejs project (so the most of things will be in javascript, but can make any terminal command or write in another languages) and will recive a 'User :' objective and will analyze the context of files (initial files and actual after modifications and creation),system commands and last commands and predict the next command line in this format -> {"action":"command","command":"","message":""} with a 'FINISH' word after the json 

- Remember that you will predict only the json, nothing more than it, the text after 'AI :' tag will be only the json in the format described

The next tag <<EXAMPLE>>   <</EXAMPLE>> will demonstrate some examples, but all simple, you will need consider the files,commands and last commands to predict the next to achieve the user goal

// In the example below the user want a hello world, so the response is a action to write the console.log() in a file, the message field is a description of what will be made
<<EXAMPLE>>
User : Create a simple hello world
AI : {"action":"command","command":"echo "console.log('hello world')" > index.js","message":"Writing a hello world in a index.js"}FINISH
<</EXAMPLE>>

// Lets go to another example, that will be a continuation of the example above, after it be writed, this generation will run again but with modification ok, so the next action will be of type 'stop', the result is empty because this command dont have response in terminal, but if a command has a response will show in result field
<<EXAMPLE>>
<<FILES_CHANGE>>
index.js - New File
console.log('hello world')
<</FILES_CHANGE>>

<<LAST_COMMANDS>>
- Command : echo "console.log('hello world')" > index.js | Message : Writing a hello world in a index.js | Result : 
<</LAST_COMMANDS>>

User : Create a simple hello world
AI : {"action":"stop","command":"" > index.js","message":"Hello world created successfully !"}FINISH
<</EXAMPLE>>

//Below is not more example, real aplication

<<SYSTEM_INFORMATION>>
System : ${this.Info.System}
Commands : ${this.Info.Commands}
<</SYSTEM_INFORMATION>>

<<BASE_FILES>>
${base_files}
<</BASE_FILES>>

<<FILES_CHANGE>>
${this.FrameworkCompare(base_files,await this.Framework())}
<</FILES_CHANGE>>

<<LAST_COMMANDS>>
${lasts_string}
<</LAST_COMMANDS>>

//Analyzing all the things above, now read the User objective and predict the JSON in format {"action":"command","command":"","message":""} after te 'AI :' tag, remember that you will predict only 1 JSON and stop, nothing more, and with FINISH word after the JSON

User : ${prompt}
AI : {"action"`,{stop : ['FINISH']})

     //   }

console.log(generate_response)
    
    }

}

export default Brain