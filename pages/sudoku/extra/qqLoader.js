import { getCurrentBoard, openPuzzleById, precomputeNeighbours, shallowOpenPuzzle, shallowOpenPuzzleById } from "../bundle/sudoku.js";
import { bindUI } from "../bundle/sudokuUI.js";
import { coords } from "../bundle/sudokuGlobal.js";
// import { SolverAC3 } from "/apps/sudoku/bundle/SolverAC3/SolverAC3.js";
import { SolverAC3_1D } from "/apps/sudoku/bundle/SolverAC3/1D/SolverAC3_1D.js";

const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
// console.log(generateBtn, clearBtn);
const difficultyNameDisplay = document.getElementById('difficultyName');
const difficultyCodeDisplay = document.getElementById('difficultyCode');
const difficultySelector = document.getElementById('difficultySelector');

let currentlyLoadedPuzzle = null;

const launchBtn = document.getElementById('launchBtn');
const pasteBtn_JSON = document.getElementById('pasteBtn_JSON');
const pasteField_JSON = document.getElementById('pasteField_JSON');

const pasteBtn_string = document.getElementById('pasteBtn_string');
const pasteField_string = document.getElementById('pasteField_string');

const hasRichLogging =
    typeof qqwing === "function" &&
    qqwing.CRCKFX === 69;

console.log(`hasRichLogging: ${hasRichLogging}`);


// INIT
precomputeNeighbours();
// bindUI({ passive: true });
bindUI();
const result = shallowOpenPuzzleById(1);
console.log("result:");
console.log(result)

function makeNewPuzzle() {
    const targetDifficulty = parseInt(difficultySelector.value, 10);
    const puzzle = get_qq_puzzle(targetDifficulty);
    // console.log(puzzle);
    shallowOpenPuzzle(puzzle);
    currentlyLoadedPuzzle = puzzle;
    difficultyCodeDisplay.textContent = puzzle.difficultyCode;
    // difficultyNameDisplay.textContent = `(${puzzle.difficultyName})`;

}
function clearPuzzle() {
    shallowOpenPuzzleById(1); // using 1 (not 0) for 'blank with no solution' to see how it propagates

    // todo: change architecture so that an empty board can be "soft loaded"

    difficultyCodeDisplay.textContent = "";
    // difficultyNameDisplay.textContent = "";
    currentlyLoadedPuzzle = null;
}


