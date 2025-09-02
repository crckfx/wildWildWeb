// calculator.js
class Calculator {
    constructor(domObject) {
        // DOM elements
        this.calculator = domObject;

        this.textArea = this.calculator.querySelector("#textArea");
        this.allowedCharacters = /^[0-9+\-*/.()^]*$/;
        this.prevInputArea = this.calculator.querySelector("#prevInputArea");

        this.parser = new Parser();

        // Calculator state
        this.cursorPosition = 0;
        this.maxHistoryCount = 5;
        this.history = [];      // add history member var
        this.historyIndex = 0;

        this.lastInput = null;
    }


    initialize() {
        // do not need to await a parser here because we instantiated it in javascript (vs. WASM)

        // Bind digit and operand buttons
        const digits = this.calculator.querySelectorAll("button.digit");
        for (let i = 0; i < digits.length; i++) {
            this.bindCharButton(digits[i]);
        }
        const operands = this.calculator.querySelectorAll("button.operand");
        for (let i = 0; i < operands.length; i++) {
            this.bindCharButton(operands[i]);
        }
        // Bind control buttons
        const controls = this.calculator.querySelectorAll("button.control");
        this.bindControlButtons(controls);

        this.textArea.addEventListener('input', () => {
            this.validateInput();
        })
        this.textArea.addEventListener('keydown', (e) => {
            switch (e.key) {
                case '=':
                case 'Enter':
                    this.submit();
                    break;
                case 'Escape':
                    this.AllClear();
                    break;
            }
        });
        this.prevInputArea.addEventListener('click', () => {
            // console.log(`you want to use an old answer hey, possibly '${this.lastInput}'`);
            this.prevInputArea.innerHTML = "";
            this.textArea.value = this.lastInput;
            this.textArea.focus();
        });

    }


    validateInput() {
        const value = this.textArea.value;
        if (!this.allowedCharacters.test(value)) {
            this.textArea.value = value.replace(/[^0-9+\-*/.()]/g, '');
        }
    }

    // no need to write a "parseExpression()" here because we use "parser.parse()" instead

    // --- UI functions ---

    // misc function to do both/either string/char
    enterInput(input) {
        //
        console.log(`INPUT (manual; misc): '${input}'`);
        this.textArea.focus();

        const initialPos = this.textArea.selectionStart;
        const newPos = initialPos + input.length;

        // Insert the character at the cursor position
        const newValue =
            this.textArea.value.slice(0, initialPos) +
            input +
            this.textArea.value.slice(initialPos);
        this.textArea.value = newValue;
        // Move the cursor position forward
        this.textArea.setSelectionRange(newPos, newPos);

        // focus the display
        this.textArea.focus();
    }

    inputLastAnswer() {
        // use the history array, instead of a "lastAnswer" variable
        const lastIndex = (this.historyIndex - 1 + this.maxHistoryCount) % this.maxHistoryCount; // 
        const h = this.history[lastIndex]; // this nearly works but crashes at index 0
        if (h && typeof h.answer === "number") {
            // guaranteed to be a number here. cast to string so it can be concatenated properly
            this.enterInput(h.answer.toString());
        }
    }

    // function to clear the input and the output
    AllClear() {
        this.clearInput();
        this.clearOutput();
        // focus the display
        this.textArea.focus();
    }

    clearInput() {
        this.textArea.value = "";
    }

    clearOutput() {
        this.prevInputArea.innerHTML = "";
    }

    doBackspace() {
        this.textArea.focus();
        const pos = this.textArea.selectionStart;
        if (pos > 0) {
            const newPos = pos - 1;
            const newInput =
                this.textArea.value.slice(0, newPos) +
                this.textArea.value.slice(pos);
            this.textArea.value = newInput;
            this.textArea.setSelectionRange(newPos, newPos);
            // focus the display
            this.textArea.focus();
        }
    }

    submit() {
        // this.textArea.focus();
        // get the string and save it
        const inputString = this.textArea.value;
        if (inputString !== "") {
            const answer = this.parser.parse(inputString);   // NOTE 2. THIS SHOULD USE THE DEFINED METHOD NOT A CLASS
            // this.prevInputArea.innerHTML = `${answer}`;
            this.prevInputArea.innerHTML = `${inputString} = ${answer}`;

            if (!isNaN(answer)) {
                this.textArea.value = `${answer}`;
                this.lastInput = inputString // save the input as last
                this.addToHistory(inputString, answer);         // add a valid answer to history
                this.printHistory();                            // display the history
                // this.prevInputArea.classList.remove('soft');       // make visuals 'real' (not 'soft')
                this.moveCursorToEnd();
                this.prevInputArea.focus();
            }
        }
    }

