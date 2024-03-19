import EasyAI from "@massudy/easyai"
import parseJson from '../useful/parseJson.js'
import rewriteJsonPrompt from "./prompts/rewriteJsonPrompt.js"

const Parser = async (json,config = {server_url : 'api.easyai.com.br',openai_token : '',openai : false}) => {
    if(config.openai && !config.openai_token){config.openai_token = process.env.OPENAI_TOKEN || ''}

    const easyai = new EasyAI({server_url : config.server_url,openai_token : config.openai_token})

    let result = await easyai.Generate(rewriteJsonPrompt(json),{stop : ['BFINISH'],openai : config.openai,max_tokens : 1000})
    //console.log(result)
    return parseJson(result.full_text)

}