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

    puzzleMenu: panels.browse?.querySelector("[data-switcher]"),

}