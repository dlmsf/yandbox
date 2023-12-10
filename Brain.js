import EasyAI from "@massudy/easyai";
import rewriteJsonPrompt from "./prompts/rewriteJsonPrompt.js";
import parseJson from "./useful/parseJson.js";
import CompPossible from "./prompts/CompPossible.js";
import stringToBoolean from "./useful/StringToBoolean.js";

class Brain {

   static async Do(goal = 'Create a nodejs hello world',config = {server_url : 'api.easyai.com.br',openai_token : '',openai : false}){
        if(config.openai && !config.openai_token){config.openai_token = process.env.OPENAI_TOKEN || ''}

        const runpath = process.cwd()

        console.log(`Starting goal in ${runpath}`)
        
        const possible = await Brain.Possible(goal,config) // Verifica se é algo tangível, não da para construir um avião só utilizando o terminal rs
        console.log(`Possible : ${possible}`)
        
        //WorkorCreate() | Define se a IA irá trabalhar em um ambiente/projeto já existente ou irá criar do zero
        //Context() | Cria um contexto para o objetivo baseado
        //Instruct() | Quebra objetivo em varias ações
        //Run() | executa a array de ações

        console.log('Objetivo Concluído !')
    }

    static async Parser(json,config = {server_url : 'api.easyai.com.br',openai_token : '',openai : false}){
        if(config.openai && !config.openai_token){config.openai_token = process.env.OPENAI_TOKEN || ''}

        const easyai = new EasyAI({server_url : config.server_url,openai_token : config.openai_token})

        let result = await easyai.Generate(rewriteJsonPrompt(json),{stop : ['BFINISH'],openai : config.openai,max_tokens : 1000})
        //console.log(result)
        return parseJson(result.full_text)
    }

    static async Possible(goal,config = {server_url : 'api.easyai.com.br',openai_token : '',openai : false}){
        if(config.openai && !config.openai_token){config.openai_token = process.env.OPENAI_TOKEN || ''}

        const easyai = new EasyAI({server_url : config.server_url,openai_token : config.openai_token})
        
        let result = await easyai.Generate(CompPossible(goal),{stop : ['BFINISH'],openai : config.openai,max_tokens : 1000})
      
        return stringToBoolean(result.full_text)
    }

}

export default Brain