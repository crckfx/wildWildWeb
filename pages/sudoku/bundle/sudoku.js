const canvas = document.getElementById('sudokuCanvas');
const ctx = canvas.getContext('2d');
const mistakesDisplay = document.querySelector('.data')?.querySelector('.mistake');
const numpad = document.querySelector('#numpad');
const numpadWrapper = document.querySelector('.numpad-wrapper');
const numpadItems = numpadWrapper.querySelectorAll('.numpad-item');

// -------- SIZING -----------
let size = 480; // default (currently 'max') canvas size

let cell = size / 9; // full grid is 9×9
setGameSize();


import { puzzles } from "./puzzles.js";
import * as storage from "./storage.js";
// some junk about storage
let currentPuzzleID = null;
let currentPuzzleIsCompleted = false;

// thicknesses
const thin = 1;
const thick = 2;


// STATUSES
const STATUS_EMPTY = 0;
const STATUS_GIVEN = 1;
const STATUS_CORRECT = 2;
const STATUS_ERROR = 3;

// highlight states (visual only)
const H_NONE = 0;
const H_SELECTED = 1;
const H_NEIGHBOUR = 2;
const H_SAME_NUMBER = 3;

// COLOURS
function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
const selectedCellColor = cssVar("--selectedCellColor");
const neighbourCellColor = cssVar("--neighbourCellColor");
const sameNumberCellColor = cssVar("--sameNumberCellColor");
const gridPrimaryColor = cssVar("--gridPrimaryColor");
const gridSecondaryColor = cssVar("--gridSecondaryColor");
const givenNumberColor = cssVar("--givenNumberColor");
const userNumberColor = cssVar("--userNumberColor");
const errorNumberColor = cssVar("--errorNumberColor");
const sudokuCanvasBg = cssVar("--sudokuCanvasBg");




// ******************************************************
// --------------- GAME ---------------
// ARRAYS (they're all length 81 because sudoku has 81 cells)
const cells = new Uint8Array(81).fill(0);       // for the evolving board state
const solution = new Uint8Array(81);            // for the solution values
const givens = new Uint8Array(81);              // for "is this cell's value provided in the initial puzzle state?"
const cellStatus = new Uint8Array(81);          // for "what colour to render the text in this cell?"
const highlightStatus = new Uint8Array(81);     // for "what colour to render the background for this cell"
const coords = new Array(81);                   // for a precomputed lookup of "index->coords(as x,y)""
for (let i = 0; i < 81; i++) {
    coords[i] = cellToCoords(i);
}
// HISTORY (a 'playhead' position and array of history objects: {cell, oldValue, newValue} )
let historyPos = 0;
let gameHistory = [];


let currentCell = null; // <-- the main pointer guy for the game
let mistakesMade = 0;

const completedDigits = new Uint8Array(9); // for the digits who have all been solved

function openPuzzleById(id) {

    const puzzle = puzzles.find(p => p.id == id);
    if (!puzzle) {
        console.error(`couldn't find puzzle id:${id}`);
        return;
    }

    currentPuzzleIsCompleted = false;
    currentPuzzleID = id;
    currentCell = 0;

    const saved = storage.loadPuzzleState(id);
    storage.setActivePuzzleID(id);

    // --- baseline load (mission/solution) ---
    const mission = puzzle.mission;
    const sol = puzzle.solution;

    mistakesMade = 0;
    historyPos = 0;
    gameHistory = [];

    for (let i = 0; i < 81; i++) {
        const mval = mission.charCodeAt(i) - 48;
        const sval = sol.charCodeAt(i) - 48;

        solution[i] = sval;

        if (mval === 0) {
            cells[i] = 0;
            givens[i] = 0;
            cellStatus[i] = STATUS_EMPTY;
        } else {
            cells[i] = mval;
            givens[i] = 1;
            cellStatus[i] = STATUS_GIVEN;
        }
    }

    // --- overlay saved history if present ---
    if (saved) {

        const savedHistory = saved.history;
        const savedPos = saved.historyPos;

        gameHistory = rebuildRuntimeHistory(savedHistory, mission, savedPos);
        historyPos = savedPos;

        // restore history into cells (full replay)
        for (let i = 0; i < historyPos; i++) {
            const { cell, newValue } = gameHistory[i];
            cells[cell] = newValue;
        }

        mistakesMade = saved.mistakes;

        if (saved.completedAt !== null) {
            triggerGameEnd();
        }

    } else {
        storage.startPuzzle(puzzle);
    }


    printMistakes();


    computeGameState();
}


