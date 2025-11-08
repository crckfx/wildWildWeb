// countdownGame.js
import { countdownSolve } from "/misc/tweakage/solver_x2.js";
import { runTests } from "/misc/tweakage/tester_lily.js";
import { beforeInput_range } from "/misc/numbin/numbinHandlers.js";


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
// see how necessary it is to trim and etc given the before handler. this is necessary for updating the UI with setNum, at least.
function handleInput(e, i) {
    const input = inputs[i];
    const val = input.value.trim();
    const value = val === '' ? null : parseInt(val, 10);
    setNum(i, value);

    // no autoskip for this UI mode
}

// ---------- Initialization ----------
function initSolverGame() {
    // runTests();


    targetNumber_numbinstance = targetNumberNumbin.__numbinInstance;
    if (!targetNumber_numbinstance) {
        console.error("some issue with init, couldn't find targetNumber's numbin instance", targetNumber_numbinstance);
        return;
    }
    target_min = targetNumber_numbinstance.min;
    target_max = targetNumber_numbinstance.max;

    console.log(`targetNumber_numbinstance`, targetNumber_numbinstance)
    console.log(`target_min`, target_min);
    console.log(`target_max`, target_max);

    const target_input = targetNumberNumbin.querySelector('input');
    target_input.addEventListener("beforeinput", e => beforeInput_range(e, targetNumber_numbinstance));

    // target_input.addEventListener('input', e => onInput_range(e, targetNumber_numbinstance));


    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const nb = nbs[i] = slot.__numbinInstance || null;     // resolve attached instance
        inputs[i] = slot.querySelector('input');    // resolve the input node


        // given the following code, it is likely unnecessary to store 3 separate arrays (slots, inputs, nbs).
        // the local handleInput override still relies on passing 'i', so for now we'll leave it for convenience.

        if (nb === null) {
            console.error('some issue with init, no numbin instance for', slot);
            return;
        }
        const input = nb.input;
        // apply the input overrides to the numbin
        input.addEventListener('beforeinput', e => beforeInput_range(e, nb));
        input.addEventListener('input', e => handleInput(e, i));
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


const these_tests = [
    { nums: [25, 100, 4, 9, 10, 4], target: 361 },
    { nums: [25, 75, 1, 3, 7, 10], target: 621 },
    { nums: [25, 50, 4, 2, 3, 9], target: 817 },
];
