export function createUI({ game, renderer, UI_container }) {

    if (!game || !renderer) return null;

    const numpadWrapper = document.querySelector('.numpad-wrapper');
    const numpadItems = numpadWrapper?.querySelectorAll('.numpad-item');
    const numpadByValue = Array(10).fill(null);

    const canvas = renderer.canvas;

    

    UI_container.addEventListener('focus', () => {
        renderer.drawSudoku();
    });
    UI_container.addEventListener('blur', () => {
        renderer.drawSudoku({ showSelectedCell: true, showHighlighting: false });
    });

    // keyboard
    const handledKeys = new Set([
        "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "Backspace", "Delete", "Escape"
    ]);



    const UI = {
        _undo() {
            game.undo();
            renderer.drawSudoku();
        },

        _selectCell(num) {
            game.selectCell(num);
            renderer.drawSudoku();
        },

        _inputNumber(cellNum, value) {
            // console.log(`todo: implement input ${value} at [${cellNum}]`);
            game.updateCellValue(cellNum, value);
            renderer.drawSudoku();
        },

        inputFromNumpad(n) {
            const currentCell = game.currentCell;
            //  
            if (currentCell === null) {
                UI_container.focus();
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

        handleKeydown: (e) => {
            const key = e.key;
            if (!handledKeys.has(key)) return;

            let next = game.currentCell;

            switch (key) {
                case "ArrowUp":
                    if (next >= 9) next -= 9;
                    UI._selectCell(next);
                    break;

                case "ArrowDown":
                    if (next < 72) next += 9; // 72 = index of row 8 col 0
                    UI._selectCell(next);

                    break;

                case "ArrowLeft": {
                    const col = next % 9;
                    if (col > 0) next -= 1;
                    UI._selectCell(next);
                    break;
                }

                case "ArrowRight": {
                    const col = next % 9;
                    if (col < 8) next += 1;
                    UI._selectCell(next);
                    break;
                }

                case "0":
                case "Delete":
                case "Backspace": {
                    if (!game.givens[next]) {
                        UI._inputNumber(next, 0);
                    }
                    break;
                }

                case "Escape":
                    break;

                default: {
                    // default "let numbers through to here" case
                    if (!game.givens[next]) {
                        UI._inputNumber(next, Number(key))
                    }

                }
            }
        }



    };


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

    document.getElementById('sudokUndo')?.addEventListener('click', UI._undo);

    return UI;
}