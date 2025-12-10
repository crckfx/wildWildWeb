import { openPuzzleById, precomputeNeighbours } from "./sudoku.js";
import * as storage from "./storage.js";
import { puzzles } from "./puzzles.js";
import { bindUI } from "./sudokuUI.js";

// INIT
precomputeNeighbours();
bindUI();
const defaultPuzzle = 101;
const savedID = storage.getActivePuzzleID();
if (savedID) {
    openPuzzleById(savedID);
} else {
    openPuzzleById(defaultPuzzle);
}
