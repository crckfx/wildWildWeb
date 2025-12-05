// ------------------------------------------------------------
// Sudoku Storage (dynamic state only)
// puzzles.js holds mission + solution.
// ------------------------------------------------------------

// Key helper
function stateKey(id) {
    return `sudoku_state_${id}`;
}

// ------------------------------
// Active puzzle (per tab)
// ------------------------------
export function setActivePuzzleID(id) {
    sessionStorage.setItem("sudoku_active", String(id));
}

export function getActivePuzzleID() {
    return sessionStorage.getItem("sudoku_active");
}

// ------------------------------
// Initialize new puzzle state
// ------------------------------
export function startPuzzle(puzzle) {
    const id = String(puzzle.id);

    setActivePuzzleID(id);

    const timestamp = Date.now();
    const state = {
        history: [],
        historyPos: 0,
        mistakes: 0,
        timestamp: timestamp,
        startedAt: timestamp,
        completedAt: null,
    };

    localStorage.setItem(stateKey(id), JSON.stringify(state));
}

// ------------------------------
// Save one move
// ------------------------------
export function saveMove(id, cell, newValue, mistakes, completed = false) {
    id = String(id);

    const raw = localStorage.getItem(stateKey(id));
    if (!raw) return;

    const state = JSON.parse(raw);
    const timestamp = Date.now();

    state.history.push({ cell, newValue });
    state.historyPos = state.history.length;
    state.mistakes = mistakes;
    state.timestamp = timestamp;

    // if this move completes the game successfully
    if (completed === true) {
        state.completedAt = timestamp;
    }

    localStorage.setItem(stateKey(id), JSON.stringify(state));
}

// ------------------------------
// Save undo (only playhead + mistakes)
// ------------------------------
export function saveUndo(id, newHistoryPos, mistakes) {
    id = String(id);

    const raw = localStorage.getItem(stateKey(id));
    if (!raw) return;

    const state = JSON.parse(raw);

    state.historyPos = newHistoryPos;
    state.mistakes = mistakes;
    state.timestamp = Date.now();
    state.history.length = state.historyPos;

    localStorage.setItem(stateKey(id), JSON.stringify(state));
}

// ------------------------------
// Load stored dynamic state (for a puzzle ID)
// ------------------------------
export function loadPuzzleState(id) {
    id = String(id);
    const raw = localStorage.getItem(stateKey(id));
    return raw ? JSON.parse(raw) : null;
}

// ------------------------------
// Load only the active puzzle's state (per-tab)
// ------------------------------
export function loadActivePuzzleState() {
    const id = getActivePuzzleID();
    if (!id) return null;
    return loadPuzzleState(id);
}

// ------------------------------
// Clear stored progress
// ------------------------------
export function clearPuzzleState(id) {
    localStorage.removeItem(stateKey(String(id)));
}
