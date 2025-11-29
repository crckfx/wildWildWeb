const size = 480;
const canvas = document.getElementById('sudokuCanvas');
const ctx = canvas.getContext('2d');

canvas.width = size;
canvas.height = size;

// thicknesses
const thin = 1;
const thick = 2;

// full grid is 9×9
const cell = size / 9;



const cells = new Uint8Array(81).fill(0);
cells[0] = 1;
cells[10] = 2;
cells[20] = 3;
cells[30] = 4;
cells[40] = 5;
cells[50] = 6;
cells[60] = 7;
cells[70] = 8;
cells[80] = 9;

let currentCell = null;

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
    ctx.lineWidth = thick;
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(1, 1, size - 2, size - 2);

    for (let i = 1; i < 9; i++) {
        const pos = cell * i;

        const isThick = (i % 3 === 0);
        const w = isThick ? thick : thin;
        ctx.strokeStyle = isThick ? "#000000" : "#888888";

        // horizontal
        drawLine(0, pos, size, pos, w);

        // vertical
        drawLine(pos, 0, pos, size, w);
    }
}

function drawCellBackground(col, row) {
    ctx.fillStyle = "#ff000044";
    ctx.fillRect(col * cell, row * cell, cell, cell);
}

function drawNumber(text, col, row) {
    const x = Math.floor(col * cell + cell / 2) + 0.5;
    const y = Math.floor(row * cell + cell / 2) + 0.5;


    ctx.fillStyle = "#000";
    ctx.font = `${cell * 0.6}px monospace`; // 60% of cell size
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(text, x, y);
}

// main draw function
function drawSudoku() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    if (currentCell !== null) {
        const row = Math.floor(currentCell / 9);
        const col = currentCell % 9;
        drawCellBackground(col, row);
    }

    drawGridLines();

    for (let i = 0; i < cells.length; i++) {
        const value = cells[i];
        if (value !== 0) {
            const row = Math.floor(i / 9);
            const col = i % 9;

            drawNumber(value, col, row);
        }
    }
}

// game helpers
function updateCellValue(cell, value) {
    cells[cell] = value;
}

function selectCell(num) {
    if (num < 0 || num > 80) return;
    currentCell = num;
    drawSudoku();
}

const handleCellClick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);
    const cellNumber = (row * 9) + col;

    const oldCell = currentCell;

    selectCell(cellNumber);
}

const handledKeys = new Set([
    "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",

]);

function handleKeydown(e) {
    if (handledKeys.has(e.key) && currentCell !== null) {
        e.preventDefault();
        // console.log("handled:", e.key);
        let next = currentCell;

        switch (e.key) {
            case "ArrowUp":
                if (next >= 9) next -= 9;
                break;

            case "ArrowDown":
                if (next < 72) next += 9; // 72 = index of row 8 col 0
                break;

            case "ArrowLeft": {
                const col = next % 9;
                if (col > 0) next -= 1;
                break;
            }

            case "ArrowRight": {
                const col = next % 9;
                if (col < 8) next += 1;
                break;
            }

            case "0": {
                if (currentCell !== null) {
                    updateCellValue(currentCell, 0); // this is really a "null cell" operation, maybe backspace would do the same thing? maybe not though?
                }
                break;
            }

            default: {
                // i mean hopefully it's a number
                // console.log("number?:", e.key);
                // seems to work. maybe a hard guard would be good though.
                if (currentCell !== null) {
                    const value = Number(e.key);
                    updateCellValue(currentCell, value);
                }

            }
        }

        selectCell(next); // this triggers a redraw if a key was handled (fine for now)
    }
}

// game bind + init
canvas.addEventListener('click', handleCellClick);
canvas.addEventListener('keydown', handleKeydown);
drawSudoku();