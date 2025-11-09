// countdownGame.js
import { countdownSolve } from "/misc/tweakage/solver_x2.js";
import { runTests } from "/misc/tweakage/tester_lily.js";
import { beforeInput_range } from "/misc/numbin/numbinHandlers.js";


// ---------- DOM references ----------
const slots = document.querySelectorAll('.numbin.solverGame');
const nbs = new Array(slots.length);      // pre-sized, filled at init
// const inputs = new Array(slots.length);   // pre-sized, filled at init
const testDisplay = document.querySelector('.test-display');
const btn_toSolve = document.querySelector('.toSolve');
const btn_toReset = document.querySelector('.toReset');
const targetNumberNumbin = document.querySelector('.numbin.targetNumber');
const targetNumberInput = targetNumberNumbin.querySelector('input');
let targetNumber_numbinstance = null;


const targetRandomise = document.querySelector('.targetRandomise')
const btn_randomiseTarget = targetRandomise.querySelector('button');

const solutionsDiv = document.querySelector('.solutionsDiv');
const solutionsList = document.querySelector('.solutionsList');
const numberOfSolutions = document.querySelector('.numberOfSolutions');
const solvedNumset = document.querySelector('.solvedNumset');
const solvedTargetPrint = document.querySelector('.solvedTargetPrint');


// ---------- State ----------
const numset = new Array(slots.length).fill(null);
let solvedSet = null;
let solvedTarget = null;
let current_targetNumber = null;



// ---------- Core helpers ----------

// update crude print as text
function printSet() {
    // prints "____" until all 4 values exist
    testDisplay.textContent = numset.includes(null)
        ? ''
        : ': ' + numset.join(', ');
}

// 
function updateNumset(i, value) {
    numset[i] = value;
    const complete = !(numset.includes(null));
    console.log(`numset is complete: ${complete}`);
    if (complete) {
        btn_toSolve.classList.add('ready');
    } else {
        btn_toSolve.classList.remove('ready');
    }
    printSet();
    revalidateSolvedState();
}

function revalidateSolvedState() {
    if (!solvedSet) return;

    const sameNums = numset.every((v, j) => v === solvedSet[j]);
    const sameTarget = current_targetNumber === solvedTarget;

    if (sameNums && sameTarget) markSolved();
    else markEdited();
}


// clear all inputs + state
function resetInputs() {
    for (let i = 0; i < nbs.length; i++) {
        const nb = nbs[i];
        nb.input.value = '';
        numset[i] = null;
        slots[i].classList.remove('valid');
    }
    btn_toSolve.classList.remove('ready');
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

    solvedTargetPrint.textContent = `${target}`;

    // solutionsDiv.classList.remove('hidden');
    markSolved();
}

function clearSolutions() {
    solutionsDiv.classList.add('hidden');
    solutionsDiv.classList.remove('solved');
    numberOfSolutions.textContent = '';
    solutionsList.innerHTML = '';
    solvedSet = null;
    solvedTarget = null;
}

function markSolved() {
    solutionsDiv.classList.remove('hidden');
    solutionsDiv.classList.add('solved');
    solvedSet = [...numset];
    solvedTarget = current_targetNumber;
}

function markEdited() {
    solutionsDiv.classList.remove('solved');
}

function randomiseTarget() {
    const nb = targetNumber_numbinstance;
    if (!nb) return;

    const { min, max } = nb;
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    nb.value = rand;

    current_targetNumber = rand;
    revalidateSolvedState();
}

// ---------- Numbin input event overrides ----------
// update the UI
function handleInput(nb, i) {
    updateNumset(i, nb.value);
    // autoskip for this UI mode is handled by handleEnterKey
}

// for solverGame - autoskip if next exists; unfocus if not. doesn't care about empty
function handleEnterKey(i) {
    // disallow Enter action if this numbin's value is null
    if (nbs[i].value === null) return;
    // validate the index first
    if (i >= 0 && i < nbs.length) {
        // see if there's a next numbin in the set
        const next = nbs[i + 1];
        if (next) {
            // move to next if exists
            next.input.focus({ preventScroll: true });
        } else {
            // unfocus if no next (it's likely the last of the set)
            nbs[i].input.blur();
        }
    }
}

function findAvailableSlot() {
    for (let i = 0; i < nbs.length; i++) {
        const nb = nbs[i];
        if (!nb.value)
            return i;
    }
    return -1;
}