function computeGameState() {
    
    if (currentPuzzleIsCompleted) {
        drawFinishedSudoku();
        return;
    }
    
    highlightStatus.fill(H_NONE);
    if (currentCell === null) return;
    const selectedVal = cells[currentCell];

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

    drawSudoku();

}

// internal game function
function checkSolved() {
    for (let i = 0; i < 81; i++) {
        if (cells[i] !== solution[i]) {
            return false;
        }
    }
    return true;
}


// simple string print of state (not exactly 'mission progress')
function getMissionProgress() {
    let progress = "";
    for (let i = 0; i < cells.length; i++) {
        progress += cells[i];
    }
    return progress;
}

function triggerGameEnd() {
    console.log("game's finished");
    currentCell = null;
    // drawFinishedSudoku();
    currentPuzzleIsCompleted = true;
}
// 

// receive input for game (from DOM but not touching it)
function inputFromNumpad(n) {
    if (currentCell !== null && !givens[currentCell]) {
        updateCellValue(currentCell, n);
    }
}

// game helpers
function updateCellValue(cell, value) {
    if (currentPuzzleIsCompleted) return;
    // determine if a real write call is made by this 
    const oldValue = cells[cell]; // store the existing value
    if (value === oldValue) return; // exit if the value didn't change
    // overwrite value
    cells[cell] = value;


    addToHistory(cell, oldValue, value)

    // console.log(`made move, cell: ${cell}, oldValue: ${oldValue}, newValue: ${value}`)
    // detect mistake (CRUDELY - checking against the real answer; a finer way would be to check against the current board state for contradiction)
    if (value === 0) {
        cellStatus[cell] = STATUS_EMPTY;
    } else if (value !== solution[cell]) {
        cellStatus[cell] = STATUS_ERROR;
        mistakesMade++;
        printMistakes();
    } else {
        cellStatus[cell] = STATUS_CORRECT;
    }

    const solved = checkSolved();
    // console.log(`updateCellValue: solved = ${solved}`);

    if (solved) {
        triggerGameEnd();
        // write with the 'completed = true' param     
        if (currentPuzzleID !== null) storage.saveMove(currentPuzzleID, cell, value, mistakesMade, true); // storage 
    } else {
        if (currentPuzzleID !== null) storage.saveMove(currentPuzzleID, cell, value, mistakesMade); // storage 
    }
    // call main render
    computeGameState();
}

function cellToCoords(cellNumber) {
    const row = (cellNumber / 9) | 0;
    const col = cellNumber % 9;
    return { row, col }
}


// sort of a "do render" thing; it's not super clear yet
function selectCell(num) {
    if (currentPuzzleIsCompleted || num < 0 || num > 80) return;
    const oldCell = currentCell;
    if (num !== oldCell) {
        currentCell = num;
        // console.log(`fresh select on ${coords.col}, ${coords.row}`);
    }
    computeGameState();

}

const neighboursOf = Array.from({ length: 81 }, () => []);

function precomputeNeighbours() {
    for (let i = 0; i < 81; i++) {
        const row = (i / 9) | 0;   // fast floor
        const col = i - row * 9;

        const rowStart = row * 9;

        // mark duplicates once only
        const mask = new Uint8Array(81);

        // --- row ---
        for (let c = 0; c < 9; c++) {
            const idx = rowStart + c;
            if (idx !== i) mask[idx] = 1;
        }

        // --- column ---
        for (let r = 0; r < 9; r++) {
            const idx = r * 9 + col;
            if (idx !== i) mask[idx] = 1;
        }

        // --- box ---
        const boxRow = row - (row % 3);
        const boxCol = col - (col % 3);

        for (let r = boxRow; r < boxRow + 3; r++) {
            const base = r * 9;
            for (let c = boxCol; c < boxCol + 3; c++) {
                const idx = base + c;
                if (idx !== i) mask[idx] = 1;
            }
        }

        // convert mask → neighbour list
        for (let idx = 0; idx < 81; idx++) {
            if (mask[idx]) neighboursOf[i].push(idx);
        }
    }
}


