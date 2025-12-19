/* =========================================================
   ac_history2.js — AC3 (singleton-propagation) + Hidden Singles
   Demonstration goal:
     - Keep AC3 as-is (no redesign of its eliminations)
     - Add a structural inference layer that can produce “next moves”
       even when AC3 root produces no collapses (your current case).
     - Log rich, structured events for clue generation.

   Contract preserved:
     solve(grid) -> { sudoku, iterations }

   UI IDs assumed:
     #input, #solveBtn, #output

   Coordinates:
     x = column (0..8), y = row (0..8)
     domain grid indexed as domain[y][x]
   ========================================================= */

/* =========================
   Constants & utilities
   ========================= */

const SUDOKU_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function squareIndex(x, y) {
    return Math.floor(y / 3) * 3 + Math.floor(x / 3);
}

const SQUARE_TABLE = (() => {
    const out = [];
    for (let i = 0; i < 9; i++) {
        const cells = [];
        const sy = Math.floor(i / 3) * 3;
        const sx = (i % 3) * 3;
        for (let y = sy; y < sy + 3; y++) {
            for (let x = sx; x < sx + 3; x++) {
                cells.push([x, y]); // [x,y]
            }
        }
        out.push(cells);
    }
    return out;
})();

function unitCellsRow(y) {
    const cells = [];
    for (let x = 0; x < 9; x++) cells.push([x, y]);
    return cells;
}
function unitCellsCol(x) {
    const cells = [];
    for (let y = 0; y < 9; y++) cells.push([x, y]);
    return cells;
}
function unitCellsBox(bi) {
    return SQUARE_TABLE[bi].slice(); // already [x,y]
}

function constraintType(x, y, xx, yy) {
    if (y === yy) return "row";
    if (x === xx) return "column";
    if (squareIndex(x, y) === squareIndex(xx, yy)) return "square";
    return "unknown";
}

function cloneDomainGrid(grid) {
    return grid.map(row => row.map(c => c.slice()));
}

/* =========================
   History (side channel)
   ========================= */

const AC3_HISTORY = [];
window.AC3_HISTORY = AC3_HISTORY;

let ROOT_END = 0;
window.AC3_ROOT_END = ROOT_END;

function record(evt) {
    AC3_HISTORY.push(evt);
}

/* =========================
   Domain conversions
   ========================= */

function toSimpleSudoku(domainGrid) {
    return domainGrid.map(row =>
        row.map(cands => (cands.length === 1 ? cands[0] : 0))
    );
}

function toDomainSudoku(simpleGrid) {
    return simpleGrid.map(row =>
        row.map(v => (v === 0 ? SUDOKU_NUMBERS.slice() : [v]))
    );
}

/* =========================
   AC3 (singleton propagation) + logging
   ========================= */

function ac3(domainGrid, tag) {
    // tag is just for history grouping (e.g. "root", "branch")
    const sudoku = cloneDomainGrid(domainGrid);
    let wave = 0;

    while (true) {
        let change = false;

        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                let domain1 = sudoku[y][x];

                const peers = [];

                // row peers
                for (let xx = 0; xx < 9; xx++) if (xx !== x) peers.push([xx, y]);

                // column peers
                for (let yy = 0; yy < 9; yy++) if (yy !== y) peers.push([x, yy]);

                // square peers
                const square = SQUARE_TABLE[squareIndex(x, y)];
                for (let i = 0; i < 9; i++) {
                    const [xx, yy] = square[i];
                    if (xx !== x || yy !== y) peers.push([xx, yy]);
                }

                for (const [xx, yy] of peers) {
                    const domain2 = sudoku[yy][xx];

                    if (domain2.length === 1) {
                        const v = domain2[0];
                        const idx = domain1.indexOf(v);

                        if (idx !== -1) {
                            record({
                                type: "elimination",
                                tag,
                                wave,
                                target: { x, y },
                                value: v,
                                source: { x: xx, y: yy },
                                constraint: constraintType(x, y, xx, yy),
                                before: domain1.slice(),
                            });

                            domain1.splice(idx, 1);
                            change = true;

                            record({
                                type: "domain_after",
                                tag,
                                wave,
                                cell: { x, y },
                                after: domain1.slice(),
                            });
                        }
                    }
                }

                sudoku[y][x] = domain1;

                if (domain1.length === 0) {
                    record({
                        type: "contradiction",
                        tag,
                        wave,
                        cell: { x, y },
                    });
                    return { sudoku, solvable: false };
                }
            }
        }

        if (!change) break;
        wave++;
    }

    return { sudoku, solvable: true };
}

