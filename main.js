
const fs = require('fs')
const { LLEX, Token, luaX_tokens, ENUM_TOKEN } = require('./llex')
const {Parser} = require("./parser")

function main()
{
    var filename = 'hello.lua';
    var lex = new LLEX(fs.readFileSync(filename, 'utf8'), filename);

    //lex.luaX_next();
    //console.log(lex.t.token, lex.t.ts);
    var parser = new Parser(lex);
    var ast = parser.start();
    var sourceStr = ast.visit();
    console.log(sourceStr);

}

//main();

//npm install luaparse

var parser = require('luaparse');
var ast = parser.parse('local function a() local a = 1; b=a; end');
console.log(JSON.stringify(ast, undefined, 2));
