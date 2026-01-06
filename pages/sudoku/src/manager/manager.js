import { puzzles } from "/apps/sudoku/bundle/puzzles.js";
import * as storage from "./mstorage.js";
import { analyzeBoard, formatDateTime, formatDuration, rebuildRuntimeHistory } from "../static.js";
import { assignBrowseListCurrent, miscManagerStuff, modalContainer, panels, puzzleListAllItems, winOptions, winUIStuff, } from "./mDOM.js";

export function createAppManager({ game, renderer, UI, solver }) {
    const manager = {
        solver,

        currentPuzzleID: null,
        modalIsOpen: false,
        lastCompletedDigits: new Uint8Array(9).fill(0), // all zero by default
        lastMistakesMade: 0,

        loadedPuzzleIsComplete: false,

        modalContainer,

        _showNew() { showModal('new'); },
        _showBrowse() { showModal('browse'); },
        _showDev() { showModal('dev'); },
        _showReset() { showModal('reset'); },
        _showWin() {
            prepareWinInfo();
            showModal('win');
        },


        hideModal,

        _openPuzzle,                // generic puzzle open
        _openPuzzleByID,            // open from manager's loaded set
        _onGameUpdate,              // 
        _onGameHistoryMove,         //
        _onGameCellSelect,          //
        _handleKeydown,             //
        _handleGameWin,             // 
    };



    miscManagerStuff.btn_closeModal?.addEventListener('click', hideModal);
    miscManagerStuff.btn_resetConfirm?.addEventListener('click', resetCurrentPuzzle);
    miscManagerStuff.btn_copyBoardAsString?.addEventListener('click', copyBoardAsString);
    miscManagerStuff.btn_pasteBoardAsString?.addEventListener('click', pasteBoardAsString);

    // puzzleListAllItems.forEach(li => {
    //     // console.log("hi",li);
    //     li.addEventListener('click', () => manager._openPuzzleByID(p.id));
    // })

    for (const id in puzzleListAllItems) {
        const el = puzzleListAllItems[id];
        el?.addEventListener('click', () => manager._openPuzzleByID(id));
    }

    if (modalContainer) {
        modalContainer.addEventListener("click", handleModalClick);
        modalContainer.addEventListener("keydown", handleModalKey);
    }

    function handleModalClick(e) {
        if (!e.target.closest(".modalContent")) {
            hideModal();
            UI.container.focus();
        }
    }

    function handleModalKey(e) {
        if (e.key !== "Escape") return; // crudely handle only escape for now
        e.preventDefault();
        e.stopPropagation();

        hideModal();
        // console.log('key ESCAPE handled on modal');
    }

    function hideModal() {
        manager.modalIsOpen = false;
        modalContainer.classList.remove('show');
        // Object.values(panels).forEach(p => p?.classList.remove('active'));

        // cheap safety hardcode for "copy" button's feedback (for now)
        miscManagerStuff.btn_copyBoardAsString?.classList.remove('actioned');
        UI.container.focus();
    }

    function showModal(name) {
        const panel = panels[name];
        if (!panel) return;
        manager.modalIsOpen = true;

        Object.values(panels).forEach(p => p?.classList.remove('active'));
        modalContainer.classList.add('show');
        panel.classList.add('active');
        modalContainer.focus(); // <-- new
    }

    function clearWinModal() {
        winUIStuff.info.startedAt.textContent = "?";
        winUIStuff.info.completedAt.textContent = "?";
        winUIStuff.info.mistakes.textContent = "?";
        winUIStuff.info.timeTaken.textContent = "?";
    }

    function prepareWinInfo() {
        // for printing the appropriate info into the "win modal" before showing it
        if (!winUIStuff) return; // winUIStuff is the set of DOM data boxes for the modal page for a game win
        // const winInfo = document.getElementById('win-info');
        const storedState = storage.loadPuzzleState(manager.currentPuzzleID);


        // console.log(storedState);
        // if (storedState) {

        //     console.log(`hi from prepareWinInfo`);
        //     const { startedAt, completedAt, mistakes } = storedState;
        //     // const { startedAt, completedAt, mistakesMade } = game;
        //     const timeTaken = completedAt - startedAt;


        //     winUIStuff.info.startedAt.textContent = formatDateTime(startedAt);
        //     winUIStuff.info.completedAt.textContent = formatDateTime(completedAt);
        //     winUIStuff.info.mistakes.textContent = mistakes;
        //     winUIStuff.info.timeTaken.textContent = formatDuration(timeTaken);

        //     if (winOptions) {
        //         // 
        //     }
        // } else {
        //     const { startedAt, completedAt, mistakesMade } = game;
        //     // const { startedAt, completedAt, mistakesMade } = game;

        //     console.log(`startedAt ${startedAt}, completedAt ${completedAt}, mistakesMade ${mistakesMade}`);
        //     const timeTaken = completedAt - startedAt;


        //     winUIStuff.info.startedAt.textContent = formatDateTime(startedAt);
        //     winUIStuff.info.completedAt.textContent = formatDateTime(completedAt);
        //     winUIStuff.info.mistakes.textContent = mistakesMade;
        //     winUIStuff.info.timeTaken.textContent = formatDuration(timeTaken);
        // }

        const { startedAt, completedAt, mistakesMade } = game;
        // const { startedAt, completedAt, mistakesMade } = game;

        const timeTaken = completedAt - startedAt;
        console.log(`startedAt ${startedAt}, completedAt ${completedAt}, mistakesMade ${mistakesMade}, timeTaken ${timeTaken}`);


        winUIStuff.info.startedAt.textContent = formatDateTime(startedAt);
        winUIStuff.info.completedAt.textContent = formatDateTime(completedAt);
        winUIStuff.info.mistakes.textContent = mistakesMade;
        winUIStuff.info.timeTaken.textContent = formatDuration(timeTaken);

    }

    function _openPuzzle(p) {
        manager.currentPuzzleID = null; // this doesn't necessarily belong here?
        manager.lastCompletedDigits.fill(-1);
        manager.loadedPuzzleIsComplete = false;
        resetManagerUI();
        game.miscOpenPuzzle(p);
        if (miscManagerStuff.display_puzzleId) miscManagerStuff.display_puzzleId.textContent = "pasted puzzle";
        const mistakesMade = game.mistakesMade;
        manager.lastMistakesMade = mistakesMade;
        if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = mistakesMade;
        hideModal();
        UI.container.focus();
        renderer.drawSudoku();
        _onGameCellSelect();
        _syncGameButtons();
    }

    // a puzzle's ID is the concern of this manager; not the concern of the game, as is the storage
    function _openPuzzleByID(id, reset = false) {
        UI.boardWriteBlocked = false;
        UI.boardInteractBlocked = false;
        const puzzle = puzzles.find(p => p.id == id);
        // console.log(`_openPuzzleByID: hopefully loaded puzzle ${id}`);
        manager.currentPuzzleID = id;
        // console.log('---puzzleListAllItems---', puzzleListAllItems, '---/puzzleListAllItems---');
        if (miscManagerStuff.display_puzzleId) miscManagerStuff.display_puzzleId.textContent = `puzzle ${id}`;
        manager.lastCompletedDigits.fill(-1);
        manager.loadedPuzzleIsComplete = false;
        manager.lastMistakesMade = 0;


        game.miscOpenPuzzle(puzzle);

        // maybe check storage for progress first?
        storage.setActivePuzzleID(id);
        const saved = storage.loadPuzzleState(id);
        if (saved) {
            const gameHistory = rebuildRuntimeHistory(saved.history, puzzle.mission);
            saved.runtimeHistory = gameHistory; // attach a specific kind of "history" to the 'saved' object
            // if (validateGameHistory) { // or something probably}

        }


        resetManagerUI();

        assignBrowseListCurrent(id);

        hideModal();


        if (saved && reset !== true) {
            // case: we are loading some kind of history without resetting it
            game.restoreHistory(saved);
            game.startedAt = saved.startedAt ?? null;
            game.completedAt = saved.completedAt ?? null;
          
            if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = game.mistakesMade;

            if (saved.completedAt) {
                // case: we have loaded history and it is finished
                manager.loadedPuzzleIsComplete = true;
                _handleGameWin();
            } else {
                // case: we have loaded history and it is NOT finished
                UI.container.focus();
                renderer.drawSudoku();

            }
        } else {
            // case: we are NOT loading any history (note: "reset===true" also means we load 'source' - NOT history)
            if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = 0;
            storage.startPuzzle(puzzle);

            // mark this puzzle as "not completed"
            if (puzzleListAllItems) {
                console.log("hi from openPuzzleByID, item:")
                // const li = puzzleListAllItems[id];
                const li = puzzleListAllItems[id];
                console.log(li);
                if (li) li.classList.remove('completed');
            }
            UI.container.focus();
            renderer.drawSudoku();
        }
        _syncGameButtons();
        _onGameCellSelect();
    }

    // --- FUNCTIONS TO SYNC DOM ELEMENTS ---
    function _syncGameButtons() {
        // completeness gate can live in this check instead of inside the functions it calls
        if (manager.loadedPuzzleIsComplete) {
            _blockAllButtons();
            return;
        }

        syncCompletedDigits();
        syncHistoryControls();
    }

    function syncHistoryControls() {
        const historyPos = game.historyPos;
        // state for undo

        if (historyPos < 1) {
            UI.btn_undo?.classList.add('hidden');
        } else {
            UI.btn_undo?.classList.remove('hidden');
        }
        // state for redo
        if (historyPos >= game.gameHistory.length) {
            UI.btn_redo?.classList.add('hidden');
        } else {
            UI.btn_redo?.classList.remove('hidden');
        }
    }


    function syncCompletedDigits() {
        const curr = analyzeBoard(game.cells, game.solution).completedDigits;

        for (let d = 0; d < 9; d++) {
            if (curr[d] !== manager.lastCompletedDigits[d]) {
                const digit = d + 1;

                if (curr[d]) {
                    UI.numpadByValue[digit]?.classList.add("hidden");
                } else {
                    UI.numpadByValue[digit]?.classList.remove("hidden");
                }
            }
        }
        manager.lastCompletedDigits.set(curr);
    }


    function _blockAllButtons() {
        manager.lastCompletedDigits.fill(-1);
        for (let i = 0; i < 10; i++) {
            const d = i + 1;
            
            UI.numpadByValue[i]?.classList.add('hidden');
        }
        UI.btn_redo?.classList.add('hidden');
        UI.btn_undo?.classList.add('hidden');
    }
    // --- /FUNCTIONS TO SYNC DOM ELEMENTS ---


    // --- HANDLERS NOTIFIED BY GAME ---
    // handle cell writes
    function _onGameUpdate({ solved = false, cell, value }) {
        _syncGameButtons();
        _onGameCellSelect();
        // console.log(`hello from gameUpdate, completedDigits:`, manager.lastCompletedDigits);

        const mistakesMade = game.mistakesMade;
        // --- miscManagerStuff ---
        if (mistakesMade !== manager.lastMistakesMade) {
            manager.lastMistakesMade = mistakesMade;
            if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = mistakesMade;
        }

        if (manager.currentPuzzleID !== null) storage.saveMove(manager.currentPuzzleID, cell, value, mistakesMade, solved); // storage 

        if (solved === true) {
            console.log("----------------------");
            console.log("SOLVED THE PUZZLE");
            console.log("----------------------");
            _handleGameWin();
        }
    }

    // handle history steps
    function _onGameHistoryMove({ historyPos }) {
        if (this.currentPuzzleID !== null) storage.saveHistoryMove(manager.currentPuzzleID, historyPos, game.mistakesMade); // storage
        _syncGameButtons();
    }

    // handle cell selection
    function _onGameCellSelect() {
        const num = game.currentCell;
        const givens = game.givens;
        const val = game.cells[num];

        if (givens[num] || val === 0) {
            // console.log("select a cell that's given or empty (no erase)");
            UI.btn_erase?.classList.add('hidden');
        } else {
            // console.log("select an ERASABLE cell");
            UI.btn_erase?.classList.remove('hidden');
        }
    }
    // --- /HANDLERS NOTIFIED BY GAME ---
    function _handleGameWin() {
        // console.log("heyyy its me a game win in manager");
        UI.boardWriteBlocked = true;
        UI.boardInteractBlocked = true;


        const li = puzzleListAllItems[manager.currentPuzzleID];
        if (li) li.classList.add('completed');

        // if (UI.numpadByValue[0]) console.log(`yes there's any erase button`);
        UI.btn_erase?.classList.add('hidden');
        UI.btn_undo?.classList.add('hidden');
        UI.btn_redo?.classList.add('hidden');
        console.log('added hidden to all 3 thangs')


        renderer.drawSudoku({ showSelectedCell: false, showHighlighting: false });

        manager._showWin();
    }

    // 

    // keyboard
    const handledKeys = new Set([
        "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "Backspace", "Delete", "Escape"
    ]);


    function _handleKeydown(e) {
        const key = e.key;
        if (!handledKeys.has(key)) return;
        e.preventDefault();

        if (manager.modalIsOpen) {
            // console.log("yep you made a key input while modal is open!");
            switch (key) {
                case "Escape":
                    manager.hideModal();
                    break;
                default:
                    console.log(`modal is open, pressed key "${key}", but it's not handled for modal`);
            }
            return;
        }

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



    // --- misc ---

    function resetCurrentPuzzle() {
        if (manager.currentPuzzleID !== null) {
            const id = manager.currentPuzzleID;
            manager._openPuzzleByID(id, true);
        }
    }

    // get board from game and copy it to clipboard as 81-char string
    function copyBoardAsString() {
        const boardString = game.getBoardAsString();
        navigator.clipboard.writeText(boardString);
        console.log(`copied to clipboard: ${boardString}`);

        // presuming we're using this designated button to action the copy, show feedback on it
        if (miscManagerStuff.btn_copyBoardAsString) {
            miscManagerStuff.btn_copyBoardAsString.classList.add('actioned');
            setTimeout(() => {
                miscManagerStuff.btn_copyBoardAsString.classList.remove('actioned');
            }, 1000)
        }
    }

    // use a dedicated pasteBox
    function pasteBoardAsString() {
        if (!miscManagerStuff.field_pasteBoardAsString) return;

        const text = miscManagerStuff.field_pasteBoardAsString.value.trim();

        const textValid = (text.length === 81 && /^[0-9.]+$/.test(text));
        // note: we have mission text CANNOT YET RUN THIS properly because _openPuzzle expects JSON with solution
        if (textValid) {
            loadPuzzleFromString(text);
        };
    }

    function loadPuzzleFromString(text) {
        console.log(text);
        // console.log(manager.solver);
        const solver = manager.solver;
        const grid = solver.parsePuzzle(text)
        // solve
        const result = solver.solve(grid);
        if (result.sudoku) {
            const solution = result.sudoku.join("");

            const fullPuzzle = {
                mission: text,
                solution: solution
            }
            // console.log(fullPuzzle);

            manager._openPuzzle(fullPuzzle);
        }

    }

    function resetBrowseListCurrent() {
        if (!puzzleListAllItems) return;

        for (const id in puzzleListAllItems) {
            const el = puzzleListAllItems[id];
            el?.classList.remove("loaded");
        }
    }




    function resetManagerUI() {
        clearWinModal();
        resetBrowseListCurrent();
    }




    return manager;
}
// 