import EasyAI from "@massudy/easyai";
import { fileURLToPath } from 'url';
import path from 'path';
import System from './core/System.js'
import Terminal from './core/Terminal.js'
import Framework from './core/Framework.js'

class Brain {
    constructor(config = {easyai_url : 'api.easyai.com.br',start_path : ''}){
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        
        this.Info = System()
        this.ActualPath = config.start_path || __dirname
        this.Main_EasyAI = new EasyAI({server_url : config.easyai_url})
        this.Terminal = Terminal
        this.Framework = async (path = this.ActualPath,config = {ignore : ['node_modules'],ignoreStartsWith : ['.git']}) => {
            return await Framework(path,config)
        }
       

    }

    Do(prompt = 'Create a nodejs hello world',config = {}){
        console.log('Hello World')
    }

}

export default Brain