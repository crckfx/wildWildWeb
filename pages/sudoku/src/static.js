// STATUSES
export const STATUS_EMPTY = 0;
export const STATUS_GIVEN = 1;
export const STATUS_CORRECT = 2;
export const STATUS_ERROR = 3;
// highlight states (visual only)
export const H_NONE = 0;
export const H_SELECTED = 1;
export const H_NEIGHBOUR = 2;
export const H_SAME_NUMBER = 3;



function precomputeNeighbours() {
    const tempNeighboursOf = Array.from({ length: 81 }, () => []);

    for (let i = 0; i < 81; i++) {
        const row = (i / 9) | 0;   // fast floor
        const col = i - row * 9;

        const rowStart = row * 9;

        // mark duplicates once only
        const mask = new Uint8Array(81);

        // --- row ---
        for (let c = 0; c < 9; c++) {
            const idx = rowStart + c;
            if (idx !== i) mask[idx] = 1;
        }

        // --- column ---
        for (let r = 0; r < 9; r++) {
            const idx = r * 9 + col;
            if (idx !== i) mask[idx] = 1;
        }

        // --- box ---
        const boxRow = row - (row % 3);
        const boxCol = col - (col % 3);

        for (let r = boxRow; r < boxRow + 3; r++) {
            const base = r * 9;
            for (let c = boxCol; c < boxCol + 3; c++) {
                const idx = base + c;
                if (idx !== i) mask[idx] = 1;
            }
        }

        // convert mask → neighbour list
        for (let idx = 0; idx < 81; idx++) {
            if (mask[idx]) tempNeighboursOf[i].push(idx);
        }
    }

    return tempNeighboursOf;
}

export const neighboursOf = precomputeNeighbours();




function cellToCoords(cellNumber) {
    const row = (cellNumber / 9) | 0;
    const col = cellNumber % 9;
    return { row, col }
}

export const coords = new Array(81);                   // for a precomputed lookup of "index->coords(as x,y)""
// pre-populate coords
for (let i = 0; i < 81; i++) {
    coords[i] = cellToCoords(i);
}



export function formatDateTime(ms) {
    if (!ms) return "—";
    const d = new Date(ms);
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function formatDuration(ms) {
    if (ms < 0) return "—";

    let s = Math.floor(ms / 1000);

    const days = Math.floor(s / 86400);
    s %= 86400;
    const hours = Math.floor(s / 3600);
    s %= 3600;
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours || parts.length) parts.push(`${hours}h`);
    if (minutes || parts.length) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(" ");
}
