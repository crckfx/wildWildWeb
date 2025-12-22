import { SolverAC3_1D } from "./SolverAC3_1D.js";

const solver = new SolverAC3_1D();

const inputEl  = document.getElementById("input");
const outputEl = document.getElementById("output");
const solveBtn = document.getElementById("solveBtn");

solveBtn.onclick = () => {
    const input = inputEl.value.trim();

    // parse
    const grid = solver.parsePuzzle(input);

    // solve
    const result = solver.solve(grid);

    if (!result.sudoku) {
        outputEl.textContent = "No solution";
    } else {
        outputEl.textContent = result.sudoku.join("");
    }

    console.log("HISTORY (full):", solver.AC3_HISTORY);
    console.log("ROOT_END:", solver.ROOT_END);

    const root = solver.getRootHistory();
    console.log("HISTORY (root):", root);

    const firstWrite = root.find(e => e.type === "write") || null;
    console.log("First root write:", firstWrite);

    const firstNakedPair =
        root.find(e => e.technique === "naked_pair") || null;
    console.log("First naked-pair event:", firstNakedPair);

    const firstClue = solver.getFirstClue(root);
    console.log("First clue:", firstClue);
};