function addToHistory(cell, oldValue, newValue) {
    const currentPos = historyPos;

    gameHistory[currentPos] = { cell, oldValue, newValue };

    console.log(`history write ${currentPos}: cell:${cell}, old:${oldValue}, new:${newValue}`);
    historyPos++;
}

function undo() {
    if (currentPuzzleIsCompleted) return;
    if (historyPos < 1) return;
    const undoToHistoryPos = historyPos - 1;
    const { cell, oldValue, newValue } = gameHistory[undoToHistoryPos];
    console.log(`undo: ${cell} from ${newValue} to ${oldValue}`);

    // overwrite value
    cells[cell] = oldValue;
    historyPos--;

    if (currentPuzzleID !== null) storage.saveUndo(currentPuzzleID, historyPos, mistakesMade); // storage

    // text colour junk
    if (oldValue === 0) {
        cellStatus[cell] = STATUS_EMPTY;
    } else if (oldValue !== solution[cell]) {
        cellStatus[cell] = STATUS_ERROR;
        // mistakesMade++;
        // printMistakes();
    } else {
        cellStatus[cell] = STATUS_CORRECT;
    }

    selectCell(cell);


}

// ******************************************************
// --------------- DRAWING ---------------
// generic canvas helpers
function drawLine(x1, y1, x2, y2, w) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// specific canvas helpers
function drawGridLines() {
    // draw thin lines
    ctx.strokeStyle = gridSecondaryColor;
    for (let i = 1; i < 9; i++) {
        if (i % 3 !== 0) {
            const pos = cell * i;
            // horizontal
            drawLine(0, pos, size, pos, thin);
            // vertical
            drawLine(pos, 0, pos, size, thin);
        }
    }
    // draw thick lines over top
    ctx.strokeStyle = gridPrimaryColor;
    for (let i = 1; i < 9; i++) {
        if (i % 3 === 0) {
            const pos = cell * i;
            // horizontal
            drawLine(0, pos, size, pos, thick);
            // vertical
            drawLine(pos, 0, pos, size, thick);
        }
    }
    // draw the perimeter box
    ctx.lineWidth = thick;
    ctx.strokeStyle = gridPrimaryColor;
    ctx.strokeRect(1, 1, size - 2, size - 2);
}

function drawCellBackground(col, row, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(col * cell, row * cell, cell, cell);
}

function drawNumberFromCell(idx) {
    const value = cells[idx];
    if (value === 0) return;

    // const { row, col } = cellToCoords(idx);
    const { row, col } = coords[idx];
    const x = Math.floor(col * cell + cell / 2) + 0.5;
    const y = Math.floor(row * cell + cell / 2) + 0.5;

    // choose color based purely on status
    switch (cellStatus[idx]) {
        case STATUS_GIVEN:
            ctx.fillStyle = givenNumberColor;
            break;
        case STATUS_CORRECT:
            ctx.fillStyle = userNumberColor;
            break;
        case STATUS_ERROR:
            ctx.fillStyle = errorNumberColor;
            break;
        default:
            ctx.fillStyle = userNumberColor; // fallback for any future states
    }


    ctx.fillText(String(value), x, y);
}

// special draw function, might be overkill 
function drawFinishedSudoku() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${cell * 0.6}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < 81; i++) {
        cellStatus[i] = STATUS_CORRECT;
        const { row, col } = coords[i];
        drawCellBackground(col, row, sameNumberCellColor);
    }
    for (let i = 0; i < 81; i++) {
        drawNumberFromCell(i);
    }
    drawGridLines();
    console.log("drew finished guy");
}

// main draw function
function drawSudoku() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = sudokuCanvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${cell * 0.6}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // paint backgrounds first
    for (let i = 0; i < 81; i++) {
        switch (highlightStatus[i]) {
            case H_SELECTED: {
                // const { row, col } = cellToCoords(i);
                const { row, col } = coords[i];
                drawCellBackground(col, row, selectedCellColor);
                break;
            }
            case H_NEIGHBOUR: {
                // const { row, col } = cellToCoords(i);
                const { row, col } = coords[i];
                drawCellBackground(col, row, neighbourCellColor);
                break;
            }
            case H_SAME_NUMBER: {
                // const { row, col } = cellToCoords(i);
                const { row, col } = coords[i];
                drawCellBackground(col, row, sameNumberCellColor);
                break;
            }
        }
    }

    // draw numbers
    for (let i = 0; i < 81; i++) {
        drawNumberFromCell(i);
    }
    // final grid overlay
    drawGridLines();
}

