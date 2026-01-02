import { puzzles, easyPuzzles, mediumPuzzles, hardPuzzles } from "/apps/sudoku/bundle/puzzles.js";
import * as storage from "./mstorage.js";
import { formatDateTime, formatDuration } from "../static.js";

export function createAppManager({ game, renderer, UI, solver }) {

    const modalContainer = document.getElementById('modalContainer');

    // win panel stuff
    const winInfo = document.getElementById('win-info');
    const winOptions = document.getElementById('win-options');
    const winUIStuff = {
        info: {
            startedAt: winInfo?.querySelector('.startedAt'),
            completedAt: winInfo?.querySelector('.completedAt'),
            mistakes: winInfo?.querySelector('.mistakes'),
            timeTaken: winInfo?.querySelector('.timeTaken'),
        }
    }

    const miscManagerStuff = {
        btn_closeModal: document.getElementById('closeModalBtn'),
        btn_resetConfirm: document.getElementById('resetConfirm'),
        btn_copyBoardAsString: document.getElementById('copyAsStringBtn'),
        btn_pasteBoardAsString: document.getElementById('pasteBtn_string'),

        field_pasteBoardAsString: document.getElementById('pasteField_string'),

        display_mistakesMade: document.getElementById('mistakesMadeDisplay'),
        display_puzzleId: document.getElementById('puzzleNumDisplay'),
    }


    miscManagerStuff.btn_closeModal?.addEventListener('click', hideModal);
    miscManagerStuff.btn_resetConfirm?.addEventListener('click', resetCurrentPuzzle);
    miscManagerStuff.btn_copyBoardAsString?.addEventListener('click', copyBoardAsString);
    miscManagerStuff.btn_pasteBoardAsString?.addEventListener('click', pasteBoardAsString);


    // pieces of modal menu
    const panels = {
        browse: document.getElementById('panel-browse'),
        dev: document.getElementById("panel-dev"),

        new: document.getElementById('panel-new'),
        reset: document.getElementById('panel-reset'),
        win: document.getElementById('panel-win'),
    };


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

    function _specialDraw() {
        if (UI.boardInteractBlocked) {
            // renderer.drawSudoku({ showSelectedCell: true, showHighlighting: false });    
            //
        } else {
            renderer.drawSudoku();
        }
    }


    function populateBrowseList(listEl, puzzles) {
        if (!listEl) return;

        listEl.innerHTML = "";

        puzzles.forEach(p => {
            const li = document.createElement("li");
            li.classList.add("someButton2", "primary");

            const saved = storage.loadPuzzleState(p.id);
            let symbolForCompleted = "";
            if (saved && saved.completedAt) {
                symbolForCompleted = "✔️ ";
                li.classList.add("completed");
            }

            // li.textContent = `Puzzle ${p.id}`;
            li.textContent = `${symbolForCompleted}Puzzle ${p.id}`;


            listEl.appendChild(li);

            // li.addEventListener('click', () => manager._openPuzzle(p));
            li.addEventListener('click', () => manager._openPuzzleByID(p.id));

        });
    }


    // ------------------------------
    // Convert [{cell,newValue}] → [{cell,oldValue,newValue}] for runtime
    // ------------------------------
    function rebuildRuntimeHistory(minHist, missionStr, historyPos) {
        const tmp = new Uint8Array(81);
        for (let i = 0; i < 81; i++) {
            tmp[i] = missionStr.charCodeAt(i) - 48;
        }

        const out = [];
        for (let i = 0; i < minHist.length; i++) {
            const { cell, newValue } = minHist[i];
            const oldValue = tmp[cell];
            out.push({ cell, oldValue, newValue });
            tmp[cell] = newValue;
        }
        return out;
    }


    function analyzeBoard(cells, solution) {
        const correctCount = new Uint8Array(9);

        for (let i = 0; i < 81; i++) {
            const v = cells[i];
            if (v && v === solution[i]) {
                correctCount[v - 1]++;
            }
        }

        return {
            completedDigits: correctCount.map(c => c === 9)
        };
    }

    const manager = {
        solver,

        currentPuzzleID: null,
        modalIsOpen: false,
        lastCompletedDigits: new Uint8Array(9).fill(0), // all zero by default
        lastMistakesMade: 0,

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

            // if (UI.numpadByValue[0]) console.log(`yes there's any erase button`);

            renderer.drawSudoku({ showSelectedCell: false, showHighlighting: false });

            manager._showWin();
        },

        hideModal,

        _openPuzzle,
        _openPuzzleByID,

        _onGameUpdate,

        _onGameHistoryMove({ historyPos }) {
            if (this.currentPuzzleID !== null) storage.saveHistoryMove(manager.currentPuzzleID, historyPos, game.mistakesMade); // storage

            // no redo
            if (historyPos >= game.gameHistory.length) {
                console.log('um maybe redo not possible after this move now');
            }
            
            // no undo
            if (historyPos < 1) {
                console.log('um maybe undo not possible after this move now');
            }

            _syncCompletedDigits();
        },

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

    function prepareWinInfo() {
        // for printing the appropriate info into the "win modal" before showing it
        // const winInfo = document.getElementById('win-info');
        const state = storage.loadPuzzleState(manager.currentPuzzleID);

        // console.log(state);
        if (winUIStuff && state) {

            console.log(`hi from prepareWinInfo`);
            console.log(state);
            const { startedAt, completedAt, mistakes } = state;
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
        manager.lastCompletedDigits.fill(0);
        game.miscOpenPuzzle(p);
        if (miscManagerStuff.display_puzzleId) miscManagerStuff.display_puzzleId.textContent = "pasted puzzle";
        const mistakesMade = game.mistakesMade;
        manager.lastMistakesMade = mistakesMade;
        if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = mistakesMade;
        hideModal();
        UI.container.focus();
        renderer.drawSudoku();
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

        if (miscManagerStuff.display_puzzleId) miscManagerStuff.display_puzzleId.textContent = `puzzle ${id}`;
        manager.lastCompletedDigits.fill(0);
        manager.lastMistakesMade = 0;
        game.miscOpenPuzzle(puzzle);
        
        hideModal();

        if (saved && reset !== true) {
            // case: we are loading some kind of history
            game.restoreHistory(saved);
            if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = game.mistakesMade;

            if (saved.completedAt) {
                // console.log("hi from manager, this saved game is finished");
                manager._handleGameWin();
            } else {
                UI.container.focus();
                renderer.drawSudoku();
                _syncCompletedDigits();
            }
        } else {
            if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = 0;
            storage.startPuzzle(puzzle);
            UI.container.focus();
            renderer.drawSudoku();
            _syncCompletedDigits();
        }
    }


    function _syncCompletedDigits() {
        const curr = analyzeBoard(game.cells, game.solution).completedDigits;

        for (let d = 0; d < 9; d++) {
            if (curr[d] !== manager.lastCompletedDigits[d]) {
                const digit = d + 1;

                if (curr[d]) {
                    UI.numpadByValue[digit]?.classList.add("completed");
                } else {
                    UI.numpadByValue[digit]?.classList.remove("completed");
                }
            }
        }
        manager.lastCompletedDigits.set(curr);
    }

    function resetCurrentPuzzle() {
        if (manager.currentPuzzleID !== null) {
            manager._openPuzzleByID(manager.currentPuzzleID, true);
        }
    }


    function _onGameUpdate({ solved = false, cell, value }) {
        _syncCompletedDigits();
        // console.log(`hello from gameUpdate, completedDigits:`, manager.lastCompletedDigits);

        const mistakesMade = game.mistakesMade;
        // --- miscManagerStuff ---
        if (mistakesMade !== manager.lastMistakesMade) {
            manager.lastMistakesMade = mistakesMade;    
            if (miscManagerStuff.display_mistakesMade) miscManagerStuff.display_mistakesMade.textContent = mistakesMade;
        }
        
        if (manager.currentPuzzleID !== null) storage.saveMove(manager.currentPuzzleID, cell, value, mistakesMade, solved); // storage 
        
        // console.log(`gameUpdate: cell '${cell}' to ${value}, mistakesMade: ${mistakesMade}, solved: ${solved}`); // test instead before engaging

        // this might also be the right place to printMistakes, maybe some other junk too

        if (solved === true) {
            console.log("----------------------");
            console.log("SOLVED THE PUZZLE");
            console.log("----------------------");
            manager._handleGameWin();
        }
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

    // ---- browse list modal menu stuff ----

    const browseList_EASY = document.getElementById("browseList_EASY");
    const browseList_MEDIUM = document.getElementById("browseList_MEDIUM");
    const browseList_HARD = document.getElementById("browseList_HARD");


    // temporary: dump all puzzles into EASY for now
    populateBrowseList(browseList_EASY, easyPuzzles);
    populateBrowseList(browseList_MEDIUM, mediumPuzzles);
    populateBrowseList(browseList_HARD, hardPuzzles);

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


    return manager;
}
// 