import { openPuzzleById, precomputeNeighbours, shallowOpenPuzzle, shallowOpenPuzzleById } from "../bundle/sudoku.js";
import * as storage from "../bundle/storage.js";
// import { puzzles } from "../bundle/puzzles.js";
import { puzzles } from "../bundle/puzzles.js";
import { bindUI } from "../bundle/sudokuUI.js";

const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
// console.log(generateBtn, clearBtn);
const difficultyNameDisplay = document.getElementById('difficultyName');
const difficultyCodeDisplay = document.getElementById('difficultyCode');
const difficultySelector = document.getElementById('difficultySelector');

const copyBtn = document.getElementById('copyBtn');

let currentlyLoadedPuzzle = null;

// INIT
precomputeNeighbours();
bindUI({ passive: true });
const result = shallowOpenPuzzleById(0);
console.log("result:");
console.log(result)

function makeNewPuzzle() {
    const targetDifficulty = parseInt(difficultySelector.value, 10);
    const puzzle = get_qq_puzzle(targetDifficulty);
    // console.log(puzzle);
    shallowOpenPuzzle(puzzle);
    currentlyLoadedPuzzle = puzzle;
    difficultyCodeDisplay.textContent = puzzle.difficultyCode;
    difficultyNameDisplay.textContent = `(${puzzle.difficultyName})`;

}
function clearPuzzle() {
    shallowOpenPuzzleById(0);
    difficultyCodeDisplay.textContent = "";
    difficultyNameDisplay.textContent = "";
    currentlyLoadedPuzzle = null;
}

// function get_qq_puzzle(difficulty) {
//     const qq = new qqwing();
//     console.log(`generate puzzle, intended difficulty: ${difficulty}`);
//     qq.setRecordHistory(true);
//     qq.setPrintStyle(qqwing.PrintStyle.ONE_LINE);

//     // it kinda only makes sense to loop between:
//     // --- here ---

//     // generate puzzle
//     qq.generatePuzzle();
//     const mission = qq.getPuzzleString();

//     // solve, which also logs the solving steps
//     qq.solve();
//     const solution = qq.getSolutionString();

//     // now difficulty is defined
//     const difficultyCode = qq.getDifficulty();            // enum 0–4
//     const difficultyName = qq.getDifficultyAsString();    // "Simple", etc.

//     // --- and here ---

//     // pass everything into your sanitiser
//     const treated = treat_qq_puzzle({
//         mission,
//         solution,
//         difficultyCode,
//         difficultyName,
//     });

//     return treated;
// }

function get_qq_puzzle(targetDifficulty) {
    for (;;) {
        const qq = new qqwing();
        console.log(`generate puzzle, intended difficulty: ${targetDifficulty}`);

        qq.setRecordHistory(true);
        qq.setPrintStyle(qqwing.PrintStyle.ONE_LINE);

        // --- core generation block ---
        qq.generatePuzzle();
        const mission = qq.getPuzzleString();

        qq.solve();
        const solution = qq.getSolutionString();

        const difficultyCode = qq.getDifficulty();
        const difficultyName = qq.getDifficultyAsString();
        // --- end core generation block ---

        console.log(`generated difficulty: ${difficultyCode} (${difficultyName})`);

        // accept ANY difficulty
        if (targetDifficulty === 0) {
            const treated = treat_qq_puzzle({
                mission,
                solution,
                difficultyCode,
                difficultyName,
            });
            return treated;
        }

        // accept ONLY matching difficulty
        if (difficultyCode === targetDifficulty) {
            const treated = treat_qq_puzzle({
                mission,
                solution,
                difficultyCode,
                difficultyName,
            });
            return treated;
        }

        // otherwise → continue loop
        // (qqwing.com frontend does exactly this)
    }
}

generateBtn.addEventListener('click', () => makeNewPuzzle());
clearBtn.addEventListener('click', () => clearPuzzle());
copyBtn.addEventListener('click', () => copyPuzzleToClipboard());


function treat_qq_puzzle(p) {
    const qqMission = p.mission ?? "";
    const qqSolution = p.solution ?? "";

    const cleanQq = (s) => s.replace(/[^0-9.]/g, "");
    const mRaw = cleanQq(qqMission);
    const sRaw = cleanQq(qqSolution);

    if (mRaw.length !== 81 || sRaw.length !== 81) {
        console.error(
            "qqwing puzzle/solution not 81 chars:",
            { mission: mRaw.length, solution: sRaw.length }
        );
        return null;
    }

    const mission = mRaw.replace(/\./g, "0");
    const solution = sRaw;

    if (!/^[1-9]{81}$/.test(solution)) {
        console.error("qqwing solution contains non-1–9 characters:", solution);
        return null;
    }

    for (let i = 0; i < 81; i++) {
        const m = mission[i];
        const sol = solution[i];
        if (m !== "0" && m !== sol) {
            console.error(
                `qqwing mismatch at index ${i}: mission=${m}, solution=${sol}`
            );
            return null;
        }
    }

    // just forward difficulty from the qqwing call
    return {
        mission,
        solution,
        difficultyCode: p.difficultyCode,
        difficultyName: p.difficultyName,
    };
}

function copyPuzzleToClipboard() {
    if (currentlyLoadedPuzzle !== null) {
        console.log("currently loaded:", currentlyLoadedPuzzle.mission, currentlyLoadedPuzzle.solution);
        navigator.clipboard.writeText(JSON.stringify(currentlyLoadedPuzzle));
    }
}