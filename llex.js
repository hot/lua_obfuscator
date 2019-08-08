const assert = require('assert');

var EOZ = -1;

/* ORDER RESERVED */
const luaX_tokens = {
    "and" : 'TK_AND', "break" : 'TK_BREAK', "do" : "TK_DO", "else" : "TK_ELSE", "elseif" : "TK_ELSEIF",
    "end" : "TK_END", "false" : "TK_FALSE", "for": "TK_FOR", "function": "TK_FUNCTION", "if": "TK_IF",
    "in": "TK_IN", "local": "TK_LOCAL", "nil": "TK_NIL", "not": "TK_NOT", "or": "TK_OR", "repeat": "TK_REPEAT",
    "return": "TK_RETURN", "then": "TK_THEN", "true": "TK_TRUE", "until": "TK_UNTIL", "while": "TK_WHILE",
    "..": "TK_CONCAT", "...": "TK_DOTS", "==": "TK_EQ", ">=": "TK_GE", "<=": "TK_LE", "~=": "TK_NE",
    "<number>": "TK_NUMBER", "<name>": "TK_NAME", "<string>": "TK_STRING", "<eof>": "TK_EOS"
};


const ENUM_TOKEN = {
    TK_AND : 257,
    TK_BREAK : 258,

    TK_DO : 259,
    TK_ELSE : 260,
    TK_ELSEIF : 261,
    TK_END : 262,
    TK_FALSE : 263,
    TK_FOR : 264,
    TK_FUNCTION : 265,

    TK_IF : 266,
    TK_IN : 267,
    TK_LOCAL : 268,
    TK_NIL : 269,
    TK_NOT : 270,
    TK_OR : 271,
    TK_REPEAT : 272,

    TK_RETURN : 273,
    TK_THEN : 274,
    TK_TRUE : 275,
    TK_UNTIL : 276,
    TK_WHILE : 277,

    TK_CONCAT : 278,
    TK_DOTS : 279,
    TK_EQ : 280,
    TK_GE : 281,
    TK_LE : 282,
    TK_NE : 283,
    TK_NUMBER : 284,

    TK_NAME : 285,
    TK_STRING : 286,
    TK_EOS : 287
}




class Token
{
    constructor()
    {
        this.token = ENUM_TOKEN.TK_EOS;
        this.ts = '';
        this.r = 0;
    }

}

//tool functions
Utils =
{
    currIsNewline: function(charNow)
    {
        return charNow == '\n' || charNow == '\r';
    },
    isdigit:function(c)
    {        
        return ("0123456789".indexOf(c) != -1);
    },
    isalpha:function(c)
    {
        return ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c) != -1);
    },
    isAlphaNum:function(c) {
        return ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".indexOf(c) != -1);
    },
    isspace:function(c){
        return (" \t\n\v\f\r".indexOf(c) != -1);
    }
    
}



class LLEX
{
    constructor(fd, source)
    {
        this.fileStr = fd;
        this.current = '';                  //当前字符
        this.linenumber = 1;                //当前行号
        this.lastline = 1;                  //上一个token的行号
        this.t = new Token();               //当前token
        this.lookahead = new Token();       //前瞻token
        this.lookahead.token = ENUM_TOKEN.TK_EOS;
        this.buff = '';                     //token字符缓冲
        this.source = source;               //源码名字
        this.decpoint = '.';                //逻辑小数点
        console.log(">>>>llex construction");

        //init
        this.next();
    }

    //start tool func area
    resetbuffer()
    {
        this.buff = '';
    }

    check_next(setStr)
    {
        
        if(setStr.indexOf(this.current) == -1)
            return false;
        this.save_and_next();
        return true;

    }

    next()
    {
        this.current = this.fileStr[0];
        this.fileStr = this.fileStr.slice(1);
        if(this.current === undefined)
            this.current = EOZ;
    }

    save(c)
    {
        this.buff +=c;
    }

    save_and_next()
    {
        this.save(this.current);
        this.next();
    }

    
    skip_sep(){
        var count = 0;
        var s = this.current;
        assert(s === '[' || s === ']');
        this.save_and_next();
        while(this.current === '='){
            this.save_and_next();
            count++;
        }
        return this.current == s ? count : (-count) -1;
        
    }


    inclinenumber()
    {
        var old = this.current;
        assert(Utils.currIsNewline(this.current));
        this.next();
        if(Utils.currIsNewline(this.current) && this.current != old)
            this.next();
        if(++this.linenumber >= Number.MAX_SAFE_INTEGER)
            this.luaX_syntaxerror("chunk has too many lines");
        
    }

    //end tool func area

    read_numeral()
    {
        assert(Utils.isdigit(this.current));
        do{
            this.save_and_next();
        } while(Utils.isdigit(this.current) || this.current == '.');
        if(this.check_next('Ee'))
            this.check_next('+-');
        while(Utils.isAlphaNum(this.current) || this.current == '_')
            this.save_and_next();
        //TODO:follow locale for decimal point
        var num = parseInt(this.buff);
        if(isNaN(num))
            num = parseFloat(this.buff);

        if(isNaN(num))
            this.luaX_lexerror("malformed number")

        this.t.r = num;

    }

        


        
    

    read_long_string(bLongString, sep)
    {
        var cont = 0;
        this.save_and_next();
        if(Utils.currIsNewline(this.current))
            this.inclinenumber();
        loop1:
        for(;;){
            switch(this.current){
                case EOZ:
                    this.luaX_lexerror(bLongString?"unfinished long string":"unfinished long comment");
                
                    break;
                case '[':{
                    if(this.skip_sep(ls) == sep){
                        this.save_and_next();
                        cont++;
                        if(sep == 0)
                            this.luaX_lexerror("nesting of [[...]] is deprecated", '[')
                    }
                    break;

                }
                case ']':{
                    if(this.skip_sep() == sep){
                        this.save_and_next();
                        break loop1;
                    }
                    break;
                }
                case '\n':
                case '\r':{
                    this.save(ls, '\n');
                    this.inclinenumber();
                    if(!bLongString)this.resetbuffer();
                    break;
                }
                default:{
                    if(bLongString)this.save_and_next();
                    else this.next();
                }
            }
        }

        if(bLongString)
            this.t.ts = this.buff.slice(2+sep, this.buff.length-(2+sep));
    }

