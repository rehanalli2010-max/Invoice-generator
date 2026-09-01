const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
const voidElements = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr','!doctype','!--']); 

let match;
const stack = [];
let i = 0;
while ((match = regex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const isClosing = fullTag.startsWith('</');
    if (fullTag.startsWith('<!--') || fullTag.toUpperCase().startsWith('<!DOCTYPE')) continue;

    if (!isClosing && !voidElements.has(tagName) && !fullTag.endsWith('/>')) {
        stack.push({ tag: tagName, index: match.index });
    } else if (isClosing) {
        if (stack.length === 0) {
            console.log(`Extra closing ${tagName} at index ${match.index} (around line ${html.substring(0, match.index).split('\n').length})`);
        } else {
            const last = stack.pop();
            if (last.tag !== tagName) {
                 console.log(`Mismatch! Expected </${last.tag}> but found </${tagName}> at line ${html.substring(0, match.index).split('\n').length}`);
                 stack.push(last); // undo pop for basic recovery
                 // actually let's just abort
                 break;
            }
        }
    }
}
