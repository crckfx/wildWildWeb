import { puzzles, easyPuzzles, mediumPuzzles } from "./puzzles.js";
import { openPuzzleById, currentPuzzleID, undo, currentCell, updateCellValue, selectCell, miscOpenPuzzle } from "./sudoku.js";
import * as storage from "./storage.js";
import { cells, browseList, browseList_MEDIUM, canvas, cell, completedDigits, givens, numpadByValue, numpadItems, solution } from "./sudokuGlobal.js";

const modalContainer = document.getElementById('modalContainer');
const panels = {
    new: document.getElementById("panel-new"),
    reset: document.getElementById("panel-reset"),
    browse: document.getElementById("panel-browse"),
    dev: document.getElementById("panel-dev"),
};
let modalIsOpen = false;
function showModal(target) {
    modalIsOpen = true;
    modalContainer.classList.add('show');
    if (target) {
        Object.values(panels).forEach(p => p.classList.remove("active"));

        target.classList.add('active');
    }
}
function hideModal() {
    modalIsOpen = false;
    modalContainer.classList.remove('show');
    console.log("hide modal");
    Object.values(panels).forEach(p => p.classList.remove("active"));

}
function handleModalClick(e) {
    if (!e.target.closest(".modalPanel")) {
        hideModal();
    }
}

function UI_resetPuzzle() {
    // alert("implement puzzle reset, ie. 'wipe the progress of this current puzzle (including cache)'. this interact should not be an alert and should be asking for yes / no with no as default");
    if (currentPuzzleID) {
        showModal(panels.reset);
        // openPuzzleById(currentPuzzleID, true);
    }
}
function UI_newPuzzle() {
    // alert("implement an interaction for new puzzle");
    showModal(panels.new);
}

function UI_modal_devOptions() {
    showModal(panels.dev);
}

function UI_browsePuzzles() {
    // alert("maybe a modal dialogue too");
    showModal(panels.browse);
}

// populate browseList
if (browseList) {
    easyPuzzles.forEach(p => {
        const li = document.createElement("li");

        // const nameSpan = document.createElement("span");
        // nameSpan.textContent = `Puzzle ${p.id}`;
        // li.appendChild(nameSpan);
        const saved = storage.loadPuzzleState(p.id);

        // const btn = document.createElement("button");
        li.classList.add('someButton2');
        li.classList.add('primary');

        let symbolForCompleted = '';
        if (saved && saved.completedAt) {
            symbolForCompleted = '✔️ ';
            li.classList.add('completed');
        }
        console.log(`item ${p.id} ${symbolForCompleted}`)


        li.dataset.puzzleid = p.id;

        li.textContent = `${symbolForCompleted} Puzzle ${p.id}`;
        li.onclick = () => {
            openPuzzleById(p.id);
            hideModal();
        };

        // li.appendChild(btn);
        browseList.appendChild(li);
    });
}

if (browseList_MEDIUM) {
        mediumPuzzles.forEach(p => {
        const li = document.createElement("li");

        // const nameSpan = document.createElement("span");
        // nameSpan.textContent = `Puzzle ${p.id}`;
        // li.appendChild(nameSpan);
        const saved = storage.loadPuzzleState(p.id);

        // const btn = document.createElement("button");
        li.classList.add('someButton2');
        li.classList.add('primary');

        let symbolForCompleted = '';
        if (saved && saved.completedAt) {
            symbolForCompleted = '✔️ ';
            li.classList.add('completed');
        }
        console.log(`item ${p.id} ${symbolForCompleted}`)


        li.dataset.puzzleid = p.id;

        li.textContent = `${symbolForCompleted} Puzzle ${p.id}`;
        li.onclick = () => {
            openPuzzleById(p.id);
            hideModal();
        };

        // li.appendChild(btn);
        browseList_MEDIUM.appendChild(li);
    });
}