    read_string(del)
    {
        this.save_and_next();
        while(this.current != del)
        {
            switch(this.current){
                case EOZ:
                    this.luaX_lexerror("unfinished string");
                    //continue;
                case '\n':
                case '\r':
                    this.luaX_lexerror("unfinished string");
                    //continue;
                case '\\':{
                    var c;
                    this.next();
                    switch(this.current){
                        case 'a':c = '\a';break;
                        case 'b':c = '\b';break;
                        case 'f':c = '\f';break;
                        case 'n':c = '\n';break;
                        case 't':c = '\t';break;
                        case 'v':c = '\v';break;
                        case '\n':
                        case '\r':this.save(ls, '\n');this.inclinenumber();continue;
                        case EOZ:continue;
                        default:{
                            if(!Utils.isdigit(this.current))
                                this.save_and_next();
                            else{
                                //TODO:\xxx字符解析
                            }
                            continue;
                        }
                    }
                    this.save(c);
                    this.next();
                    continue;
                }
                default:
                    this.save_and_next();
            }
            
        }
        this.save_and_next();
        this.t.ts = this.buff.slice(1, this.buff.length - 1);
    }

    //开始实际解析token
    llex()
    {
        this.resetbuffer();
        for(;;)
        {
            switch(this.current)
            {
                case '\n':
                case '\r':
                    {
                        this.inclinenumber();
                        continue;
                    }
                case '-':   //handle comment
                    this.next();
                    if(this.current != '-') return '-';
                    this.next();
                    if(this.current === '['){
                        var sep = this.skip_sep();
                        this.resetbuffer();
                        if(sep >=0){
                            this.read_long_string(false, sep);
                            this.resetbuffer();
                            continue;
                        }
                    }
                    //short comment
                    while(!Utils.currIsNewline(this.current) && this.current != EOZ)
                        this.next(ls);
                    
                    continue;

                case '[':{
                    var sep = this.skip_sep();
                    if(sep >=0){
                        this.read_long_string(true, sep);
                        return ENUM_TOKEN.TK_STRING;
                    }
                    else if(sep == -1) return '[';
                    else this.luaX_lexerror("invalid long string delimiter");
                }
                case '=':{
                    this.next();
                    if(this.current != '=') return '=';             //=
                    else {this.next(); return ENUM_TOKEN.TK_EQ;}    //==

                }
                case '<':{
                    this.next(ls);
                    if(this.current != '=') return '<';
                    else {this.next(); return ENUM_TOKEN.TK_LE;}
                }
                case '>':{
                    this.next(ls);
                    if(this.current != '=') return '>';
                    else {this.next(); return ENUM_TOKEN.TK_GE;}
                }
                case '~':{
                    this.next(ls);
                    if(this.current != '=') return '~';
                    else {this.next(); return ENUM_TOKEN.TK_NE;}
                }
                case '"':
                case "'":{
                    this.read_string(this.current);
                    return ENUM_TOKEN.TK_STRING;
                }
                case '.':{
                    this.save_and_next();
                    if(this.check_next(".")){
                        if(this.check_next("."))
                            return ENUM_TOKEN.TK_DOtS;
                        else return ENUM_TOKEN.TK_CONCAT;
                    }
                    else if(!Utils.isdigit(this.current)) return '.';
                    else{
                        //TODO:
                        this.read_numeral();
                        return ENUM_TOKEN.TK_NUMBER;
                    }
                }
                case EOZ:{
                    return ENUM_TOKEN.TK_EOS;
                }
                default:{
                    if(Utils.isspace(this.current)){
                        assert(!Utils.currIsNewline(this.current));
                        this.next();
                        continue;
                    }
                    else if(Utils.isdigit(this.current)){
                        this.read_numeral()
                        return ENUM_TOKEN.TK_NUMBER;
                    }
                    else if(Utils.isalpha(this.current) || this.current == '_'){
                        var ts;
                        do{
                            this.save_and_next();
                        }while(Utils.isAlphaNum(this.current) || this.current == '_');
                        ts = this.buff;
                        if(ts in luaX_tokens)      //check if is reversed word
                            return ENUM_TOKEN[luaX_tokens[ts]]; 
                        else{
                            this.t.ts = ts;
                            return ENUM_TOKEN.TK_NAME;
                        }
                    }
                    else{
                        var c = this.current;
                        this.next();
                        return c;
                    }
                }
                

            }
        }
    

    }


    luaX_syntaxerror(msg)
    {
        this.luaX_lexerror(msg, this.t);
    }
    luaX_lexerror(msg, token)
    {
        //TODO:fix this
        assert(false, msg);
    }

    luaX_next()
    {
        this.lastline = this.linenumber;
        if(this.lookahead.token != ENUM_TOKEN.TK_EOS){
            this.t = this.lookahead;
            this.lookahead.token = ENUM_TOKEN.TK_EOS;
        }
        else
        {
            this.t.token = this.llex();
        }

    }

}

module.exports = { LLEX, Token, luaX_tokens, ENUM_TOKEN };

//var l = new llex();

//assert(1===2, "not equal")
//console.log(Utils.currIsNewline('\n'))

//console.log('TK_END' in ENUM_TOKEN, ENUM_TOKEN["TK_END"])