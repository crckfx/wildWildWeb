// import { openPuzzleById, precomputeNeighbours } from "./sudoku.js";
// import { bindUI } from "./sudokuUI.js";


export const canvas = document.getElementById('sudokuCanvas');
export const UI_container = document.getElementById('sudokuUI');

import { puzzles } from "/apps/sudoku/bundle/puzzles.js";
import { SudokuGame } from "./SudokuGame.js";
import { Renderer } from "./Renderer.js";
import { createUI } from "./UI.js";
import { createAppManager } from "./manager/manager.js";
import * as storage from "./manager/mstorage.js";
import { SolverAC3_1D } from "/apps/sudoku/bundle/SolverAC3/1D/SolverAC3_1D.js";

export const game = new SudokuGame();
const renderer = new Renderer({ game, canvas });
const UI = createUI({ game, renderer, UI_container });
canvas.addEventListener('mousedown', UI.handleCellClick); // a perfect middle for instant mouse & "click" behaviour on mobile
const solver = new SolverAC3_1D();

const manager = createAppManager({ game, renderer, UI, solver});
// UI_container.addEventListener('keydown', UI.handleKeydown);
UI_container.addEventListener('keydown', manager._handleKeydown);


document.getElementById('newPuzzleBtn')?.addEventListener('click', manager._showNew);
document.getElementById('browsePuzzlesBtn')?.addEventListener('click', manager._showBrowse);
document.getElementById('devOptionsBtn')?.addEventListener('click', manager._showDev);
document.getElementById('resetPuzzleBtn')?.addEventListener('click', manager._showReset);

UI.container.addEventListener('focus', () => {
    if (!UI.boardInteractBlocked)
        renderer.drawSudoku();
});
UI.container.addEventListener('blur', () => {
    if (!UI.boardInteractBlocked)
        renderer.drawSudoku({ showSelectedCell: true, showHighlighting: false });
});

game.onWin = manager._handleGameWin;
game.onUpdate = manager._onGameUpdate;
game.onUndo = manager._onGameHistoryMove;
game.onRedo = manager._onGameHistoryMove;

const savedID = storage.getActivePuzzleID();
if (savedID) {
    manager._openPuzzleByID(savedID);
} else {
    manager._openPuzzleByID(103);
}

// UI_container.focus();
// render is done by open pipelines now, focus is extra
