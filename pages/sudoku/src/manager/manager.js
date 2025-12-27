import { puzzles, easyPuzzles, mediumPuzzles, hardPuzzles } from "/apps/sudoku/bundle/puzzles.js";
import * as storage from "./mstorage.js";
import { formatDateTime, formatDuration } from "../static.js";

export function createAppManager({ game, renderer, UI }) {

    let modalIsOpen = false;
    const modalContainer = document.getElementById('modalContainer');
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


    if (modalContainer) modalContainer.onclick = handleModalClick;
    const panels = {
        browse: document.getElementById('panel-browse'),
        dev: document.getElementById("panel-dev"),

        // new: document.getElementById('panel-new'),
        // reset: document.getElementById('panel-reset'),
        win: document.getElementById('panel-win'),
    };

    function hideModal() {
        modalIsOpen = false;
        modalContainer.classList.remove('show');
        Object.values(panels).forEach(p => p?.classList.remove('active'));
    }

    function showModal(name) {
        const panel = panels[name];
        if (!panel) return;
        modalIsOpen = true;

        Object.values(panels).forEach(p => p?.classList.remove('active'));
        modalContainer.classList.add('show');
        panel.classList.add('active');
    }

    function handleModalClick(e) {
        if (!e.target.closest(".modalPanel")) {

            hideModal();
            UI.container.focus();
        }
    }

    function prepareWinInfo() {
        // for printing the appropriate info into the "win modal" before showing it
        // const winInfo = document.getElementById('win-info');
        const state = storage.loadPuzzleState(game.currentPuzzleID);

        console.log(state);
        if (winUIStuff && state) {


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
        for (let i = 0; i < historyPos; i++) {
            const { cell, newValue } = minHist[i];
            const oldValue = tmp[cell];
            out.push({ cell, oldValue, newValue });
            tmp[cell] = newValue;
        }
        return out;
    }


    // a puzzle's ID is the concern of this manager; not the concern of the game, as is the storage
    function _openPuzzleByID(id) {
        const puzzle = puzzles.find(p => p.id == id);
        // maybe check storage for progress first?
        const saved = storage.loadPuzzleState(id);
        if (saved) {
            console.log(`yeah got some history for puzzle ${id}`, saved);
            const gameHistory = rebuildRuntimeHistory(saved.history, puzzle.mission, saved.historyPos);
            // console.log(saved.history, puzzle.mission, saved.historyPos);
            console.log(gameHistory);
            saved.runtimeHistory = gameHistory;
            // if (validateGameHistory) { // or something probably}
        }
        // manager._openPuzzle(puzzle);
        console.log(`_openPuzzleByID: hopefully loaded puzzle ${id}`);

        hideModal();
        game.miscOpenPuzzle(puzzle);

        if (saved) {
            game.restoreHistory(saved);
            if (saved.completedAt) {
                console.log("hi from manager, this saved game is finished");

            }
        }

        renderer.drawSudoku();
    }

    const manager = {

        currentPuzzleID: null,

        _showBrowse() {
            showModal('browse');
        },
        _showDev() {
            showModal('dev');
        },
        _showWin() {
            prepareWinInfo();
            console.log("heyyy its me manager");
            showModal('win');

        },

        hideModal,
        _openPuzzle(p) {
            hideModal();
            game.miscOpenPuzzle(p);
            renderer.drawSudoku();
        },
        _openPuzzleByID,

        _onGameUpdate() {
            console.log("yes whats up its me game update signal at manager");
            // so maybe it's here that we write to history?
        }
    };

    // ---- browse list modal menu stuff ----

    const browseList_EASY = document.getElementById("browseList_EASY");
    const browseList_MEDIUM = document.getElementById("browseList_MEDIUM");
    const browseList_HARD = document.getElementById("browseList_HARD");


    // temporary: dump all puzzles into EASY for now
    populateBrowseList(browseList_EASY, easyPuzzles);
    populateBrowseList(browseList_MEDIUM, mediumPuzzles);
    populateBrowseList(browseList_HARD, hardPuzzles);

    return manager;
}
