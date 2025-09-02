// ----------------------------------------------------------------
// Tests for the parser

const mathsTests = [
    testInput(   "0.5 + 0.5"     ,   1       ),
    testInput(   ".5 + .5"       ,   1       ),
    testInput(   "2 * .25"       ,   0.5     ),
    testInput(   "10 / .5"       ,   20      ),    
    testInput(   "10 / 0.5"      ,   20      ),    
    testInput(   "+8 + -3"       ,   5       ),    
    testInput(   "5 + -3 * 2"    ,   -1      ),    
    testInput(   "10 / -2"       ,   -5      ),    
    testInput(   "10 + +3"       ,   13      ),    
    testInput(   "-6 * -2"       ,   12      ),    
    testInput(   "9 / -8"        ,   -1.125  ),    
    testInput(   "33 / .1"       ,   330     ),    
    testInput(   "33 / 0.2"      ,   165     ),    
    testInput(   "6(9)"          ,   54      ),    
    testInput(   "(5+1)(27/3)"   ,   54      ),    
    testInput(   "(9)6"          ,   54      ),   
    testInput(   "6+"            ,   "ERROR" ),    
    testInput(   "*6"            ,   "ERROR" ),    
    testInput(   "5 + -"         ,   "ERROR" ),    
    testInput(   "4 4"           ,   "ERROR" ),
]

function testInput(expression, answer) {
    return {
        expression: expression,
        answer: answer,
        result: calculator.parser.parse(expression)
    }
}

function runMathsTests(tests) {
    let failed = false;
    for (let i=0; i<tests.length; i++) {
        const test = tests[i];
        if (test.result === test.answer) {
            continue;
            // console.log(`successful test: "${test.expression}" = "${test.result}"`);
        } else {
            console.warn(`failed test: "${test.expression}"`);
            failed = true;
            break;
        }
    }

    if (!failed) {
        console.log("All maths tests succeeded.")
    }
}


runMathsTests(mathsTests);