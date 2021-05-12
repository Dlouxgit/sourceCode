
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名的  aa-xxx
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  aa:aa-xxx  
const startTagOpen = new RegExp(`^<${qnameCapture}`); //  此正则可以匹配到标签名 匹配到结果的第一个(索引第一个) [1]
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>  [1]
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的

// [1]属性的key   [3] || [4] ||[5] 属性的值

const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的  />    > 

export function parserHTML(html) {
    let stack = []
    let root = null
    function createASTElement(tag, attrs, parent = null) {
        return {
            tag,
            type: 1,
            children: [],
            parent,
            attrs
        }
    }
        function start(tag,attrs){ // [div,p]
        // 遇到开始标签 就取栈中的最后一个作为父节点
        let parent = stack[stack.length-1];
        let element = createASTElement(tag,attrs,parent);
        if(root == null){ // 说明当前节点就是根节点
            root = element
        }
        if(parent){
            element.parent = parent; // 跟新p的parent属性 指向parent
            parent.children.push(element);
        }
        stack.push(element)
    }
    function end(tagName) {
        let endTag = stack.pop()
        if (endTag.tag != tagName) {
            console.log('标签错误')
        }
    }

    function text(chars) {
        let parent = stack[stack.length - 1]
        chars = chars.replace(/\s/g, '')
        if (chars) {
            parent.children.push({
                type: 2, // 文本
                text: chars
            })
        }
    }

    function advance(len) {
        html = html.substring(len)
    }
    function parseStartTag() {
        const start = html.match(startTagOpen)
        if (start) {
            const match = {
                tagName: start[1],
                attrs: []
            }
            advance(start[0].length)
            let end
            let attr
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                match.attrs.push({
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5] // 属性可能为 height=1 height="1" height='1'
                })
                advance(attr[0].length)
            }
            if (end) {
                advance(end[0].length)
            }
            return match
        }
        return false
    }
    while (html) {
        let index = html.indexOf('<')
        if (index === 0) {
            const startTagMatch = parseStartTag()
            if (startTagMatch) {
                start(startTagMatch.tagName, startTagMatch.attrs)
                continue
            }
            let endTagMatch
            if (endTagMatch = html.match(endTag)) {
                end(endTagMatch[1])
                advance(endTagMatch[0].length)
                continue
            }
        }
        if (index > 0) {
            let chars = html.substring(0, index)
            text(chars)
            advance(chars.length)
        }
    }
    console.log(root)
    return root
}