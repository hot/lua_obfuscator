const assert = require('assert');
const { LLEX, Token, luaX_tokens, ENUM_TOKEN } = require('./llex')

class ASTNode
{
    constructor(type, parent, token)
    {
        this.type = type;
        this.t = Object.assign({}, token); //copy and save token
        this.parent = parent;
        this.childList = [];
        

        //add to parent
        if(parent)parent.addChild(this);

    }

    addChild(childNode)
    {
        this.childList.push(childNode);
    }

    out(str)
    {
        console.log(str);
    }

    visit()
    {
        
    }

    transPrint()
    {
        switch(this.type)
        {
            case 'chunk':
                break;
            case 'localstat':
                this.out('local');


            case 'stat':{
                switch(this.t.token)
                {
                    case ENUM_TOKEN.TK_NAME:
                        this.out(t.token.ts);
                        break;

                    default:
                        break;

                        
                }
                break;
            }
            default:
                break;
        }
    }
}






class Parser
{
    constructor(lex)
    {
        this.ls = lex;

    }

    start()
    {
        this.ls.luaX_next();
        var root = this.chunk();
        return root;
    }

    testnext (c) {
        if (this.ls.t.token === c) {
            this.ls.luaX_next();
            return 1;
        }
        else return 0;
    }

    check(c){
        assert(this.ls.t.token === c, "expect" + c);
    }
    checknext(c){
        assert(this.ls.t.token === c, "expect" + c);
        this.ls.luaX_next();
    }

    str_checkname()
    {
        this.check(ENUM_TOKEN.TK_NAME);
        var str = this.ls.t.ts;
        this.ls.luaX_next();
        return str;
    }

    newlocvar(name)
    {
        var ret = {};
        ret.type = "Identifier";
        ret.name = name;

        return ret;
    }

    simpleexp(){
        /* simpleexp -> NUMBER | STRING | NIL | true | false | ... |
                  constructor | FUNCTION body | primaryexp */
        var ret;
        switch(this.ls.t.token)
        {
            case ENUM_TOKEN.TK_NUMBER:{
                ret = new ASTNode("NumericLiteral")
                ret.value = this.ls.t.r;
                break;
            }
            default:
                break;

        }
        

        this.ls.luaX_next();

        return ret;

    }

    subexpr(){
        var ret;
        var unopr = this.getunopr(this.ls.t.token);
        if(unopr !== 'OPR_NOUNOPR')
        {
            
        }
        else
            ret = this.simpleexp();

        var op = this.getbinopr(this.ls.t.token);
        //TODO:handle binary opr

        return ret;
    }

    expr(){
        return this.subexpr();
    }

    explist1()
    {
        var ret = [];
        /*explist1 -> expr { `,' expr } */
        var n = 1;
        var e = this.expr();
        ret.push(e);
        while(this.testnext(','))
        {
            e = this.expr();
            ret.push(e);
            n++;
        }

        return ret;


    }

    localstat(parentNode)
    {
        /* stat -> LOCAL NAME {`,' NAME} [`=' explist1] */
        
        
        var node = new ASTNode("localstat", parentNode);
        this.curNode = node;

        //parse variables
        var variables = [];
        do
        {
            var ts = this.str_checkname();
            var locvar = this.newlocvar(ts);
            variables.push(locvar);

        }while(this.testnext(','));
        
        node.variables = variables;

        //parse init        
        if(this.testnext('='))
        {
            node.init = this.explist1();
        }
        else    //just: local a
        {
            node.init = [];
        }
        

    }

    statement(node)
    {
        var line = this.ls.linenumber;  /* may be needed for error messages */
        switch (this.ls.t.token) {
            case ENUM_TOKEN.TK_IF: {  /* stat -> ifstat */
                ifstat(ls, line);
                return 0;
            }
            case ENUM_TOKEN.TK_WHILE: {  /* stat -> whilestat */
                whilestat(ls, line);
                return 0;
            }
            case ENUM_TOKEN.TK_DO: {  /* stat -> DO block END */
                luaX_next(ls);  /* skip DO */
                block(ls);
                check_match(ls, TK_END, TK_DO, line);
                return 0;
            }
            case ENUM_TOKEN.TK_FOR: {  /* stat -> forstat */
                forstat(ls, line);
                return 0;
            }
            case ENUM_TOKEN.TK_REPEAT: {  /* stat -> repeatstat */
                repeatstat(ls, line);
                return 0;
            }
            case ENUM_TOKEN.TK_FUNCTION: {
                funcstat(ls, line);  /* stat -> funcstat */
                return 0;
            }
            case ENUM_TOKEN.TK_LOCAL: {  /* stat -> localstat */
                this.ls.luaX_next();  /* skip LOCAL */
                if (this.testnext(ENUM_TOKEN.TK_FUNCTION))  /* local function? */
                  localfunc(ls);
                else
                  this.localstat(node);
                return 0;
            }
            case ENUM_TOKEN.TK_RETURN: {  /* stat -> retstat */
                retstat(ls);
                return 1;  /* must be last statement */
            }
            case ENUM_TOKEN.TK_BREAK: {  /* stat -> breakstat */
                luaX_next(ls);  /* skip BREAK */
                breakstat(ls);
                return 1;  /* must be last statement */
            }
            default: {
                exprstat(ls);
                return 0;  /* to avoid warnings */
            }
        }
    }

    block_follow () 
    {
        switch (this.ls.t.token) {
            case ENUM_TOKEN.TK_ELSE: case ENUM_TOKEN.TK_ELSEIF: case ENUM_TOKEN.TK_END:
            case ENUM_TOKEN.TK_UNTIL: case ENUM_TOKEN.TK_EOS:
            return 1;
            default: return 0;
        }
    }

    getunopr (op) {
        switch (op) {
          case ENUM_TOKEN.TK_NOT: return "OPR_NOT";
          case '-': return 'OPR_MINUS';
          case '#': return 'OPR_LEN';
          default: return 'OPR_NOUNOPR';
        }
    }

    getbinopr (op) {
        switch (op) {
            case '+': return 'OPR_ADD';
            case '-': return 'OPR_SUB';
            case '*': return 'OPR_MUL';
            case '/': return 'OPR_DIV';
            case '%': return 'OPR_MOD';
            case '^': return 'OPR_POW';
            case ENUM_TOKEN.TK_CONCAT: return 'OPR_CONCAT';
            case ENUM_TOKEN.TK_NE: return 'OPR_NE';
            case ENUM_TOKEN.TK_EQ: return 'OPR_EQ';
            case '<': return 'OPR_LT';
            case ENUM_TOKEN.TK_LE: return 'OPR_LE';
            case '>': return 'OPR_GT';
            case ENUM_TOKEN.TK_GE: return 'OPR_GE';
            case ENUM_TOKEN.TK_AND: return 'OPR_AND';
            case ENUM_TOKEN.TK_OR: return 'OPR_OR';
            default: return 'OPR_NOBINOPR';
        }
    }
      
      
      

      



    /* chunk -> { stat [`;'] } */
    chunk()
    {
        var node = new ASTNode('chunk')
        var islast = false;
        while(!islast && !this.block_follow())
        {
            islast = this.statement(node);
        }

        return node;

    }
}

module.exports = {Parser};