    softSubmit() {
        this.textArea.focus();
        const answer = this.parser.parse(this.textArea.value);
        if (!isNaN(answer)) {
            this.prevInputArea.classList.add('soft');
            this.prevInputArea.innerHTML = `${answer}`;
        } else {
            if (!this.prevInputArea.classList.contains('soft')) {
                this.prevInputArea.classList.add('soft');
            }
        }
    }

    // --- UI binding ---
    bindCharButton(button) {
        const value = button.value;
        if (button.classList.contains("digit")) {
            button.addEventListener('click', () => this.enterInput(value));
        } else if (button.classList.contains("operand")) {
            button.addEventListener('click', () => this.enterInput(value));
        } else {
            console.error(`tried to bind button of unknown type: '${value}'`);
        }
    }

    bindControlButtons(controls) {
        for (let i = 0; i < controls.length; i++) {
            const button = controls[i];
            const value = button.value;
            // bind custom string codes for UI buttons
            switch (value) {
                case 'BACKSPACE':
                    button.addEventListener('click', () => this.doBackspace());
                    break;
                case 'CLEAR':
                    button.addEventListener('click', () => this.AllClear());
                    break;
                case '=':
                    button.addEventListener('click', () => this.submit());
                    break;
                case 'ANS':
                    // button.addEventListener('click', () => this.inputLastAnswer());
                    button.addEventListener('click', () => this.inputLastAnswer());
                    break;
                case 'ARROWLEFT':
                    button.addEventListener('click', () => this.moveCursor(-1));
                    break;
                case 'ARROWRIGHT':
                    button.addEventListener('click', () => this.moveCursor(1));
                    break;
                default:
                    console.log(`UNMANAGED CONTROL VALUE ${value}`);
                    break;
            }
        }
    }

    // ******************************************************************
    // *** CURSOR **********************

    moveCursorToEnd() {
        const endPos = this.textArea.value.length;
        this.textArea.setSelectionRange(endPos, endPos);
        this.textArea.focus();     // focus the display
    }

    moveCursor(steps) {
        const currentPos = this.textArea.selectionStart;
        const newPos = currentPos + steps;
        console.log(`moveCursor: moving '${steps}' steps`);

        if (steps > 0) {
            if (this.textArea.selectionStart < this.textArea.value.length) {
                this.textArea.setSelectionRange(newPos, newPos);
            }
        }
        else if (steps < 0) {
            if (this.textArea.selectionStart > 0) {
                this.textArea.setSelectionRange(newPos, newPos);
            }
        } else {
            return;
        }
        this.textArea.focus();
    }
    // ******************************************************************

    // ******************************************************************
    // ******** HISTORY *****************    
    //
    // append the history
    addToHistory(inputString, answer) {
        if (this.history.length < this.maxHistoryCount) {
            this.history.push({ str: inputString, answer: answer });
        } else {
            // Overwrite oldest entry when full
            this.history[this.historyIndex] = { str: inputString, answer: answer };
        }
        // Update current index to the next position (circular behavior)
        this.historyIndex = (this.historyIndex + 1) % this.maxHistoryCount;
    }
    //
    // output the history
    printHistory() {
        // set a variable for the string
        let historyString = "historyString: ";
        let length = this.history.length;

        // Start from the most recent and iterate backwards
        for (let i = 0; i < length; i++) {
            // Compute the current index manually
            const index = (this.historyIndex - 1 - i + this.maxHistoryCount) % this.maxHistoryCount;
            const hi = this.history[index];
            historyString += `\n${hi.str} = ${hi.answer},`;
        }
        console.log(historyString);
    }
    // ******************************************************************
    // ********** MISC ******************
    //
    // ** FOR TESTER **
    testInput(expression, answer) {
        return {
            expression: expression,
            answer: answer,
            result: this.parser.parse(expression)
        }
    }
    // ******************************************************************

}

