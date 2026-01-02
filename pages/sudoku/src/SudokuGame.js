import { H_NEIGHBOUR, H_NONE, H_SAME_NUMBER, H_SELECTED, neighboursOf, STATUS_CORRECT, STATUS_EMPTY, STATUS_ERROR, STATUS_GIVEN } from "./static.js";

export class SudokuGame {
    constructor({ recordHistory = true } = {}) {
        this.helloWorld = "hi friend";

        this.historyPos = 0;
        this.gameHistory = [];

        this.currentCell = null; // <-- the main pointer guy for the game
        this.mistakesMade = 0;

        this.currentPuzzle = null;

        // ARRAYS (they're all length 81 because sudoku has 81 cells)
        this.cells = new Uint8Array(81).fill(0);       // for the evolving board state
        this.solution = new Uint8Array(81);            // for the solution values
        this.givens = new Uint8Array(81);              // for "is this cell's value provided in the initial puzzle state?"
        this.cellStatus = new Uint8Array(81);          // for "what colour to render the text in this cell?"
        this.highlightStatus = new Uint8Array(81);     // for "what colour to render the background for this cell"

        this.recordHistory = recordHistory;

        this.onWin = null;
        this.onUpdate = null;
        this.onUndo = null;
        this.onRedo = null;
        
        this.startedAt = null;
        this.completedAt = null;

    }


    addToHistory(cell, oldValue, newValue) {
        const currentPos = this.historyPos;

        this.gameHistory[currentPos] = { cell, oldValue, newValue };

        console.log(`history write ${currentPos}: cell:${cell}, old:${oldValue}, new:${newValue}`);
        this.historyPos++;
    }


    // GAME OPEN PUZZLE (FOR REAL PLAYING)
    miscOpenPuzzle(puzzle) {
        this.currentCell = 0;

        // --- baseline load (mission/solution) ---
        const mission = puzzle.mission;
        const sol = puzzle.solution;



        this.mistakesMade = 0;
        this.historyPos = 0;
        this.gameHistory = [];

        this.startedAt = Date.now();

        for (let i = 0; i < 81; i++) {
            const mval = mission.charCodeAt(i) - 48;
            const sval = sol.charCodeAt(i) - 48;

            this.solution[i] = sval;

            if (mval === 0) {
                this.cells[i] = 0;
                this.givens[i] = 0;
                this.cellStatus[i] = STATUS_EMPTY;
            } else {
                this.cells[i] = mval;
                this.givens[i] = 1;
                this.cellStatus[i] = STATUS_GIVEN;
            }
        }

        this.currentPuzzle = puzzle;
        // printMistakes(); // <-- this should not be the concern of game; maybe an emission to UI instead?
        // updatepuzzleNumDisplay(); // <-- again, likely output a signal to the UI?

        this.computeGameState();
        return true;
    }



    computeGameState() {
        const highlightStatus = this.highlightStatus;
        const currentCell = this.currentCell;
        const cells = this.cells;

        highlightStatus.fill(H_NONE);
        if (currentCell === null) return;
        const selectedVal = this.cells[currentCell];

        // selected cell
        highlightStatus[currentCell] = H_SELECTED;

        // 2. neighbours (once)
        const nbs = neighboursOf[currentCell];
        for (let i = 0; i < nbs.length; i++) {
            const idx = nbs[i];
            highlightStatus[idx] = H_NEIGHBOUR;
        }

        // 3. matching numbers elsewhere
        if (selectedVal !== 0) {
            for (let i = 0; i < 81; i++) {
                if (i !== currentCell && cells[i] === selectedVal) {
                    highlightStatus[i] = H_SAME_NUMBER;
                }
            }
        }

    }


    // nota  "do render" thing anymore now that we're doing classmode
    selectCell(num) {
        if (num < 0 || num > 80) return;
        const oldCell = this.currentCell;
        if (num !== oldCell) {
            this.currentCell = num;
            // console.log(`fresh select on ${coords.col}, ${coords.row}`);
        }
        this.computeGameState();

    }

    updateCellValue(cellNumber, value) {
        const oldValue = this.cells[cellNumber]; // store the existing value
        if (value === oldValue) return; // exit if the value didn't change
        // overwrite value
        this.cells[cellNumber] = value;

        if (this.recordHistory) this.addToHistory(cellNumber, oldValue, value)



        // detect mistake (CRUDELY - checking against the real answer; a finer way would be to check against the current board state for contradiction)
        const status = this.applyStatus(cellNumber, value);
        this.cellStatus[cellNumber] = status;
        if (status === STATUS_ERROR) {
            this.mistakesMade++;
            // printMistakes();
        }

        this.computeGameState();

        const solved = this.checkSolved();

        // if (solved) this.setFinished(); // mark internally; do nothing much with it
        if (solved) this.completedAt = Date.now(); 

        // ping game write update (if it exists)
        if (this.onUpdate) this.onUpdate({ solved, cell: cellNumber, value, mistakesMade: this.mistakesMade });
    }

    redo() {
        if (this.historyPos >= this.gameHistory.length) return;

        const { cell, newValue } = this.gameHistory[this.historyPos]; // take the current position because it stays one ahead ?

        this.cells[cell] = newValue;
        this.cellStatus[cell] = this.applyStatus(cell, newValue);

        this.historyPos++;
        this.selectCell(cell);

        // ping game redo update (if it exists)
        if (this.onRedo) this.onRedo({ historyPos: this.historyPos });
    }


    undo() {
        if (this.historyPos < 1) return;

        const undoToHistoryPos = this.historyPos - 1;
        const { cell, oldValue, newValue } = this.gameHistory[undoToHistoryPos];
        // console.log(`undo: ${cell} from ${newValue} to ${oldValue}`);

        // overwrite value
        this.cells[cell] = oldValue;
        this.historyPos--;

        this.cellStatus[cell] = this.applyStatus(cell, oldValue);

        this.selectCell(cell);

        // ping game undo update (if it exists)
        if (this.onUndo) this.onUndo({ historyPos: this.historyPos });
    }

    // setFinished() {
    //     console.log("do you need an implementation for setFinished within Game?")
    // }

    applyStatus(cell, val) {
        if (val === 0) return STATUS_EMPTY;
        return val === this.solution[cell] ? STATUS_CORRECT : STATUS_ERROR;
    }

    checkSolved() {
        const cells = this.cells;
        const solution = this.solution;
        for (let i = 0; i < 81; i++) {
            if (cells[i] !== solution[i]) {
                return false;
            }
        }
        return true;
    }

    // triggerGameEnd() {
    //     console.log("game end triggered from SudokuGame.js");

    //     if (this.onWin !== null) {
    //         this.onWin();
    //     }
    // }

    // -- RESTORE HISTORY --
    //  expects a 'saved' object to contain:
    //      - runtimeHistory
    //      - historyPos 
    //      - mistakes (a simple count)

    restoreHistory(saved) {
        this.gameHistory = saved.runtimeHistory;
        this.historyPos = saved.historyPos;

        // // clear board to mission first
        // this.resetToMission();

        // replay only up to playhead
        for (let i = 0; i < this.historyPos; i++) {
            const { cell, newValue } = this.gameHistory[i];
            this.cells[cell] = newValue;
            this.cellStatus[cell] = this.applyStatus(cell, newValue);
        }

        this.mistakesMade = saved.mistakes;
    }

    getBoardAsString() {
        let str = "";
        for (let i=0; i<81; i++) {
            str += this.cells[i];
        }

        return str;
    }

}