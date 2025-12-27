import { puzzles, easyPuzzles, mediumPuzzles, hardPuzzles } from "/apps/sudoku//bundle/puzzles.js";
import * as storage from "/apps/sudoku//bundle/storage.js";
import { formatDateTime, formatDuration } from "./static.js";

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
        // win: document.getElementById('panel-win'),
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
        }
    }

    function prepareWinInfo(e) {
        // for printing the appropriate info into the "win modal" before showing it
        // const winInfo = document.getElementById('win-info');
        const state = storage.loadPuzzleState(currentPuzzleID);
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


    const manager = {

        currentPuzzleID: null,

        _showBrowse() {
            showModal('browse');
        },
        hideModal,
        _openPuzzle(p) {
            //
            game.miscOpenPuzzle(p);
            hideModal();
            renderer.drawSudoku();
        },
        _openPuzzleByID(id) {
            const puzzle = puzzles.find(p => p.id == id);

            manager._openPuzzle(puzzle);
            console.log(`_openPuzzleByID: hopefully loaded puzzle ${id}`);

        },
        _showDev() {
            // console.log(`todo: implement dev panel`, panels.dev);
            showModal('dev');
        },
        _testWinInManager() {
            console.log("heyyy its me manager");
        }
    };

    // ---- browse list wiring (your chosen single modal) ----

    const browseList_EASY = document.getElementById("browseList_EASY");
    const browseList_MEDIUM = document.getElementById("browseList_MEDIUM");
    const browseList_HARD = document.getElementById("browseList_HARD");

    function populateBrowseList(listEl, puzzles) {
        if (!listEl) return;

        listEl.innerHTML = "";

        puzzles.forEach(p => {
            const li = document.createElement("li");
            li.classList.add("someButton2", "primary");
            li.textContent = `Puzzle ${p.id}`;
            listEl.appendChild(li);

            // li.addEventListener('click', () => manager._openPuzzle(p));
            li.addEventListener('click', () => manager._openPuzzleByID(p.id));

        });
    }

    // temporary: dump all puzzles into EASY for now
    populateBrowseList(browseList_EASY, easyPuzzles);
    populateBrowseList(browseList_MEDIUM, mediumPuzzles);
    populateBrowseList(browseList_HARD, hardPuzzles);

    return manager;
}
