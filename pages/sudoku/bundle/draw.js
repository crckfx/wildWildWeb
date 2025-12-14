import {
    canvas, cell, cellStatus, ctx, coords, cells, size,
    STATUS_EMPTY, STATUS_GIVEN, STATUS_CORRECT, STATUS_ERROR,
    highlightStatus,
    H_NONE, H_SELECTED, H_NEIGHBOUR, H_SAME_NUMBER,
    sudoku_show_errors,
} from "./sudokuGlobal.js";

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
// --------------- DRAWING ---------------
// thicknesses
const thin = 1;
const thick = 2;

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
            if (sudoku_show_errors) {
                ctx.fillStyle = errorNumberColor;
            } else {
                ctx.fillStyle = userNumberColor;
            }
            break;
        default:
            ctx.fillStyle = userNumberColor; // fallback for any future states
    }


    ctx.fillText(String(value), x, y);
}

function drawNumberAtCell(i, colour) {
    const value = cells[i];
    if (value === 0) return;
    const { row, col } = coords[i];
    const x = Math.floor(col * cell + cell / 2) + 0.5;
    const y = Math.floor(row * cell + cell / 2) + 0.5;

    ctx.fillStyle = colour;
    ctx.fillText(String(value), x, y);
}

// special draw function, might be overkill 
export function drawFinishedSudoku() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${cell * 0.6}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < 81; i++) {
        cellStatus[i] = STATUS_CORRECT; // guess we gotta set it in the draw function for now
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
export function drawSudoku() {
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
                const { row, col } = coords[i];
                drawCellBackground(col, row, selectedCellColor);
                break;
            }
            case H_NEIGHBOUR: {
                const { row, col } = coords[i];
                drawCellBackground(col, row, neighbourCellColor);
                break;
            }
            case H_SAME_NUMBER: {
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