// ---------- Initialization ----------
function initSolverGame() {
    // TARGET NUMBER STUFF
    targetNumber_numbinstance = targetNumberNumbin.__numbinInstance;
    if (!targetNumber_numbinstance) {
        console.error("some issue with init, couldn't find targetNumber's numbin instance", targetNumber_numbinstance);
        return;
    }
    current_targetNumber = targetNumber_numbinstance.value;
    const target_input = targetNumberNumbin.querySelector('input');
    target_input.addEventListener("beforeinput", e => beforeInput_range(e, targetNumber_numbinstance));
    target_input.addEventListener("input", e => {
        // update the current guy
        current_targetNumber = targetNumber_numbinstance.value;
        revalidateSolvedState();
    });
    btn_randomiseTarget.addEventListener('click', randomiseTarget);


    // SLOTS STUFF
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];

        // given the following code, it is likely unnecessary to store 3 separate arrays (slots, inputs, nbs).
        // the local handleInput override still relies on passing 'i', so for now we'll leave it for convenience.
        // UPDATE: 'inputs' array has been nuked; it's only the 2 arrays now remaining
        const nb = nbs[i] = slot.__numbinInstance || null;     // resolve attached instance
        if (nb === null) {
            console.error('some issue with init, no numbin instance for:', slot);
            return;
        }

        slot.addEventListener('click', e => {
            if (nb.value) {
                nb.input.value = '';
                slot.classList.remove('valid');
                updateNumset(i, null);
            }            
        })

        // apply the input overrides to the numbin
        nb.handleBeforeInput = e => beforeInput_range(e, nb);
        nb.handleEnterKey = () => handleEnterKey(i); // overwrite the numbin's enter key handler
        nb.dragIncrement = 30;

        nb.input.addEventListener('input', e => handleInput(nb, i));


        nb.increment = function (dir) {
            const seq = this.sequence ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 75, 100];
            let v = this.value ?? seq[0];

            if (dir > 0) {
                for (let i = 0; i < seq.length; i++) {
                    if (seq[i] > v) { v = seq[i]; break; }
                }
            } else if (dir < 0) {
                for (let i = seq.length - 1; i >= 0; i--) {
                    if (seq[i] < v) { v = seq[i]; break; }
                }
            }

            this.value = v;
        };

        // // activate the Numbin's drag and drop stuff (for tiles)
        // slot.addEventListener('dragover', e => nb.handleDragover(e));
        // slot.addEventListener('dragleave', e => nb.handleDragEnd(e));
        // slot.addEventListener('drop', e => nb.handleDrop(e));

    }

    // COUNTDOWN TILE STUFF
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        // console.log(tile);
        const value = tile.dataset.value;
        // tile.addEventListener('dragstart', e => {
        //     e.dataTransfer.setData('text/plain', tile.dataset.value);
        //     e.dataTransfer.effectAllowed = 'copy';
        // });

        enableTilePointerDrag(tile, value)
    });

    const trainContainer = document.querySelector('.trainContainer');
    trainContainer.addEventListener('dragover', e => e.preventDefault());


    // runTests(these_tests, countdownSolve);

}

// ---------- Button bindings ----------
btn_toReset.onclick = () => resetInputs();
btn_toSolve.onclick = () => {
    if (numset.includes(null)) return;

    const target = targetNumber_numbinstance.value;

    // exit if out of bounds
    if (target < targetNumber_numbinstance.min || target > targetNumber_numbinstance.max) {
        targetNumberInput.focus();
        return;
    }

    const sols = countdownSolve(numset, target);
    solvedTarget = target;
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


function enableTilePointerDrag(tile, value) {
    let id = null;
    let clone = null;
    let offsetX = 0;
    let offsetY = 0;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    let lastTarget = null;
    let latestEvent = null;
    let rafId = null;

    const DRAG_THRESHOLD = 8;        // pixels
    const DRAG_THRESHOLD_SQ = DRAG_THRESHOLD * DRAG_THRESHOLD;

    tile.addEventListener('click', e => {
        const slot = findAvailableSlot();
        let msg;
        if (slot > -1) {
            msg = `the first available slot is ${slot}`
            // console.log(nbs[slot]);
            const nb = nbs[slot];
            nb.value = Number(value);
            slots[slot].classList.add('valid');
        } else {
            msg = `there are no available slots`;
        }
        console.log(msg);
        // console.log('clickity');
        // console.log(findAvailableSlot());
    });

    tile.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (e.button !== 0 || id !== null) return;
        id = e.pointerId;
        tile.setPointerCapture(id);

        startX = e.clientX;
        startY = e.clientY;
        dragging = false;
    });

    tile.addEventListener('pointermove', e => {
        e.preventDefault();
        if (e.pointerId !== id) return;

        latestEvent = e;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const distSq = dx * dx + dy * dy;

        // initiate drag if threshold crossed and clone not yet created
        if (!dragging && distSq > DRAG_THRESHOLD_SQ) {
            const rect = tile.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            clone = tile.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.left = `${rect.left}px`;
            clone.style.top = `${rect.top}px`;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.pointerEvents = 'none';
            clone.style.opacity = '1';
            clone.style.zIndex = '9999';
            clone.classList.add('drag-clone');
            document.body.appendChild(clone);
            console.log(`cloned ${value}`);
            dragging = true;
        }

        if (!dragging || !clone) return;

        // cancel any previously queued frame
        if (rafId !== null) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
            rafId = null;
            const ev = latestEvent;
            if (!clone || !ev) return;

            const x = ev.clientX - offsetX;
            const y = ev.clientY - offsetY;
            clone.style.left = `${x}px`;
            clone.style.top = `${y}px`;

            const dropTarget = document.elementFromPoint(ev.clientX, ev.clientY);
            const nb = dropTarget ? dropTarget.closest('.numbin') : null;

            if (nb !== lastTarget) {
                lastTarget?.classList.remove('dragover');
                nb?.classList.add('dragover');
                lastTarget = nb;
            }
        });
    }, { passive: false });

    tile.addEventListener('pointerup', e => {
        if (e.pointerId !== id) return;
        tile.releasePointerCapture(id);

        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        if (dragging && clone) {
            const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
            const nb = dropTarget ? dropTarget.closest('.numbin') : null;

            if (nb) {
                nb.__numbinInstance.value = Number(value);
                nb.classList.add('valid');
            }

        }

        lastTarget?.classList.remove('dragover');
        lastTarget = null;

        clone?.remove();
        clone = null;

        id = null;
        latestEvent = null;
        dragging = false;
    });

    tile.addEventListener('pointercancel', e => {
        if (e.pointerId === id) {
            tile.releasePointerCapture(id);

            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            lastTarget?.classList.remove('dragover');
            lastTarget = null;

            clone?.remove();
            clone = null;

            id = null;
            latestEvent = null;
            dragging = false;
        }
    });
}
