export function createUI({ game, renderer, UI_container }) {

    if (!game || !renderer) return null;

    const numpadWrapper = document.querySelector('.numpad-wrapper');
    const numpadItems = numpadWrapper?.querySelectorAll('.numpad-item');
    const numpadByValue = Array(10).fill(null);

    // set up numpad 1-9 (and '0' for erase) and 'undo'
    if (numpadItems) {
        numpadItems.forEach(item => {
            const v = Number(item.dataset.value);
            item.addEventListener("click", () => UI.inputFromNumpad(v));
            if (v >= 0 && v <= 9) {
                numpadByValue[v] = item;
            }

        });
    }


    const canvas = renderer.canvas;

    
    const UI = {
        container: UI_container,
        boardInteractBlocked: false,
        boardWriteBlocked: false,
        numpadByValue: numpadByValue,

        _undo() {
            if (UI.boardInteractBlocked || UI.boardWriteBlocked) return;
            game.undo();
            renderer.drawSudoku();
        },
        _redo() {
            if (UI.boardInteractBlocked || UI.boardWriteBlocked) return;
            game.redo();
            renderer.drawSudoku();
        },

        _selectCell(num) {
            if (UI.boardInteractBlocked) return;
            game.selectCell(num);
            renderer.drawSudoku();
        },

        _inputNumber(cellNum, value) {
            if (UI.boardInteractBlocked || UI.boardWriteBlocked) {
                console.log(`INPUT BLOCKED: tried to input ${value} at cell ${cellNum}, but UI.boardWriteBlocked`);
                return;
            }
            // console.log(`todo: implement input ${value} at [${cellNum}]`);
            game.updateCellValue(cellNum, value);

            // sorta need to know if it was won here; using this as a cheap flag for "finished" 
            if (UI.boardInteractBlocked)
                return; // if interact got blocked by updateCellValue, it will handle its own render
            
            renderer.drawSudoku();
        },

        inputFromNumpad(n) {
            if (UI.boardInteractBlocked || UI.boardWriteBlocked) return;
            const currentCell = game.currentCell;
            //  
            if (currentCell === null) {
                UI.container.focus();
                game.selectCell(0);
                return;
            }

            if (!game.givens[currentCell]) {
                UI._inputNumber(currentCell, n);
            }
        },

        // DOM-specific handler
        handleCellClick(e) {
            const cell = renderer.cell;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const col = Math.floor(x / cell);
            const row = Math.floor(y / cell);
            const cellNumber = (row * 9) + col;

            UI._selectCell(cellNumber);
        },

    };



    document.getElementById('sudokUndo')?.addEventListener('click', UI._undo);
    document.getElementById('sudokRedo')?.addEventListener('click', UI._redo);

    return UI;
}