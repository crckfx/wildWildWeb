class Parser {
    constructor() {
        this.tokens = [];
        this.position = 0;
    }

    static tokenize(input) {
        const tokens = [];
        const regex = /\s*([+\-*/()^]|\d+(\.\d*)?|\.\d+)\s*/g; // Add ^ to regex
        let match;
        while ((match = regex.exec(input)) !== null) {
            tokens.push(match[1]);
        }
        return tokens;
    }

    parse(inputString) {
        this.tokens = Parser.tokenize(inputString);
        this.position = 0;

        if (!this.tokens || this.tokens.length === 0) {
            return "ERROR";
        }

        const result = this.parseExpression();
        if (result === "ERROR" || this.position !== this.tokens.length) {
            return "ERROR";
        }
        return result;
    }

    parseExpression() {
        let value = this.parseTerm();
        if (value === "ERROR") return "ERROR";

        while (this.position < this.tokens.length) {
            const operator = this.tokens[this.position];
            if (operator === '+' || operator === '-') {
                this.position++;
                const right = this.parseTerm();
                if (right === "ERROR") return "ERROR";
                value = operator === '+' ? value + right : value - right;
            } else {
                break;
            }
        }
        return value;
    }

    parseTerm() {
        let value = this.parseFactor();
        if (value === "ERROR") return "ERROR";

        while (this.position < this.tokens.length) {
            const operator = this.tokens[this.position];
            if (operator === '*' || operator === '/') {
                this.position++;
                const right = this.parseFactor();
                if (right === "ERROR" || (operator === '/' && right === 0)) return "ERROR";
                value = operator === '*' ? value * right : value / right;
            } else {
                break;
            }
        }
        return value;
    }

    parseFactor() {
        if (this.position >= this.tokens.length) {
            return "ERROR";
        }

        let value;
        let token = this.tokens[this.position];

        // Handle unary '+' or '-' operators
        if (token === '+' || token === '-') {
            this.position++;
            const factor = this.parseFactor();
            if (factor === "ERROR") return "ERROR";
            return token === '+' ? factor : -factor;
        }
        // Handle expressions within parentheses
        else if (token === '(') {
            this.position++;
            value = this.parseExpression();
            if (value === "ERROR" || this.tokens[this.position] !== ')') {
                return "ERROR";
            }
            this.position++;

            // After parsing ')', check for implicit multiplication if appropriate
            if (this.position < this.tokens.length) {
                const nextToken = this.tokens[this.position];
                if (
                    nextToken === '(' || // Implicit multiplication for expressions like (2)(3)
                    /^\d+(\.\d*)?$/.test(nextToken) || // Implicit multiplication with numbers like (2)3
                    /^\.\d+$/.test(nextToken)
                ) {
                    const nextFactor = this.parseFactor();
                    if (nextFactor === "ERROR") return "ERROR";
                    value *= nextFactor;
                }
            }
        }
        // Handle numbers
        else if (/^\d+(\.\d*)?$/.test(token) || /^\.\d+$/.test(token)) {
            this.position++;
            value = parseFloat(token);

            // After parsing a number, check for implicit multiplication only if next token is '('
            if (this.position < this.tokens.length) {
                const nextToken = this.tokens[this.position];
                if (nextToken === '(') {
                    const nextFactor = this.parseFactor();
                    if (nextFactor === "ERROR") return "ERROR";
                    value *= nextFactor;
                }
            }
        } else {
            return "ERROR";
        }

        // Handle exponentiation
        if (this.position < this.tokens.length && this.tokens[this.position] === '^') {
            this.position++;
            const exponent = this.parseFactor();
            if (exponent === "ERROR") return "ERROR";
            value = Math.pow(value, exponent);
        }

        return value;
    }
}
