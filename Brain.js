import EasyAI from "@massudy/easyai";
import rewriteJsonPrompt from "./prompts/rewriteJsonPrompt.js";
import parseJson from "./useful/parseJson.js";
import CompPossible from "./prompts/CompPossible.js";
import stringToBoolean from "./useful/StringToBoolean.js";

class Brain {

   static async Do(goal = 'Create a nodejs hello world',config = {server_url : 'api.easyai.com.br',openai_token : '',openai : false}){
        if(config.openai && !config.openai_token){config.openai_token = process.env.OPENAI_TOKEN || ''}

        // !!!!!!!!!!! interessante o do vim com StructurePrompt : <> | CodePrompt : <>


        let objreturn = {
            done : false,
            message : ''
        }
        const runpath = process.cwd()

        console.log(`Starting goal in ${runpath}`)
        
        const possible = await Brain.Possible(goal,config) // Verifica se é algo tangível, não da para construir um avião só utilizando o terminal rs
        console.log(`Possible : ${possible}`)

        if(possible){


        //const structurerun = await StructureRun() // carrega o prompt para gerar a array de ações que vai gerar a estrutura
        //StructureAction(structurrun)
        // O Generate do Code já vai ter toda a filetree e framework completo e a array de structure que foi feita as ações para definir o que vai ser criado de código
        //const coderun = await CodeRun() // carrega o prompt + framework + filetree + struture run e gera a array de ações de código {prompt : <>,exist : <boolean>}, onde serão  
        /*
        forEach(e => {

        })
        SearchExamples()
        */



        //WorkType() | Define se a IA irá trabalhar em um ambiente/projeto já existente ou irá criar do zero
        //Context() | Cria um contexto para o objetivo baseado
        //Instruct() | Quebra objetivo em varias ações
        //Run() | executa a array de ações

            objreturn.done = true
            console.log('Objetivo Concluído !')
        } else {
            console.log('Não foi possível concluir o objetivo')
            objreturn.message = 'Objetivo não é computacionalmente possível'
        }

        return objreturn
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