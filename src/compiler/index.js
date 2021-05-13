import { parserHTML } from './parser'
import { generate } from './generate'
export function compileToFunction(template) {
    let ast = parserHTML(template)
    let code = generate(ast)
    let render = new Function(`with(this){return ${code}}`)
    console.log('redner', render.toString())
    return render
}