/* =========================
   Structural inference: Hidden Singles
   =========================
   Hidden single = in a unit (row/col/box), a digit d appears in exactly
   one cell's domain. That cell must be d.
   This produces a "write" event (a committed inference) with full
   participation set and explicit causality.
*/

function findHiddenSingle(domainGrid) {
    // returns one inference at a time (deterministic scan order)
    // order: rows 0..8, cols 0..8, boxes 0..8, digits 1..9
    // This ordering is your "technique ordering" for now.
    function checkUnit(unitKind, unitIndex, cells) {
        for (let d = 1; d <= 9; d++) {
            const positions = [];
            const filled = []; // singleton cells in unit (context)
            for (const [x, y] of cells) {
                const dom = domainGrid[y][x];
                if (dom.length === 1) filled.push({ x, y, value: dom[0] });
                if (dom.includes(d)) positions.push({ x, y });
            }
            if (positions.length === 1) {
                const target = positions[0];
                const before = domainGrid[target.y][target.x].slice();
                if (before.length === 1 && before[0] === d) continue; // already set
                return {
                    technique: "hidden_single",
                    unit: { kind: unitKind, index: unitIndex },
                    digit: d,
                    target,
                    targetBefore: before,
                    // participation set (all unit cells + their domains snapshot)
                    unitCells: cells.map(([x, y]) => ({
                        x, y, domain: domainGrid[y][x].slice()
                    })),
                    filledContext: filled
                };
            }
        }
        return null;
    }

    for (let y = 0; y < 9; y++) {
        const inf = checkUnit("row", y, unitCellsRow(y));
        if (inf) return inf;
    }
    for (let x = 0; x < 9; x++) {
        const inf = checkUnit("col", x, unitCellsCol(x));
        if (inf) return inf;
    }
    for (let b = 0; b < 9; b++) {
        const inf = checkUnit("box", b, unitCellsBox(b));
        if (inf) return inf;
    }
    return null;
}

function applyWrite(domainGrid, x, y, value, meta) {
    const before = domainGrid[y][x].slice();
    domainGrid[y][x] = [value];

    record({
        type: "write",
        technique: meta?.technique || "write",
        tag: meta?.tag || "root",
        cell: { x, y },
        value,
        before,
        after: [value],
        rationale: meta || null
    });
}

/* =========================
   Root inference loop:
     repeat:
       AC3 to fixpoint
       if hidden single exists -> write it, continue
       else stop
   ========================= */

function propagateWithHiddenSingles(domainGrid, tag) {
    // returns { grid, solvable }
    while (true) {
        const { sudoku, solvable } = ac3(domainGrid, tag);
        if (!solvable) return { grid: sudoku, solvable: false };
        domainGrid = sudoku;

        const inf = findHiddenSingle(domainGrid);
        if (!inf) return { grid: domainGrid, solvable: true };

        applyWrite(domainGrid, inf.target.x, inf.target.y, inf.digit, {
            technique: "hidden_single",
            tag,
            unit: inf.unit,
            digit: inf.digit,
            target: inf.target,
            targetBefore: inf.targetBefore,
            unitCells: inf.unitCells,
            filledContext: inf.filledContext
        });

        // loop again: write created a singleton, so AC3 can propagate
    }
}

