// import { openPuzzleById, precomputeNeighbours } from "./sudoku.js";
// import * as storage from "./storage.js";
// import { bindUI } from "./sudokuUI.js";


export const canvas = document.getElementById('sudokuCanvas');
export const UI_container = document.getElementById('sudokuUI');

import { puzzles } from "/apps/sudoku/bundle/puzzles.js";
import { SudokuGame } from "./SudokuGame.js";
import { Renderer } from "./Renderer.js";
import { createUI } from "./UI.js";
import { createAppManager } from "./manager.js";

export const game = new SudokuGame();
const renderer = new Renderer({ game, canvas });
const UI = createUI({ game, renderer, UI_container });
canvas.addEventListener('mousedown', UI.handleCellClick); // a perfect middle for instant mouse & "click" behaviour on mobile
UI_container.addEventListener('keydown', UI.handleKeydown);

const manager = createAppManager({ game, renderer, UI });

document.getElementById('browsePuzzlesBtn')?.addEventListener('click', manager._showBrowse);
document.getElementById('devOptionsBtn')?.addEventListener('click', manager._showDev);

game.onWin = manager._testWinInManager;


// game.miscOpenPuzzle(puzzles[4]);
manager._openPuzzleByID(701);
UI_container.focus();
renderer.drawSudoku();
