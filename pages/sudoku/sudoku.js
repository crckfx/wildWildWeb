let size = 480;
// console.log(window.innerWidth);
if (window.innerWidth - 48 < size) size = window.innerWidth - 48;

const canvas = document.getElementById('sudokuCanvas');
const ctx = canvas.getContext('2d');
const mistakesDisplay = document.querySelector('.data')?.querySelector('.mistake');
const numpad = document.querySelector('#numpad');
const numpadItems = numpad.querySelectorAll('.numpad-item');

canvas.width = size;
canvas.height = size;

// thicknesses
const thin = 1;
const thick = 2;

// full grid is 9×9
const cell = size / 9;


// COLOURS
const selectedCellColor = "#ff000044";
const neighbourCellColor = "#ff00ff22";
const sameNumberCellColor = "#00ffff22";
const gridPrimaryColor = "#000000";
const gridSecondaryColor = "#888888";

const givenNumberColor = "#000000";
const userNumberColor = "#0000cc";
const errorNumberColor = "#cc0000";


const cells = new Uint8Array(81).fill(0);
const solution = new Uint8Array(81);
const givens = new Uint8Array(81);


const puzzles = [
    {
        id: 406,
        mission: "070800090900070003000500070100084000700000081800050400000000920490003108006028300",
        solution: "275831694948672513631549872169284735754396281823157469387415926492763158516928347",
        win_rate: 63.26
    },
    {
        id: 676,
        mission: "500000900004690000000014062047360258098175406035002000400700095006001000702000603",
        solution: "561283974324697581879514362147369258298175436635842719483726195956431827712958643",
        win_rate: 39.98
    },
    {
        id: 734,
        mission: "000980610400060000009500027000200700540000086076050000061095832294037560800021000",
        solution: "327984615415762398689513427138246759542379186976158243761495832294837561853621974",
        win_rate: 41.52
    },
    {
        id: 940,
        mission: "000400067461078032208653019096030200807000340000500080084205000000089020900000600",
        solution: "359412867461978532278653419596834271827196345143527986784265193615389724932741658",
        win_rate: 55.67
    },
]



let currentCell = null;
let mistakesMade = 0;

function printMistakes() {
    mistakesDisplay.textContent = mistakesMade;
}

function inputFromNumpad(num) {
    if (currentCell !== null) {
        updateCellValue(currentCell, num);
    }
}

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
    for (let i = 1; i < 9; i++) {
        const pos = cell * i;

        const isThick = (i % 3 === 0);
        const w = isThick ? thick : thin;
        ctx.strokeStyle = isThick ? gridPrimaryColor : gridSecondaryColor;

        // horizontal
        drawLine(0, pos, size, pos, w);

        // vertical
        drawLine(pos, 0, pos, size, w);
    }

    ctx.lineWidth = thick;
    ctx.strokeStyle = gridPrimaryColor;
    ctx.strokeRect(1, 1, size - 2, size - 2);
}

function drawCellBackground(col, row, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(col * cell, row * cell, cell, cell);
}

function drawNumberFromCell(num) {
    // consider that draw function maybe shouldnt be computing / comparing value again
    const value = cells[num];
    if (value !== 0) {
        // const row = Math.floor(num / 9);
        // const col = num % 9;
        const { row, col } = cellToCoords(num)
        const x = Math.floor(col * cell + cell / 2) + 0.5;
        const y = Math.floor(row * cell + cell / 2) + 0.5;

        if (givens[num] === 1) {
            ctx.fillStyle = givenNumberColor;
        } else {
            if (value === solution[num]) {
                ctx.fillStyle = userNumberColor;
            } else {
                ctx.fillStyle = errorNumberColor;
            }
        }

        ctx.font = `${cell * 0.6}px monospace`; // 60% of cell size
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(`${value}`, x, y);

    }
}


// main draw function
function drawSudoku() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    if (currentCell !== null) {
        const { row, col } = cellToCoords(currentCell);
        drawCellBackground(col, row, selectedCellColor);

        // highlight neighbours exactly once
        const list = neighboursOf[currentCell];
        for (let i = 0; i < list.length; i++) {
            const idx = list[i];
            const { row: nr, col: nc } = cellToCoords(idx);
            drawCellBackground(nc, nr, neighbourCellColor);
        }

        // highlight other cells with the same value as the one we have selected
        for (let i = 0; i < cells.length; i++) {
            if (i !== currentCell && cells[i] !== 0 && cells[i] === cells[currentCell]) {
                const { row: vr, col: vc } = cellToCoords(i);
                drawCellBackground(vc, vr, sameNumberCellColor);
            }
        }
    }

    for (let i = 0; i < cells.length; i++) {
        drawNumberFromCell(i);
    }
    drawGridLines();
}

// game helpers
function updateCellValue(cell, value) {
    // overwrite value
    cells[cell] = value;
    // detect mistake
    if (value !== 0 && value !== solution[cell]) {
        mistakesMade++;
        printMistakes();
    }
}

function cellToCoords(cellNumber) {
    const row = (cellNumber / 9) | 0;
    const col = cellNumber % 9;
    return { row, col }
}

function clearSelectedCell() {
    currentCell = null;
    drawSudoku();
}

function selectCell(num) {
    if (num < 0 || num > 80) return;
    const oldCell = currentCell;
    if (num !== oldCell) {
        currentCell = num;
        // console.log(`fresh select on ${coords.col}, ${coords.row}`);
    }
    drawSudoku();
}

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

        selectCell(next); // this triggers a redraw if a key was handled (fine for now)
    }
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


function loadPuzzle(puzzle) {
    const m = puzzle.mission;
    const s = puzzle.solution;

    mistakesMade = 0;
    printMistakes();

    for (let i = 0; i < 81; i++) {
        const mval = m.charCodeAt(i) - 48;
        const sval = s.charCodeAt(i) - 48;

        solution[i] = sval;

        if (mval === 0) {
            cells[i] = 0;
            givens[i] = 0;
            // cellStatus[i] = 0; // empty
        } else {
            cells[i] = mval;
            givens[i] = 1;
            // cellStatus[i] = 1; // given
        }
    }

    currentCell = 0;
    drawSudoku();
}

// simple string print of state (not exactly 'mission progress')
function getMissionProgress() {
    let progress = "";
    for (let i = 0; i < cells.length; i++) {
        progress += cells[i];
    }
    return progress;
}

// 

// game bind + init
canvas.addEventListener('click', handleCellClick);
// canvas.addEventListener('blur', clearSelectedCell);
window.addEventListener('keydown', handleKeydown);

numpadItems.forEach(item => {
    const n = Number(item.dataset.value);   // once, at startup
    item.addEventListener("click", () => {
        if (currentCell !== null && !givens[currentCell]) {
            updateCellValue(currentCell, n);
            selectCell(currentCell); // rerender
        }
    });
});

document.getElementById('getCurrentString').addEventListener('click', () => console.log(getMissionProgress()));
document.getElementById('puzzle0').addEventListener('click', () => loadPuzzle(puzzles[0]));
document.getElementById('puzzle1').addEventListener('click', () => loadPuzzle(puzzles[1]));
document.getElementById('puzzle2').addEventListener('click', () => loadPuzzle(puzzles[2]));
document.getElementById('puzzle3').addEventListener('click', () => loadPuzzle(puzzles[3]));

precomputeNeighbours();
loadPuzzle(puzzles[0]);


