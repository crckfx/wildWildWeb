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

// const copyBtn = document.getElementById('copyBtn');

let currentlyLoadedPuzzle = null;

const launchBtn = document.getElementById('launchBtn');
const pasteBtn = document.getElementById('pasteBtn');
const pasteField = document.getElementById('pasteField');

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
launchBtn.addEventListener('click', () => console.log("launch some puzzle?"));
pasteBtn.addEventListener('click', () => launchFromPaste());

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

function launchFromPaste() {
    const text = pasteField.value;

    const result = validatePuzzleJSON(text);
    if (!result.ok) {
        console.error(result.error);
        return;
    }

    const { mission, solution } = result.puzzle;
    console.log("valid puzzle", mission, solution);

    pasteField.value = "";
    shallowOpenPuzzle(result.puzzle);
    currentlyLoadedPuzzle = result.puzzle;


}

function validatePuzzleJSON(text) {
    let obj;

    // 1. Must be valid JSON
    try {
        obj = JSON.parse(text);
    } catch (e) {
        return { ok: false, error: "Invalid JSON" };
    }

    // 2. Must be a plain object
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        return { ok: false, error: "JSON is not an object" };
    }

    const { mission, solution } = obj;

    // 3. Required fields
    if (typeof mission !== "string" || typeof solution !== "string") {
        return { ok: false, error: "mission and solution must be strings" };
    }

    // 4. Length check
    if (mission.length !== 81 || solution.length !== 81) {
        return { ok: false, error: "mission and solution must be 81 characters" };
    }

    // 5. Character set check (digits only)
    if (!/^[0-9]{81}$/.test(mission) || !/^[0-9]{81}$/.test(solution)) {
        return { ok: false, error: "mission/solution must contain only digits 0–9" };
    }

    return { ok: true, puzzle: obj };
}

function getClue() {
    // take a puzzle, solve it with qqwing, walk back to the first valid move made to produce a "hint"
    // optionally it could tell us how the hint was derived so we could show the derivation with visual cues
}