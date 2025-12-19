export const canvas = document.getElementById('sudokuCanvas');
export const ctx = canvas.getContext('2d');
export const numpadWrapper = document.querySelector('.numpad-wrapper');
export const numpadItems = numpadWrapper?.querySelectorAll('.numpad-item');
export const numpadByValue = Array(10).fill(null);


// ARRAYS (they're all length 81 because sudoku has 81 cells)
export const cells = new Uint8Array(81).fill(0);       // for the evolving board state
export const solution = new Uint8Array(81);            // for the solution values

export const givens = new Uint8Array(81);              // for "is this cell's value provided in the initial puzzle state?"
export const cellStatus = new Uint8Array(81);          // for "what colour to render the text in this cell?"
export const highlightStatus = new Uint8Array(81);     // for "what colour to render the background for this cell"

export const coords = new Array(81);                   // for a precomputed lookup of "index->coords(as x,y)""
function cellToCoords(cellNumber) {
    const row = (cellNumber / 9) | 0;
    const col = cellNumber % 9;
    return { row, col }
}
for (let i = 0; i < 81; i++) {
    coords[i] = cellToCoords(i);
}

// For digits 1..9 → index 0..8
export const correctCount = new Uint8Array(9);
export const completedDigits = new Uint8Array(9); // 1 = done, 0 = not done


// STATUSES
export const STATUS_EMPTY = 0;
export const STATUS_GIVEN = 1;
export const STATUS_CORRECT = 2;
export const STATUS_ERROR = 3;
// highlight states (visual only)
export const H_NONE = 0;
export const H_SELECTED = 1;
export const H_NEIGHBOUR = 2;
export const H_SAME_NUMBER = 3;

// -------- SIZING -----------
export let size = 480; // default (currently 'max') canvas size
export let cell = size / 9; // full grid is 9×9
// internal + DOM size setting 
export function setGameSize() {
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

// -------- UI (if it winds up here, it's probably so game can push to it) -----------
export const browseList_EASY = document.getElementById("browseList_EASY");
export const browseList_MEDIUM = document.getElementById("browseList_MEDIUM");

export const browseList_ALL = [
    browseList_EASY,
    browseList_MEDIUM,
].filter(Boolean);


export let sudoku_show_errors = false;