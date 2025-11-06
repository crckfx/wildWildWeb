// for a crude print as text
const testDisplay = document.querySelector('.test-display');
function printSet() {
    testDisplay.textContent = numset.includes(null) ? '____' : numset.join('');
}

// reset the numbins and the numset
function resetInputs() {
    for (let i = 0; i < slots.length; i++) {
        const input = slots[i].querySelector('input');
        input.value = '';
        numset[i] = null;
        printSet();
    }
}


// obtain the set of Numbins
const slots = document.querySelectorAll('.numbin.traingame');

const btn_toSolve = document.querySelector('.toSolve');
const btn_toReset = document.querySelector('.toReset');
// btn_toSolve.onclick = () => printSet();
btn_toReset.onclick = () => resetInputs();

// for the UI - keep a local array declared
const numset = new Array(4).fill(null);

// initial loop over the set of Numbins
for (let i = 0; i < slots.length; i++) {
    // get the Numbin node and prepare its input node
    const slot = slots[i];
    const input = slot.querySelector('input'); 
    // use number keyboard on touchscreen
    input.setAttribute('inputmode', 'numeric'); 

    // interruptions for single-digit mode including paste (and autoskip?) - possibly inefficient but it works
    input.addEventListener('beforeinput', e => {
        if (e.isComposing) return;

        const t = e.inputType;
        if (t.startsWith('delete')) return; // allow deletes

        // only handle inserts
        if (!t.startsWith('insert')) return;
        
        const data = e.data ?? '';
        const digits = data.replace(/\D/g, '');
        if (digits.length === 0) {
            e.preventDefault(); // ignore letters or symbols
            return;
        }

        // decide what to keep
        let keep;
        if (t === 'insertFromPaste') {
            // paste: keep first numeric char
            keep = digits[0];
        } else {
            // normal typing or replacement: keep last numeric char
            keep = digits[digits.length - 1];
        }

        // override normal behaviour
        e.preventDefault();
        e.target.value = keep;
        e.target.dispatchEvent(
            new InputEvent("input", {
                bubbles: true,
                inputType: "insertText"
            })
        );
    });


    // rawdog the event here seeing as how we cut it off above
    input.addEventListener("input", e => {
        const value = parseInt(input.value);
        numset[i] = value;
        printSet();

        // create autoskip behaviour for typing only
        if (e.inputType === "insertText" && input.value !== "" && i < slots.length - 1) {
            const nextNb = slots[i + 1].__numbinInstance;
            if (nextNb && nextNb.value === null) {
                setTimeout(() => nextNb.input.focus({
                    preventScroll: true
                }), 0);
            }
        }

    });
}