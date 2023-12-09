import EasyAI from "@massudy/easyai";
import rewriteJsonPrompt from "./prompts/rewriteJsonPrompt.js";
import parseJson from "./useful/parseJson.js";

class Brain {

   static async Do(goal = 'Create a nodejs hello world',config = {server_url : 'api.easyai.com.br',openai_token : '',openai : false}){

        const runpath = process.cwd()

        console.log(`Starting goal in ${runpath}`)
        
        //Possible() | Verifica se é algo tangível, não da para construir um avião só utilizando o terminal rs
        //WorkorCreate() | Define se a IA irá trabalhar em um ambiente/projeto já existente ou irá criar do zero
        //Context() | Cria um contexto para o objetivo baseado
        //Instruct() | Quebra objetivo em varias ações
        //Run() | executa a array de ações

        console.log('Objetivo Concluído !')
    }

    static async Parser(json,config = {server_url : 'api.easyai.com.br',openai_token : '',openai : false}){
        const easyai = new EasyAI({server_url : config.server_url,openai_token : config.openai_token})

        let result = await easyai.Generate(rewriteJsonPrompt(json),{stop : ['BFINISH'],openai : config.openai})
        console.log(result)
        return parseJson(result.full_text)
    }

}

export default Brain

let errorsjson = `{
    "users": [
        {"name": "Daniel", "age": 25},
        {"name": "Emily" "email": "emily@example.com", "age": 30},
        {"name": "Alex", age: "thirty-two"}
    ],
    "location": {
        "city": "New York,
        "state": "NY"
        "country": "USA"
    },
    "isActive": true,
}
`

console.log(await Brain.Parser(errorsjson))