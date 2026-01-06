import { easyPuzzles, mediumPuzzles, hardPuzzles } from "/apps/sudoku/bundle/puzzles.js";
import * as storage from "./mstorage.js";


export const modalContainer = document.getElementById('modalContainer');

// pieces of modal menu
export const panels = {
    browse: document.getElementById('panel-browse'),
    dev: document.getElementById("panel-dev"),

    new: document.getElementById('panel-new'),
    reset: document.getElementById('panel-reset'),
    win: document.getElementById('panel-win'),
};


// browselist junk
// ---- browse list modal menu stuff ----

export const browseList_EASY = document.getElementById("browseList_EASY");
export const browseList_MEDIUM = document.getElementById("browseList_MEDIUM");
export const browseList_HARD = document.getElementById("browseList_HARD");
// track puzzle items
const pi_easy = populateBrowseList(browseList_EASY, easyPuzzles);
const pi_medium = populateBrowseList(browseList_MEDIUM, mediumPuzzles);
const pi_hard = populateBrowseList(browseList_HARD, hardPuzzles);

export const puzzleListAllItems = { ...pi_easy, ...pi_medium, ...pi_hard };


// 
// win panel stuff
export const winInfo = document.getElementById('win-info');
export const winOptions = document.getElementById('win-options');
export const winUIStuff = {
    info: {
        startedAt: winInfo?.querySelector('.startedAt'),
        completedAt: winInfo?.querySelector('.completedAt'),
        mistakes: winInfo?.querySelector('.mistakes'),
        timeTaken: winInfo?.querySelector('.timeTaken'),
    }
}

//
export const miscManagerStuff = {
    btn_closeModal: document.getElementById('closeModalBtn'),
    btn_resetConfirm: document.getElementById('resetConfirm'),
    btn_copyBoardAsString: document.getElementById('copyAsStringBtn'),
    btn_pasteBoardAsString: document.getElementById('pasteBtn_string'),

    field_pasteBoardAsString: document.getElementById('pasteField_string'),

    display_mistakesMade: document.getElementById('mistakesMadeDisplay'),
    display_puzzleId: document.getElementById('puzzleNumDisplay'),

    puzzleCategoryMenu: panels.browse?.querySelector("[data-switcher]"),

}


// for "mark current" on the puzzle button AND its tabbage page
export function assignBrowseListCurrent(id) {
    const el = puzzleListAllItems?.[id];
    if (!el) return;

    el.classList.add("loaded");

    if (miscManagerStuff.puzzleCategoryMenu) {
        //
        const switcher = miscManagerStuff.puzzleCategoryMenu;
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

// TO BUILD A BROWSE LIST 
function populateBrowseList(listEl, puzzles) {
    if (!listEl) return {};

    listEl.innerHTML = "";

    const puzzleListItems = {}

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

        // lookup: id -> li
        puzzleListItems[p.id] = li;

    }
        // we'll ask that the manager hook events onto these things independently; this is just a generate HTML step, not an event assigner
    );

    return puzzleListItems;
}
