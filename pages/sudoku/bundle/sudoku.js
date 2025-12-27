const mistakesDisplay = document.querySelector('.data')?.querySelector('.mistake');
const numpad = document.querySelector('#numpad');


const puzzleNumDisplay = document.getElementById('puzzleNumDisplay');

setGameSize();

// some junk about storage
export let currentPuzzleID = null;
export let currentPuzzleIsCompleted = false;

import { drawFinishedSudoku, drawSudoku } from "./draw.js";
import { puzzles } from "./puzzles.js";
import * as storage from "./storage.js";

import {
    cells, solution, givens, cellStatus, highlightStatus, coords, setGameSize,
    STATUS_EMPTY, STATUS_GIVEN, STATUS_CORRECT, STATUS_ERROR,
    H_NONE, H_SELECTED, H_NEIGHBOUR, H_SAME_NUMBER,
    correctCount, completedDigits,
    numpadItems, numpadByValue,
    browseList_ALL,
} from "./sudokuGlobal.js";
import "./sudokuUI.js";
import { showWinModal } from "./sudokuUI.js";



// ******************************************************
// --------------- GAME ---------------
// HISTORY (a 'playhead' position and array of history objects: {cell, oldValue, newValue} )
let historyPos = 0;
let gameHistory = [];

export let currentCell = null; // <-- the main pointer guy for the game
let mistakesMade = 0;

// ---------- PUZZLE OPENERS ----------
// SHALLOW PUZZLE (FOR DISPLAY ONLY; NOT PLAYING)
export function shallowOpenPuzzleById(id) {
    const puzzle = puzzles.find(p => p.id == id);
    if (!puzzle) {
        console.error(`couldn't find puzzle id:${id}`);
        return;
    }

    return (shallowOpenPuzzle(puzzle));
}

// for "soft load" in 
export function shallowOpenPuzzle(puzzle) {
    historyPos = 0;
    gameHistory = [];
    currentCell = 0;

    // --- baseline load (mission/solution) ---
    const mission = puzzle.mission;
    const sol = puzzle.solution;

    for (let i = 0; i < 81; i++) {
        const mval = mission.charCodeAt(i) - 48;
        
        
        if (mval === 0) {
            cells[i] = 0;
            givens[i] = 0;
            cellStatus[i] = STATUS_EMPTY;
        } else {
            cells[i] = mval;
            givens[i] = 1;
            cellStatus[i] = STATUS_GIVEN;
        }

        if (sol) {
            const sval = sol.charCodeAt(i) - 48;
            solution[i] = sval;
        }
    }
    computeGameState();
    // theoretically if this loads fine we might have a basis for a shallow mode
    return true;
}

// GAME OPEN PUZZLE (FOR REAL PLAYING)
export function miscOpenPuzzle(puzzle) {
    currentPuzzleIsCompleted = false;
    currentPuzzleID = null;
    currentCell = 0;

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
    // -------- stuff for count finished digits -----------
    correctCount.fill(0);
    completedDigits.fill(0);
    // cellwise "finished count" spanning all digits
    for (let i = 0; i < 81; i++) {
        const v = cells[i];
        if (v !== 0 && v === solution[i]) {
            correctCount[v - 1]++;
        }
    }
    // see if any digits are finished
    for (let d = 0; d < 9; d++) {
        const value = d + 1;
        if (correctCount[d] === 9) {
            completedDigits[d] = 1;
            hideNumpadItem(value);
        } else {
            showNumpadItem(value);
        }
    }
    // -------- /stuff for count finished digits -----------
    printMistakes();
    updatepuzzleNumDisplay();
    computeGameState();
}

export function openPuzzleById(id, reset = false) {

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
    if (saved && reset !== true) {

        const savedHistory = saved.history;
        const savedPos = saved.historyPos;

        gameHistory = rebuildRuntimeHistory(savedHistory, mission, savedPos);
        historyPos = savedPos;

        // restore history into cells (full replay)
        for (let i = 0; i < historyPos; i++) {
            const { cell, newValue } = gameHistory[i];
            cells[cell] = newValue;
            cellStatus[cell] = applyStatus(cell, newValue);
        }



        mistakesMade = saved.mistakes;

        if (saved.completedAt !== null) {
            triggerGameEnd();
        }

    } else {
        storage.startPuzzle(puzzle);
    }

    // -------- stuff for count finished digits -----------
    correctCount.fill(0);
    completedDigits.fill(0);
    // cellwise "finished count" spanning all digits
    for (let i = 0; i < 81; i++) {
        const v = cells[i];
        if (v !== 0 && v === solution[i]) {
            correctCount[v - 1]++;
        }
    }
    // see if any digits are finished
    for (let d = 0; d < 9; d++) {
        const value = d + 1;
        if (correctCount[d] === 9) {
            completedDigits[d] = 1;
            hideNumpadItem(value);
        } else {
            showNumpadItem(value);
        }
    }
    // -------- /stuff for count finished digits -----------

    printMistakes();
    updatepuzzleNumDisplay();
    computeGameState();
}
// ---------- /PUZZLE OPENERS ----------

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

function triggerGameEnd() {
    console.log("game's finished");
    currentCell = null;
    // drawFinishedSudoku();
    currentPuzzleIsCompleted = true;
    // const zeroBtn = document

    // const targetEl = browseList.querySelector(`[data-puzzleid='${currentPuzzleID}']`);

    const targetEl = browseList_ALL
        .map(list => list.querySelector(
            `[data-puzzleid='${currentPuzzleID}']`
        ))
        .find(Boolean);

    if (targetEl) {
        targetEl.classList.add('completed');
        targetEl.textContent = `✔️ Puzzle ${currentPuzzleID}`;
        // console.log(targetEl);
    }

    
    
    showWinModal();
}
// 



