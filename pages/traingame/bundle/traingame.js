// traingame.js
import { countdownSolve } from "./solver.js";

// ---------- DOM references ----------
const slots = document.querySelectorAll('.numbin.traingame');
const nbs = new Array(slots.length);      // pre-sized, filled at init
const inputs = new Array(slots.length);   // pre-sized, filled at init
const testDisplay = document.querySelector('.test-display');
const btn_toSolve = document.querySelector('.toSolve');
const btn_toReset = document.querySelector('.toReset');
const numberOfSolutions = document.querySelector('.numberOfSolutions');
const solutionsList = document.querySelector('.solutionsList');
const targetNumberNumbin = document.querySelector('.numbin.targetNumber');
const targetNumberInput = targetNumberNumbin.querySelector('input');

// ---------- State ----------
const numset = new Array(slots.length).fill(null);

// ---------- Core helpers ----------

// update crude print as text
function printSet() {
    // prints "____" until all 4 values exist
    testDisplay.textContent = numset.includes(null)
        ? '____'
        : numset.join('');
}

// set a numeric slot value (centralized)
function setNum(i, val) {
    numset[i] = val;
    printSet();
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
    for (let i=0; i<sols.length; i++) {
        html+= `<li>${sols[i]}</li>`;
    }
    
    
    
    numberOfSolutions.textContent = `Found ${sols.length} solutions`;
    solutionsList.innerHTML = html;
    
}

function clearSolutions() {
    numberOfSolutions.textContent = '';
}

// ---------- Numbin input event overrides ----------

// interruptions for single-digit mode including paste (and autoskip?)
// possibly inefficient but it works
function handleBeforeInput(e) {
    if (e.isComposing) return;

    const t = e.inputType;
    if (t.startsWith('delete')) return; // allow deletes
    if (!t.startsWith('insert')) return;

    const data = e.data ?? '';
    const digits = data.replace(/\D/g, '');
    if (digits.length === 0) {
        e.preventDefault(); // ignore letters or symbols
        return;
    }

    // decide what to keep
    const keep = t === 'insertFromPaste'
        ? digits[0]               // paste: keep first numeric char
        : digits[digits.length - 1]; // normal typing: keep last numeric char

    // override normal behaviour
    e.preventDefault();
    e.target.value = keep;
    e.target.dispatchEvent(
        new InputEvent('input', {
            bubbles: true,
            inputType: 'insertText'
        })
    );
}

// rawdog the event here seeing as how we cut it off above
function handleInput(e, i) {
    const input = inputs[i];
    const val = input.value.trim();
    const value = val === '' ? null : parseInt(val, 10);
    setNum(i, value);

    // create autoskip behaviour for typing only
    if (e.inputType === 'insertText' && val !== '' && i < inputs.length - 1) {
        const nextNb = nbs[i + 1];
        if (nextNb && nextNb.value === null) {
            setTimeout(() => {
                nextNb.input.focus({ preventScroll: true });
            }, 0);
        }
    }
}

// ---------- Initialization ----------
function initTrainGame() {
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        nbs[i] = slot.__numbinInstance || null;     // resolve attached instance
        inputs[i] = slot.querySelector('input');    // resolve the input node

        // use number keyboard on touchscreen
        inputs[i].setAttribute('inputmode', 'numeric');

        // apply the input overrides to the numbin
        inputs[i].addEventListener('beforeinput', handleBeforeInput);
        inputs[i].addEventListener('input', e => handleInput(e, i));
    }
}

// ---------- Button bindings ----------
btn_toReset.onclick = () => resetInputs();
btn_toSolve.onclick = () => {
    if (numset.includes(null)) return;

    const target = targetNumberInput.value;

    const sols = countdownSolve(numset, target);
    console.group(`nums=${numset.join(',')} target=${target}`);
    console.log(`Total solutions: ${sols.length}`);
    console.log(sols);
    console.groupEnd();
    printSolutions(numset, target, sols);
}

// ---------- Loader ----------
document.addEventListener('DOMContentLoaded', initTrainGame);