/* =========================
   Search wrapper (MRV split)
   Note: For demonstration, branching uses the post-root-propagated grid.
   ========================= */

function _solveGrid(stack, iterations) {
    let didRoot = false;

    while (stack.length > 0) {
        let [grid, ...rest] = stack;
        iterations++;

        if (iterations > 4000) {
            return { sudoku: toSimpleSudoku(grid), iterations: Infinity };
        }

        // Propagate (AC3 + Hidden Singles) on this node
        const tag = didRoot ? "branch" : "root";
        const { grid: newGrid, solvable } = propagateWithHiddenSingles(grid, tag);

        if (!didRoot) {
            didRoot = true;
            ROOT_END = AC3_HISTORY.length;
            window.AC3_ROOT_END = ROOT_END;
        }

        if (!solvable) {
            stack = rest;
            continue;
        }
        grid = newGrid;

        const isFilled = grid.every(row => row.every(cands => cands.length === 1));
        if (isFilled) {
            return { sudoku: toSimpleSudoku(grid), iterations };
        }

        // MRV selection
        const possibles = [];
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (grid[y][x].length > 1) possibles.push([x, y]);
            }
        }

        possibles.sort((a, b) => grid[a[1]][a[0]].length - grid[b[1]][b[0]].length);

        const [x, y] = possibles[0];
        const dom = grid[y][x];

        record({
            type: "branch",
            iter: iterations,
            cell: { x, y },
            domain: dom.slice(),
        });

        // domain split
        const newGrids = dom.map(v => {
            const copy = cloneDomainGrid(grid);
            copy[y][x] = [v];
            return copy;
        });

        stack = newGrids.concat(rest);
    }

    return { sudoku: null, iterations: Infinity };
}

function solve(simpleGrid) {
    AC3_HISTORY.length = 0;
    ROOT_END = 0;
    window.AC3_ROOT_END = 0;

    const rootDomain = toDomainSudoku(simpleGrid);
    const stack = [rootDomain];
    return _solveGrid(stack, 0);
}

/* =========================
   Helpers for root-only clue extraction
   ========================= */

function getRootHistory() {
    return AC3_HISTORY.slice(0, ROOT_END);
}

function findFirstRootWrite(rootHistory) {
    // first committed inference in root phase
    return rootHistory.find(e => e.type === "write") || null;
}

/* =========================
   UI glue
   ========================= */

function parsePuzzle(str) {
    const s = (str || "").trim();
    if (s.length !== 81) throw new Error("Puzzle must be exactly 81 digits.");
    if (!/^[0-9]{81}$/.test(s)) throw new Error("Puzzle must contain only digits 0-9 (0 = empty).");

    const grid = [];
    for (let y = 0; y < 9; y++) {
        const row = [];
        for (let x = 0; x < 9; x++) {
            row.push(+s[y * 9 + x]);
        }
        grid.push(row);
    }
    return grid;
}

document.getElementById("solveBtn").onclick = () => {
    const input = document.getElementById("input").value.trim();
    const grid = parsePuzzle(input);

    const result = solve(grid);
    const out = document.getElementById("output");

    if (!result.sudoku) {
        out.textContent = "No solution";
        console.log("HISTORY (full):", AC3_HISTORY);
        console.log("ROOT_END:", ROOT_END);
        return;
    }

    out.textContent =
        result.sudoku.map(r => r.join(" ")).join("\n") +
        "\n\niterations: " + result.iterations;

    console.log("HISTORY (full):", AC3_HISTORY);
    console.log("ROOT_END:", ROOT_END);

    const rootHistory = getRootHistory();
    console.log("HISTORY (root):", rootHistory);

    const firstWrite = findFirstRootWrite(rootHistory);
    console.log("First root write:", firstWrite);

    // If you want “the next clue” in root:
    // - firstWrite is the first committed logical inference event produced
    //   by Hidden Singles (or later techniques you add).
};
