const { LLEX, Token, luaX_tokens, ENUM_TOKEN } = require('./llex')

class ASTNode
{
    constructor(ebnf, parent, token, infoDic)
    {
        this.t = Object.assign({}, token); //copy and save token
        this.ebnf = ebnf;
        this.parent = parent;
        this.childList = [];
        this.infoDic = infoDic;
    }

    addChild(chileNode)
    {
        this.childList.push(childNode);
    }

    out(str)
    {
        console.log(str);
    }

    transPrint()
    {
        switch(this.ebnf)
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


class parser
{
    constructor(lex)
    {
        this.ls = lex;

    }

    start()
    {
        this.ls.luaX_next();
        this.chunk();
    }

    testnext (c) {
        if (this.ls.t.token == c) {
            this.ls.luaX_next(ls);
            return 1;
        }
        else return 0;
    }

    localstat()
    {
        /* stat -> LOCAL NAME {`,' NAME} [`=' explist1] */

    }

    statement()
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
            if (this.testnext(ls, TK_FUNCTION))  /* local function? */
              localfunc(ls);
            else
              this.localstat();
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



    /* chunk -> { stat [`;'] } */
    chunk()
    {
        var islast = false;
        while(!islast && !this.block_follow())
        {
            islast = this.statement();
        }

    }
}

module.exports = {parser};