// keyboard
const handledKeys = new Set([
    "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "Backspace", "Delete", "Escape"
]);
function handleKeydown(e) {
    const key = e.key;
    if (!handledKeys.has(key)) return;

    if (modalIsOpen) {
        if (key === "Escape") {
            // console.log("handled but unused ESCAPE key press while modal is open");
            hideModal();
        }
        return;
    }

    if (currentCell !== null) {
        e.preventDefault();
        // console.log("handled:", e.key);
        let next = currentCell;

        switch (key) {
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

            case "Escape":
                break;

            default: {
                // default "let numbers through to here" case
                if (!givens[currentCell]) {
                    const value = Number(e.key);
                    updateCellValue(currentCell, value);
                }

            }
        }
    }
}
const passiveKeys = new Set([
    "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
]);
function passiveKeyDown(e) {
    const key = e.key;
    if (!passiveKeys.has(key)) return;

    if (currentCell !== null) {
        e.preventDefault();
        // console.log("handled:", e.key);
        let next = currentCell;

        switch (key) {
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
        }
    }
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


// receive input for game (DOM -> game)
function inputFromNumpad(n) {
    if (currentCell !== null && !givens[currentCell]) {
        if (completedDigits[n - 1] === 1) {
            console.log(`from numpad when digit ${n} finished`);
        } else {
            updateCellValue(currentCell, n);
        }
    }
}
if (numpadItems) {
    numpadItems.forEach(item => {
        const v = Number(item.dataset.value);
        item.addEventListener("click", () => inputFromNumpad(v));
        if (v >= 0 && v <= 9) {
            numpadByValue[v] = item;
        }

    });
}

export function bindUI({ passive = false} = {}) {
    console.log("hello from UI binder");

    if (modalContainer) modalContainer.onclick = handleModalClick;

    document.getElementById('sudokUndo')?.addEventListener('click', () => undo());

    document.getElementById("newRandom")?.addEventListener('click', () => {
        const idx = Math.floor(Math.random() * puzzles.length);
        openPuzzleById(puzzles[idx].id);
        hideModal();

    });


    document.getElementById("newCancel")?.addEventListener('click', hideModal);

    document.getElementById("resetConfirm")?.addEventListener('click', () => {
        const targetEl = browseList.querySelector(`[data-puzzleid='${currentPuzzleID}']`);

        targetEl.classList.remove('completed');

        targetEl.textContent = `Puzzle ${currentPuzzleID}`;

        openPuzzleById(currentPuzzleID, true);
        hideModal();
    });


    document.getElementById("resetCancel")?.addEventListener('click', hideModal);
    document.getElementById("browseCancel")?.addEventListener('click', hideModal);
    document.getElementById("devCancel")?.addEventListener('click', hideModal);
    document.getElementById('newPuzzleBtn')?.addEventListener('click', () => UI_newPuzzle());
    document.getElementById('resetPuzzleBtn')?.addEventListener('click', () => UI_resetPuzzle());
    document.getElementById('browsePuzzlesBtn')?.addEventListener('click', () => UI_browsePuzzles());
    document.getElementById('devOptionsBtn')?.addEventListener('click', () => UI_modal_devOptions());

    // game bind + init
    canvas.addEventListener('mousedown', handleCellClick); // a perfect middle for instant mouse & "click" behaviour on mobile
    // canvas.addEventListener('blur', clearSelectedCell);
    if (!passive) {
        window.addEventListener('keydown', handleKeydown);
    } else {
        window.addEventListener('keydown', passiveKeyDown);
    }

}


const someOtherPuzzleBtn = document.getElementById('someOtherPuzzleBtn');
someOtherPuzzleBtn?.addEventListener('click', () => loadSomeOtherPuzzle());
function loadSomeOtherPuzzle() {
    const puzzle = {"mission":"000290870000000100008000006060080003000750060007900005001006050002870000070000900","solution":"613295874725648139948317526564182793139754268287963415891426357352879641476531982","difficultyCode":2,"difficultyName":"Easy"}
    hideModal();
    miscOpenPuzzle(puzzle);
}


function copyPuzzleToClipboard() {
    // if (currentlyLoadedPuzzle !== null) {
    //     console.log("currently loaded:", currentlyLoadedPuzzle.mission, currentlyLoadedPuzzle.solution);
    //     navigator.clipboard.writeText(JSON.stringify(currentlyLoadedPuzzle));
    // }
    let jkl = "";
    let xyz = "";
    for (let i=0; i<81; i++) {
        jkl+= cells[i];
        xyz+= solution[i];
    }

    console.log(jkl);

    navigator.clipboard.writeText(JSON.stringify({mission: jkl, solution: xyz}));
}
const copyBtn = document.getElementById('copyBtn');
copyBtn.addEventListener('click', () => copyPuzzleToClipboard());