function get_qq_puzzle(targetDifficulty) {
    for (; ;) {
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
        // const difficultyName = qq.getDifficultyAsString();

        // --- end core generation block ---

        // accept ANY difficulty
        if (targetDifficulty === 0) {
            const treated = treat_qq_puzzle({
                mission,
                solution,
                difficultyCode,
            });
            return treated;
        }

        // accept ONLY matching difficulty
        if (difficultyCode === targetDifficulty) {
            const treated = treat_qq_puzzle({
                mission,
                solution,
                difficultyCode,
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
pasteBtn_JSON.addEventListener('click', () => launchFrom_paste_JSON());
pasteBtn_string.addEventListener('click', () => launchFrom_paste_string());

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
        // difficultyName: p.difficultyName,
    };
}

function launchFrom_paste_string() {
    // now the real work begins
    const text = pasteField_string.value.trim();
    const textValid = (text.length === 81 && /^[0-9.]+$/.test(text));

    const solution_qq = get_qq_solution(text).trim();
    const solution_ac3 = get_ac3_solution(text);
    console.log('ac3 sol:', solution_ac3);
    const hasSolution = solution_qq ? true : false;

    console.log(`text (length: ${text.length}, valid: ${textValid}, hasSolution: ${!(!solution_qq)}):`);

    if (textValid && hasSolution) {

        const puzzle = {
            mission: text,
            solution: solution_qq
        }

        console.log("puzzle:");
        console.log(puzzle)

        pasteField_string.value = "";
        currentlyLoadedPuzzle = puzzle;
        shallowOpenPuzzle(puzzle);
    } else {
        console.log("misfire in paste string or otherwise could not solve");
    }

}

function launchFrom_paste_JSON() {
    const text = pasteField_JSON.value.trim();
    // let puzzle;

    const result = validatePuzzleJSON(text);
    if (!result.ok) {
        console.error(result.error);
        return;
    }
    const puzzle = result.puzzle;

    pasteField_JSON.value = "";
    currentlyLoadedPuzzle = puzzle;
    shallowOpenPuzzle(puzzle);

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

const getClueBtn = document.getElementById('getClueBtn');
getClueBtn.addEventListener('click', () => {
    const clue = get_QQ_clue();
})

function get_QQ_clue() {
    // take a puzzle, solve it with qqwing, walk back to the first valid move made to produce a "hint"
    // optionally it could tell us how the hint was derived so we could show the derivation with visual cues
    const qq = new qqwing();
    qq.setRecordHistory(true);
    qq.setPrintStyle(qqwing.PrintStyle.ONE_LINE);

    const board = getCurrentBoard();
    const missionString = board.asString;
    qq.setPuzzle(board.asArray);


    qq.solve();
    const solution = qq.getSolutionString();

    const qqSolveInstructions = qq.getSolveInstructions();
    const difficultyCode = qq.getDifficulty();

    const treated = treat_qq_puzzle({
        mission: missionString,
        solution: solution,
        difficultyCode: difficultyCode,
    });
    // return treated;

    if (treated.solution === currentlyLoadedPuzzle?.solution) {
        console.log("solution is correct")

        const clue = extractFirstClueFromInstructions(qqSolveInstructions);
        const clueCoords = coords[clue.index];
        console.log(clue);
        console.log(clueCoords.row, clueCoords.col, clue.conditionalOnGuess);


        // console.table(dumpRaw(qqSolveInstructions));

        if (hasRichLogging) {
            const instr = qqSolveInstructions[clue.stepIndex];

            if (instr?.pair) {
                console.log("RICH CLUE CONTEXT:");
                console.log({
                    technique: instr.getDescription(),
                    pairCells: instr.pair.cells.map(i => coords[i]),
                    pairValues: instr.pair.values
                });
            }
        }


    } else {

        console.log("solution is incorrect");
    }

    return null;

}

function extractFirstClueFromInstructions(instructions) {
    let seenGuess = false;

    for (let i = 0; i < instructions.length; i++) {
        const item = instructions[i];
        const type = item.getType();

        if (type === qqwing.LogType.GUESS) {
            seenGuess = true;
            continue; // don't return guesses as clues
        }

        const value = item.getValue();
        const position = item.getPosition();
        // if (value <= 0 || position < 0) continue;

        // allow elimination-only steps you explicitly want (even though value===0)
        const allowEliminationClue =
            hasRichLogging &&
            (type === qqwing.LogType.NAKED_PAIR_ROW); // extend later if you want

        // the original gate, but bypassed for allowed elimination steps
        if (!allowEliminationClue && (value <= 0 || position < 0)) continue;


        if (
            type === qqwing.LogType.SINGLE ||
            type === qqwing.LogType.HIDDEN_SINGLE_ROW ||
            type === qqwing.LogType.HIDDEN_SINGLE_COLUMN ||
            type === qqwing.LogType.HIDDEN_SINGLE_SECTION ||
            allowEliminationClue
        ) {
            return {
                index: position,
                value,
                type,
                description: item.getDescription(),
                stepIndex: i,                 // index in solveInstructions
                conditionalOnGuess: seenGuess // the important meaning bit
            };
        }
    }
    return null;
}

function dumpRaw(instructions) {
    return instructions.map((item, i) => ({
        step: i,                 // array order = chronology
        type: item.getType(),    // raw enum number
        round: item.getRound(),  // recursion depth
        index: item.getPosition(),
        value: item.getValue()
    }));
}



function get_qq_solution(missionString) {
    const qq = new qqwing();
    qq.setRecordHistory(true);
    qq.setPrintStyle(qqwing.PrintStyle.ONE_LINE);

    const board = new Array(81);
    for (let i = 0; i < 81; i++) {
        board[i] = missionString.charCodeAt(i) - 48;
    }

    if (!qq.setPuzzle(board)) {
        return null;
    }

    if (!qq.solve()) {
        return null;
    }

    const solution = qq.getSolutionString();
    return solution; // ← this string you logged IS correct
}

function get_ac3_solution(missionString) {
    const solver = new SolverAC3_1D();
    
    // parse
    const grid = solver.parsePuzzle(missionString);

    // solve
    const result = solver.solve(grid);
    return result;
}
// console.log(get_qq_solution("617023504400056100500104060854217639276389451193465278045602810782531946061048025"));

// 103: 219653478486917532375824961928361754657498213143275896764532189831749625592186307
// 402 (text): 617023504400056100500104060854217639276389451193465278045602810782531946061048025
// 402 (json): {"mission":"617023504400056100500104060854217639276389451193465278045602810782531946061048025","solution":"617823594439756182528194367854217639276389451193465278945672813782531946361948725"}