// ******************************************************
// --------------- DOM ---------------
// internal + DOM size setting 
function setGameSize() {
    // do whatever rule about sizing first
    size = 480;
    if (window.innerWidth - 48 < size) size = window.innerWidth - 48; // clamp size 
    // set the cell size based on new size
    cell = size / 9;
    // DO SCALING
    const dpr = window.devicePixelRatio || 1;
    // set canvas css size
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    // set canvas internal size
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    // scale the pixel-perfect ctx
    ctx.scale(dpr, dpr);
}

// misc DOM output
function printMistakes() {
    mistakesDisplay.textContent = mistakesMade;
}

// DOM-specific handler
const handleCellClick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);
    const cellNumber = (row * 9) + col;

    selectCell(cellNumber);
}

// keyboard
const handledKeys = new Set([
    "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "Backspace", "Delete"
]);
function handleKeydown(e) {
    if (handledKeys.has(e.key) && currentCell !== null) {
        e.preventDefault();
        // console.log("handled:", e.key);
        let next = currentCell;

        switch (e.key) {
            case "ArrowUp":
                if (next >= 9) next -= 9;
                selectCell(next);
                break;

            case "ArrowDown":
                if (next < 72) next += 9; // 72 = index of row 8 col 0
                selectCell(next);
                break;

            case "ArrowLeft": {
                const col = next % 9;
                if (col > 0) next -= 1;
                selectCell(next);
                break;
            }

            case "ArrowRight": {
                const col = next % 9;
                if (col < 8) next += 1;
                selectCell(next);
                break;
            }

            case "0":
            case "Delete":
            case "Backspace": {
                if (!givens[currentCell]) {
                    updateCellValue(currentCell, 0); // this is really a "null cell" operation, maybe backspace would do the same thing? maybe not though?
                }
                break;
            }

            default: {
                // i mean hopefully it's a number
                // console.log("number?:", e.key);
                // seems to work. maybe a hard guard would be good though.
                if (!givens[currentCell]) {
                    const value = Number(e.key);
                    updateCellValue(currentCell, value);
                }

            }
        }
    }
}

// ------------------------------
// Convert [{cell,newValue}] → [{cell,oldValue,newValue}] for runtime
// ------------------------------
function rebuildRuntimeHistory(minHist, missionStr, historyPos) {
    const tmp = new Uint8Array(81);
    for (let i = 0; i < 81; i++) {
        tmp[i] = missionStr.charCodeAt(i) - 48;
    }

    const out = [];
    for (let i = 0; i < historyPos; i++) {
        const { cell, newValue } = minHist[i];
        const oldValue = tmp[cell];
        out.push({ cell, oldValue, newValue });
        tmp[cell] = newValue;
    }
    return out;
}



// game bind + init
canvas.addEventListener('mousedown', handleCellClick); // a perfect middle for instant mouse & "click" behaviour on mobile
// canvas.addEventListener('blur', clearSelectedCell);
window.addEventListener('keydown', handleKeydown);

numpadItems.forEach(item => {
    const n = Number(item.dataset.value);
    item.addEventListener("click", () => inputFromNumpad(n));
});

document.getElementById('sudokUndo').addEventListener('click', () => undo());
document.getElementById('getCurrentString').addEventListener('click', () => console.log(getMissionProgress()));
document.getElementById('newPuzzleBtn').addEventListener('click', () => console.log(puzzles));
document.getElementById('puzzle0').addEventListener('click', () => openPuzzleById(puzzles[0].id));
document.getElementById('puzzle1').addEventListener('click', () => openPuzzleById(puzzles[1].id));
document.getElementById('puzzle2').addEventListener('click', () => openPuzzleById(puzzles[2].id));
document.getElementById('puzzle3').addEventListener('click', () => openPuzzleById(puzzles[3].id));


precomputeNeighbours();

// INIT
const defaultPuzzle = 1;
const savedID = storage.getActivePuzzleID();
if (savedID) {
    openPuzzleById(savedID);
} else {
    openPuzzleById(puzzles[defaultPuzzle].id);
}