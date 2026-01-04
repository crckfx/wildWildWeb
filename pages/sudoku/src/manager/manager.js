import { puzzles, easyPuzzles, mediumPuzzles, hardPuzzles } from "/apps/sudoku/bundle/puzzles.js";
import * as storage from "./mstorage.js";
import { analyzeBoard, formatDateTime, formatDuration, rebuildRuntimeHistory } from "../static.js";
import {
    miscManagerStuff, modalContainer, panels, winOptions, winUIStuff,
    browseList_EASY, browseList_MEDIUM, browseList_HARD
} from "./mDOM.js";

export function createAppManager({ game, renderer, UI, solver }) {

    // track puzzle items
    const pi_easy = populateBrowseList(browseList_EASY, easyPuzzles);
    const pi_medium = populateBrowseList(browseList_MEDIUM, mediumPuzzles);
    const pi_hard = populateBrowseList(browseList_HARD, hardPuzzles);
    const puzzleListAllItems = { ...pi_easy, ...pi_medium, ...pi_hard };


    miscManagerStuff.btn_closeModal?.addEventListener('click', hideModal);
    miscManagerStuff.btn_resetConfirm?.addEventListener('click', resetCurrentPuzzle);
    miscManagerStuff.btn_copyBoardAsString?.addEventListener('click', copyBoardAsString);
    miscManagerStuff.btn_pasteBoardAsString?.addEventListener('click', pasteBoardAsString);


    if (modalContainer) {
        modalContainer.onclick = handleModalClick;

        modalContainer.addEventListener("keydown", (e) => {
            if (e.key !== "Escape") return;

            e.preventDefault();
            e.stopPropagation();
            hideModal();

            console.log('key ESCAPE handled on modal');
        });
    }



    function handleModalClick(e) {
        // if (!e.target.closest(".modalPanel")) {
        if (!e.target.closest(".modalContent")) {

            hideModal();
            UI.container.focus();
        }
    }

    function populateBrowseList(listEl, puzzles) {
        if (!listEl) return;

        listEl.innerHTML = "";

        const puzzleListItems = {};

        puzzles.forEach(p => {
            const li = document.createElement("li");
            li.classList.add("someButton2", "primary");

            const saved = storage.loadPuzzleState(p.id);
            if (saved && saved.completedAt) {
                li.classList.add("completed");
            }

            li.textContent = `Puzzle ${p.id}`;
            li.dataset.puzzleId = p.id;
            listEl.appendChild(li);
            li.addEventListener('click', () => manager._openPuzzleByID(p.id));

            // add item to puzzleList
            puzzleListItems[p.id] = li;
        });

        return puzzleListItems;
    }




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

        _handleGameWin() {
            console.log("heyyy its me a game win in manager");
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
        },

        hideModal,

        _openPuzzle,
        _openPuzzleByID,
        _onGameUpdate,
        _onGameHistoryMove,
        _onGameCellSelect,

        _handleKeydown,
    };

    function hideModal() {
        manager.modalIsOpen = false;
        modalContainer.classList.remove('show');
        // Object.values(panels).forEach(p => p?.classList.remove('active'));

        // cheap hardcode for copy button functionality for now
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
        // const winInfo = document.getElementById('win-info');
        const state = storage.loadPuzzleState(manager.currentPuzzleID);

        // console.log(state);
        if (winUIStuff && state) {

            console.log(`hi from prepareWinInfo`);
            // console.log(state);
            const { startedAt, completedAt, mistakes } = state;
            // const { startedAt, completedAt, mistakesMade } = game;
            const timeTaken = completedAt - startedAt;


            winUIStuff.info.startedAt.textContent = formatDateTime(startedAt);
            winUIStuff.info.completedAt.textContent = formatDateTime(completedAt);
            winUIStuff.info.mistakes.textContent = mistakes;
            winUIStuff.info.timeTaken.textContent = formatDuration(timeTaken);

            if (winOptions) {
                // 
            }
        }
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
        _syncCompletedDigits();
    }

    // a puzzle's ID is the concern of this manager; not the concern of the game, as is the storage
    function _openPuzzleByID(id, reset = false) {
        UI.boardWriteBlocked = false;
        UI.boardInteractBlocked = false;
        const puzzle = puzzles.find(p => p.id == id);
        // maybe check storage for progress first?
        const saved = storage.loadPuzzleState(id);
        storage.setActivePuzzleID(id);
        if (saved) {
            const gameHistory = rebuildRuntimeHistory(saved.history, puzzle.mission, saved.historyPos);
            saved.runtimeHistory = gameHistory; // attach a specific kind of "history" to the 'saved' object
            // if (validateGameHistory) { // or something probably}
        }

        console.log(`_openPuzzleByID: hopefully loaded puzzle ${id}`);

        manager.currentPuzzleID = id;

        console.log('---puzzleListAllItems---', puzzleListAllItems, '---/puzzleListAllItems---');


        if (miscManagerStuff.display_puzzleId) miscManagerStuff.display_puzzleId.textContent = `puzzle ${id}`;
        manager.lastCompletedDigits.fill(-1);
        manager.loadedPuzzleIsComplete = false;
        manager.lastMistakesMade = 0;
        resetManagerUI();
        game.miscOpenPuzzle(puzzle);
        assignBrowseListCurrent(id);

        hideModal();


        if (saved && reset !== true) {
            // case: we are loading some kind of history
            game.restoreHistory(saved);
            if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = game.mistakesMade;

            if (saved.completedAt) {
                // console.log("hi from manager, this saved game is finished");
                manager.loadedPuzzleIsComplete = true;
                manager._handleGameWin();
            } else {
                UI.container.focus();
                renderer.drawSudoku();

            }
        } else {
            if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = 0;
            storage.startPuzzle(puzzle);
            UI.container.focus();
            renderer.drawSudoku();


            // mark this puzzle as "not completed"
            if (puzzleListAllItems) {
                console.log("hi from openPuzzleByID, item:")
                const li = puzzleListAllItems[id];
                console.log(li);
                if (li) li.classList.remove('completed');
            }
        }
        _syncCompletedDigits();
        _onGameCellSelect();
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

    function _blockAllButtons() {
        manager.lastCompletedDigits.fill(1);
        for (let i = 0; i < 10; i++) {
            const d = i + 1;
            UI.numpadByValue[d]?.classList.add('hidden');
        }
        UI.btn_redo?.classList.add('hidden');
        UI.btn_undo?.classList.add('hidden');
    }

    function _syncCompletedDigits() {
        if (manager.loadedPuzzleIsComplete) {
            _blockAllButtons();
            return;
        }

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

        syncHistoryControls();
    }

    function resetCurrentPuzzle() {
        if (manager.currentPuzzleID !== null) {
            const id = manager.currentPuzzleID;
            manager._openPuzzleByID(id, true);

        }
    }


    // --- HANDLERS NOTIFIED BY GAME ---
    // handle cell writes
    function _onGameUpdate({ solved = false, cell, value }) {
        _syncCompletedDigits();
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
            manager._handleGameWin();
        }
    }

    // handle history steps
    function _onGameHistoryMove({ historyPos }) {
        if (this.currentPuzzleID !== null) storage.saveHistoryMove(manager.currentPuzzleID, historyPos, game.mistakesMade); // storage
        _syncCompletedDigits();
    }

    // handle cell selection
    function _onGameCellSelect() {
        const num = game.currentCell;
        const givens = game.givens;
        const val = game.cells[num];
        // console.log('m select cell:', num, givens);


        if (givens[num] || val === 0) {
            // console.log("select a cell that's given or empty (no erase)");
            UI.btn_erase?.classList.add('hidden');
        } else {
            // console.log("select an ERASABLE cell");
            UI.btn_erase?.classList.remove('hidden');
        }
    }
    // --- /HANDLERS NOTIFIED BY GAME ---

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



    // misc
    function copyBoardAsString() {
        const boardString = game.getBoardAsString();
        navigator.clipboard.writeText(boardString);
        console.log(`copied to clipboard: ${boardString}`);


        if (miscManagerStuff.btn_copyBoardAsString) {

            miscManagerStuff.btn_copyBoardAsString.classList.add('actioned');
            setTimeout(() => {
                miscManagerStuff.btn_copyBoardAsString.classList.remove('actioned');
            }, 1000)
        }

    }

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

        for (const el of Object.values(puzzleListAllItems)) {
            el.classList.remove("loaded");
        }
    }


    // for "mark current" on the puzzle button AND its tabbage page
    function assignBrowseListCurrent(id) {
        const el = puzzleListAllItems?.[id];
        if (!el) return;

        el.classList.add("loaded");

        if (miscManagerStuff.puzzleMenu) {
            //
            const switcher = miscManagerStuff.puzzleMenu;
            const currentMenuItem = switcher.querySelector(`[data-puzzle-id="${id}"]`);
            const currentPanel = currentMenuItem.closest('section.panel');        // <section data-panel="n">
            // console.log(currentPanel);
            setSwitcherActive(switcher, currentPanel.dataset.panel) // for tabbage pre-selection

        }
    }
    // COULD CALL THIS "TABBAGE API"
    function setSwitcherActive(root, key) {
        const headers = root.querySelector("[data-switch-headers]");
        const buttons = headers.querySelectorAll("[data-switch]");

        buttons.forEach(b =>
            b.classList.toggle("is-active", b.dataset.switch === key)
        );

        root.querySelectorAll("[data-panel]").forEach(p => {
            p.hidden = p.dataset.panel !== key;
        });
    }

    function resetManagerUI() {
        clearWinModal();
        resetBrowseListCurrent();
    }




    return manager;
}
// 