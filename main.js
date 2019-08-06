const fs = require('fs')
const { LLEX, Token, luaX_tokens, ENUM_TOKEN } = require('./llex')

function main()
{
    var filename = 'hello.lua';
    var lex = new LLEX(fs.readFileSync(filename, 'utf8'), filename);
    lex.luaX_next();
    console.log(lex.t.token, lex.t.ts);
}

main();