// game helpers
export function updateCellValue(cell, value) {
    // determine if a real write call is made by this 
    if (currentPuzzleIsCompleted) return;
    
    const oldValue = cells[cell]; // store the existing value
    if (value === oldValue) return; // exit if the value didn't change
    // overwrite value
    cells[cell] = value;


    // --- if we change from a correct to something else, we need to decrement the digit's "completed" count ---
    if (oldValue === solution[cell]) {
        const idxOld = oldValue - 1;
        const oldCount = correctCount[idxOld];

        correctCount[idxOld]--;
        completedDigits[idxOld] = (correctCount[idxOld] === 9) ? 1 : 0;

        // un-trigger the old digit's "complete" status
        if (oldCount === 9) {
            showNumpadItem(oldValue);
        }
    }

    addToHistory(cell, oldValue, value)

    // console.log(`made move, cell: ${cell}, oldValue: ${oldValue}, newValue: ${value}`)
    // detect mistake (CRUDELY - checking against the real answer; a finer way would be to check against the current board state for contradiction)
    const status = applyStatus(cell, value);
    cellStatus[cell] = status;
    if (status === STATUS_ERROR) {
        mistakesMade++;
        printMistakes();
    }

    // --- if we change from something to correct, we need to increment the digit's "completed" count ---
    if (status === STATUS_CORRECT) {
        const i = value - 1;
        correctCount[i]++;
        const completed = (correctCount[i] === 9) ? 1 : 0
        completedDigits[i] = completed;
        if (completed === 1) {
            hideNumpadItem(value);
        }
    }

    const solved = checkSolved();

    if (solved) {
        // write to history with the 'completed = true' param
        if (currentPuzzleID !== null) storage.saveMove(currentPuzzleID, cell, value, mistakesMade, true); // storage 
        // run the game end sequence
        triggerGameEnd();
    } else {
        if (currentPuzzleID !== null) storage.saveMove(currentPuzzleID, cell, value, mistakesMade); // storage 
    }
    // call main render
    computeGameState();
}


// sort of a "do render" thing; it's not super clear yet
export function selectCell(num) {
    if (currentPuzzleIsCompleted || num < 0 || num > 80) return;
    const oldCell = currentCell;
    if (num !== oldCell) {
        currentCell = num;
        // console.log(`fresh select on ${coords.col}, ${coords.row}`);
    }
    computeGameState();

}

const neighboursOf = precomputeNeighbours();

export function precomputeNeighbours() {
    const tempNeighboursOf = Array.from({ length: 81 }, () => []);

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
            if (mask[idx]) tempNeighboursOf[i].push(idx);
        }
    }

    return tempNeighboursOf;
}


function addToHistory(cell, oldValue, newValue) {
    const currentPos = historyPos;

    gameHistory[currentPos] = { cell, oldValue, newValue };

    console.log(`history write ${currentPos}: cell:${cell}, old:${oldValue}, new:${newValue}`);
    historyPos++;
}

export function undo() {
    if (currentPuzzleIsCompleted) return;
    if (historyPos < 1) return;
    const undoToHistoryPos = historyPos - 1;
    const { cell, oldValue, newValue } = gameHistory[undoToHistoryPos];
    console.log(`undo: ${cell} from ${newValue} to ${oldValue}`);

    // overwrite value
    cells[cell] = oldValue;
    historyPos--;

    if (currentPuzzleID !== null) storage.saveUndo(currentPuzzleID, historyPos, mistakesMade); // storage

    cellStatus[cell] = applyStatus(cell, oldValue);

    // REMOVE contribution of newValue (the one being undone)
    if (newValue === solution[cell]) {
        const i = newValue - 1;
        const oldCount = correctCount[i];
        correctCount[i]--;
        completedDigits[i] = (correctCount[i] === 9) ? 1 : 0;

        if (oldCount === 9) {
            console.log(`just UNDID a previously complete digit ${newValue}`);
            showNumpadItem(newValue);
        }
    }

    // APPLY contribution of oldValue
    if (oldValue === solution[cell]) {
        const i = oldValue - 1;
        correctCount[i]++;
        const completed = (correctCount[i] === 9) ? 1 : 0;
        completedDigits[i] = completed;
        if (completed === 1) {
            hideNumpadItem(oldValue);
        }
    }

    selectCell(cell);


}

// ******************************************************
// --------------- DOM ---------------


// misc DOM output
function printMistakes() {
    if (mistakesDisplay) mistakesDisplay.textContent = mistakesMade;
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




// rand
function updatepuzzleNumDisplay() {
    puzzleNumDisplay.textContent = `puzzle id:${currentPuzzleID}`;
}


function applyStatus(cell, val) {
    if (val === 0) return STATUS_EMPTY;
    return val === solution[cell] ? STATUS_CORRECT : STATUS_ERROR;
}

function hideNumpadItem(value) {
    // const item = numpadByValue[value];
    // console.log(item);
    // item.classList.add('completed');
    numpadByValue[value]?.classList.add('completed');
}
function showNumpadItem(value) {
    // const item = numpadByValue[value];
    // item.classList.remove('completed');
    numpadByValue[value]?.classList.remove('completed');
}

export function getCurrentBoard() {
    const arr = new Array(81);
    let str = "";
    for (let i = 0; i < 81; i++) {
        const val = cells[i];
        arr[i] = val;
        str += val;
    }
    return {
        asString: str,
        asArray: arr
    };
}