// countdownGame.js
import { countdownSolve } from "/misc/tweakage/solver_x2.js";
import { runTests } from "/misc/tweakage/tester_lily.js";


// ---------- DOM references ----------
const slots = document.querySelectorAll('.numbin.solverGame');
const nbs = new Array(slots.length);      // pre-sized, filled at init
const inputs = new Array(slots.length);   // pre-sized, filled at init
const testDisplay = document.querySelector('.test-display');
const btn_toSolve = document.querySelector('.toSolve');
const btn_toReset = document.querySelector('.toReset');
const targetNumberNumbin = document.querySelector('.numbin.targetNumber');
const targetNumberInput = targetNumberNumbin.querySelector('input');
let targetNumber_numbinstance = null;
let target_min = -1; // useless values
let target_max = -1; // useless values


const solutionsDiv = document.querySelector('.solutionsDiv');
const solutionsList = document.querySelector('.solutionsList');
const numberOfSolutions = document.querySelector('.numberOfSolutions');
const solvedNumset = document.querySelector('.solvedNumset');

// ---------- State ----------
const numset = new Array(slots.length).fill(null);
let solvedSet = null;

// ---------- Core helpers ----------

// update crude print as text
function printSet() {
    // prints "____" until all 4 values exist
    testDisplay.textContent = numset.includes(null)
        ? ''
        : ': ' + numset.join(', ');
}

function setNum(i, val) {
    numset[i] = val;
    printSet();

    if (!solvedSet) return;
    const same = numset.every((v, j) => v === solvedSet[j]);
    if (same) markSolved();
    else markEdited();
}

// clear all inputs + state
function resetInputs() {
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
        numset[i] = null;
    }
    printSet(); // single call at end
    clearSolutions();
}

function printSolutions(numset, target, sols) {
    let html = '';
    for (let i = 0; i < sols.length; i++) {
        html += `<li>${sols[i]} = ${target}</li>`;
    }

    numberOfSolutions.textContent = `${sols.length} `;
    solvedNumset.textContent = numset.join(', ');
    solutionsList.innerHTML = html;

    // solutionsDiv.classList.remove('hidden');
    markSolved();
}

function clearSolutions() {
    solutionsDiv.classList.add('hidden');
    solutionsDiv.classList.remove('solved');
    numberOfSolutions.textContent = '';
    solutionsList.innerHTML = '';
    solvedSet = null;
}

function markSolved() {
    solutionsDiv.classList.remove('hidden');
    solutionsDiv.classList.add('solved');
    solvedSet = [...numset];
}

function markEdited() {
    solutionsDiv.classList.remove('solved');
}


// ---------- Numbin input event overrides ----------

// allow only digits via regex, 
function handleBeforeInput(e, i) {
    if (e.isComposing) return;

    const t = e.inputType;
    if (t.startsWith('delete')) return;
    if (!t.startsWith('insert')) return;

    const data = e.data ?? '';
    const digits = data.replace(/\D/g, '');
    if (!digits) {
        e.preventDefault();
        return;
    }

    const input = inputs[i];
    const nb = nbs[i];
    if (!nb) return;

    const min = nb.min;
    const max = nb.max;

    // accumulate typed digits
    const next = (input.value + digits).replace(/\D/g, '').slice(0, 3);
    const n = parseInt(next, 10);

    // clamp within valid range
    const clipped = Math.min(Math.max(n, min), max);
    const str = Number.isFinite(clipped) ? String(clipped) : '';

    e.preventDefault();
    input.value = str;
    input.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType: 'insertText' })
    );
}


// rawdog the event here seeing as how we cut it off above
function handleInput(e, i) {
    const input = inputs[i];
    const val = input.value.trim();
    const value = val === '' ? null : parseInt(val, 10);
    setNum(i, value);

    // no autoskip for countdown
}

// ---------- Initialization ----------
function initSolverGame() {
    // runTests();
    

    targetNumber_numbinstance = targetNumberNumbin.__numbinInstance;
    target_min = targetNumber_numbinstance.min;
    target_max = targetNumber_numbinstance.max;

    console.log(`targetNumber_numbinstance`, targetNumber_numbinstance)
    console.log(`target_min`, target_min);
    console.log(`target_max`, target_max);

    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        nbs[i] = slot.__numbinInstance || null;     // resolve attached instance
        inputs[i] = slot.querySelector('input');    // resolve the input node

        // use number keyboard on touchscreen
        inputs[i].setAttribute('inputmode', 'numeric');

        // apply the input overrides to the numbin
        inputs[i].addEventListener('beforeinput', e => handleBeforeInput(e, i));
        inputs[i].addEventListener('input', e => handleInput(e, i));
    }
    runTests(these_tests, countdownSolve);

}

// ---------- Button bindings ----------
btn_toReset.onclick = () => resetInputs();
btn_toSolve.onclick = () => {
    if (numset.includes(null)) return;
    
    const target = Number(targetNumberInput.value);
    if (target < target_min || target > target_max) return;
    
    const sols = countdownSolve(numset, target);
    console.group(`nums=${numset.join(',')} target=${target}`);
    console.log(`Total solutions: ${sols.length}`);
    console.log(sols);
    console.groupEnd();
    printSolutions(numset, target, sols);
}



// ---------- Loader ----------
document.addEventListener('DOMContentLoaded', initSolverGame);


// function runTests() {
//     // console.clear();
//     console.log("Countdown Numbers Solver");
//     const t0 = performance.now();
    
//     const tests = [
//         { nums: [4, 9, 10, 11], target: 36, expected: 7},
//         { nums: [1, 3, 7, 10], target: 21, expected: 24 },
//         { nums: [4, 2, 3, 9], target: 10, expected: 33 },
//         { nums: [2, 5, 7, 10], target: 17 },    // overlapping additive/multiplicative paths
//         { nums: [3, 4, 6, 8], target: 24 },     // factorial-like, multiple 24s via ×/+
//         { nums: [2, 3, 5, 8], target: 9 },      // nested division, bracket depth differences        
//     ];
    
//     for (const t of tests) {
//         const opts = { allowDecimal: t.allowDecimal ?? false, maxSolutions: 500 };
//         const sols = countdownSolve(t.nums, t.target, opts);
//         console.group(`nums=${t.nums.join(',')} target=${t.target} decimals=${opts.allowDecimal}`);
//         console.log(`Total solutions: ${sols.length}`);
//         console.log(sols);
//         console.groupEnd();
//     }
//     const t1 = performance.now();
//     console.log(`Total time: ${(t1-t0).toFixed(1)} ms`);

// }

const these_tests = [
    { nums: [25, 100, 4, 9, 10, 4], target: 361 },
    { nums: [25, 75, 1, 3, 7, 10], target: 621 },
    { nums: [25, 50, 4, 2, 3, 9], target: 817 },
    // { nums: [2, 5, 7, 10], target: 17 },    // overlapping additive/multiplicative paths
    // { nums: [3, 4, 6, 8], target: 24 },     // factorial-like, multiple 24s via ×/+
    // { nums: [2, 3, 5, 8], target: 9 },      // nested division, bracket depth differences        
];
