// SolverAC3_2D.js

export class SolverAC3_2D {
    constructor() {
        // constants & utilities
        this.SUDOKU_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

        this.SQUARE_TABLE = (() => {
            const out = [];
            for (let bi = 0; bi < 9; bi++) {
                const cells = [];
                const sy = Math.floor(bi / 3) * 3;
                const sx = (bi % 3) * 3;
                for (let y = sy; y < sy + 3; y++) {
                    for (let x = sx; x < sx + 3; x++) {
                        cells.push([x, y]); // [x,y]
                    }
                }
                out.push(cells);
            }
            return out;
        })();

        // history
        this.AC3_HISTORY = [];
        this.ROOT_END = 0;

        // clues
        this.CLUE_PRIORITY = {
            naked_single: 100,
            hidden_single: 90,
            naked_pair: 60
        };
    }

    // --- parsing ---
    parsePuzzle(str) {
        const s = (str || "").trim();
        if (s.length !== 81) throw new Error("Puzzle must be exactly 81 digits.");
        if (!/^[0-9]{81}$/.test(s)) throw new Error("Puzzle must contain only digits 0-9 (0 = empty).");
        const grid = [];
        for (let y = 0; y < 9; y++) {
            const row = [];
            for (let x = 0; x < 9; x++) row.push(+s[y * 9 + x]);
            grid.push(row);
        }
        return grid;
    }

    squareIndex(x, y) {
        return Math.floor(y / 3) * 3 + Math.floor(x / 3);
    }

    unitCellsRow(y) {
        const cells = [];
        for (let x = 0; x < 9; x++) cells.push([x, y]);
        return cells;
    }

    unitCellsCol(x) {
        const cells = [];
        for (let y = 0; y < 9; y++) cells.push([x, y]);
        return cells;
    }

    unitCellsBox(bi) {
        return this.SQUARE_TABLE[bi].slice();
    }

    cloneDomainGrid(grid) {
        return grid.map(row => row.map(dom => dom.slice()));
    }

    constraintType(x, y, xx, yy) {
        if (y === yy) return "row";
        if (x === xx) return "column";
        if (this.squareIndex(x, y) === this.squareIndex(xx, yy)) return "square";
        return "unknown";
    }
    // --- history ---
    record(evt) {
        this.AC3_HISTORY.push(evt);
    }

    // --- domain conversions ---
    toSimpleSudoku(domainGrid) {
        return domainGrid.map(row =>
            row.map(dom => (dom.length === 1 ? dom[0] : 0))
        );
    }

    toDomainSudoku(simpleGrid) {
        return simpleGrid.map(row =>
            row.map(v => (v === 0 ? this.SUDOKU_NUMBERS.slice() : [v]))
        );
    }

    // --- mutators with logging ---
    applyWrite(domainGrid, x, y, value, meta) {
        const before = domainGrid[y][x].slice();
        domainGrid[y][x] = [value];

        this.record({
            type: "write",
            technique: meta?.technique || "write",
            tag: meta?.tag || "root",
            cell: { x, y },
            value,
            before,
            after: [value],
            rationale: meta || null,
        });
    }

    applyElimination(domainGrid, x, y, value, meta) {
        const dom = domainGrid[y][x];
        const idx = dom.indexOf(value);
        if (idx === -1) return false;

        const before = dom.slice();
        dom.splice(idx, 1);

        this.record({
            type: "elimination",
            technique: meta?.technique || "elimination",
            tag: meta?.tag || "root",
            cell: { x, y },
            value,
            before,
            after: dom.slice(),
            rationale: meta || null,
        });

        if (dom.length === 0) {
            this.record({
                type: "contradiction",
                tag: meta?.tag || "root",
                technique: meta?.technique || "elimination",
                cell: { x, y },
            });
            return "contradiction";
        }

        return true;
    }

    // AC3 (singleton propagation) + logging
    ac3(domainGrid, tag) {
        const sudoku = this.cloneDomainGrid(domainGrid);
        let wave = 0;

        while (true) {
            let change = false;

            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 9; x++) {
                    let domain1 = sudoku[y][x];

                    // collect peers
                    const peers = [];

                    for (let xx = 0; xx < 9; xx++) if (xx !== x) peers.push([xx, y]);
                    for (let yy = 0; yy < 9; yy++) if (yy !== y) peers.push([x, yy]);

                    const sq = this.SQUARE_TABLE[this.squareIndex(x, y)];
                    for (let i = 0; i < 9; i++) {
                        const [xx, yy] = sq[i];
                        if (xx !== x || yy !== y) peers.push([xx, yy]);
                    }

                    for (const [xx, yy] of peers) {
                        const domain2 = sudoku[yy][xx];
                        if (domain2.length !== 1) continue;

                        const v = domain2[0];
                        const idx = domain1.indexOf(v);
                        if (idx === -1) continue;

                        this.record({
                            type: "ac3_elimination",
                            tag,
                            wave,
                            target: { x, y },
                            value: v,
                            source: { x: xx, y: yy },
                            constraint: this.constraintType(x, y, xx, yy),
                            before: domain1.slice(),
                        });

                        domain1.splice(idx, 1);
                        change = true;

                        this.record({
                            type: "ac3_domain_after",
                            tag,
                            wave,
                            cell: { x, y },
                            after: domain1.slice(),
                        });

                        if (domain1.length === 0) {
                            this.record({ type: "contradiction", tag, wave, cell: { x, y } });
                            return { sudoku, solvable: false };
                        }
                    }

                    sudoku[y][x] = domain1;
                }
            }

            if (!change) break;
            wave++;
        }

        return { sudoku, solvable: true };
    }

    // Structural inference #1: Hidden Singles (write)
    findHiddenSingle(domainGrid) {
        const scanUnit = (kind, index, cells) => {
            for (let d = 1; d <= 9; d++) {
                const positions = [];
                const unitSnapshot = [];

                for (const [x, y] of cells) {
                    const dom = domainGrid[y][x];
                    unitSnapshot.push({ x, y, domain: dom.slice() });
                    if (dom.includes(d)) positions.push({ x, y });
                }

                if (positions.length === 1) {
                    const t = positions[0];
                    const before = domainGrid[t.y][t.x].slice();
                    if (before.length === 1 && before[0] === d) continue;

                    return {
                        technique: "hidden_single",
                        unit: { kind, index },
                        digit: d,
                        target: t,
                        targetBefore: before,
                        unitCells: unitSnapshot,
                    };
                }
            }
            return null;
        };

        for (let y = 0; y < 9; y++) {
            const inf = scanUnit("row", y, this.unitCellsRow(y));
            if (inf) return inf;
        }
        for (let x = 0; x < 9; x++) {
            const inf = scanUnit("col", x, this.unitCellsCol(x));
            if (inf) return inf;
        }
        for (let b = 0; b < 9; b++) {
            const inf = scanUnit("box", b, this.unitCellsBox(b));
            if (inf) return inf;
        }

        return null;
    }

    // Structural inference #2: Naked Pairs (eliminations)
    findNakedPair(domainGrid) {
        const checkUnit = (kind, index, cells) => {
            // key "a,b" -> array of 2-candidate cells
            const buckets = new Map();

            for (const [x, y] of cells) {
                const dom = domainGrid[y][x];
                if (dom.length !== 2) continue;
                const key = dom.slice().sort((a, b) => a - b).join(",");
                if (!buckets.has(key)) buckets.set(key, []);
                buckets.get(key).push({ x, y, values: dom.slice() });
            }

            for (const [key, pairCells] of buckets.entries()) {
                if (pairCells.length !== 2) continue;

                const values = key.split(",").map(Number);
                const eliminations = [];

                for (const [x, y] of cells) {
                    if (pairCells[0].x === x && pairCells[0].y === y) continue;
                    if (pairCells[1].x === x && pairCells[1].y === y) continue;

                    const dom = domainGrid[y][x];
                    for (const v of values) {
                        if (dom.includes(v)) {
                            eliminations.push({ x, y, value: v });
                        }
                    }
                }

                if (eliminations.length > 0) {
                    return {
                        technique: "naked_pair",
                        unit: { kind, index },
                        values,
                        pairCells: pairCells.map(c => ({ x: c.x, y: c.y, values: c.values.slice() })),
                        eliminations,
                        unitCells: cells.map(([x, y]) => ({ x, y, domain: domainGrid[y][x].slice() })),
                    };
                }
            }

            return null;
        };

        for (let y = 0; y < 9; y++) {
            const inf = checkUnit("row", y, this.unitCellsRow(y));
            if (inf) return inf;
        }
        for (let x = 0; x < 9; x++) {
            const inf = checkUnit("col", x, this.unitCellsCol(x));
            if (inf) return inf;
        }
        for (let b = 0; b < 9; b++) {
            const inf = checkUnit("box", b, this.unitCellsBox(b));
            if (inf) return inf;
        }

        return null;
    }

    applyNakedPair(domainGrid, inf, tag) {
        // Apply eliminations; log each removal as its own event,
        // with the same inference payload attached.
        for (const e of inf.eliminations) {
            const res = this.applyElimination(domainGrid, e.x, e.y, e.value, {
                technique: "naked_pair",
                tag,
                unit: inf.unit,
                values: inf.values.slice(),
                pairCells: inf.pairCells.map(c => ({ x: c.x, y: c.y, values: c.values.slice() })),
                unitCells: inf.unitCells, // snapshot at inference time
            });
            if (res === "contradiction") return "contradiction";
        }
        return true;
    }

    // Propagation loop
    propagate(domainGrid, tag) {
        while (true) {
            // 1) AC3 to fixpoint
            const { sudoku, solvable } = this.ac3(domainGrid, tag);
            if (!solvable) return { grid: sudoku, solvable: false };
            domainGrid = sudoku;

            // 2) Hidden single
            const hs = this.findHiddenSingle(domainGrid);
            if (hs) {
                this.applyWrite(domainGrid, hs.target.x, hs.target.y, hs.digit, {
                    technique: "hidden_single",
                    tag,
                    unit: hs.unit,
                    digit: hs.digit,
                    target: hs.target,
                    targetBefore: hs.targetBefore,
                    unitCells: hs.unitCells,
                });
                continue;
            }

            // 3) Naked pair
            const np = this.findNakedPair(domainGrid);
            if (np) {
                const r = this.applyNakedPair(domainGrid, np, tag);
                if (r === "contradiction") return { grid: domainGrid, solvable: false };
                continue;
            }

            // 4) No more deterministic inference at this layer
            return { grid: domainGrid, solvable: true };
        }
    }

    // --- Search driver (MRV split) ---
    _solveGrid(stack, iterations) {
        let didRootBoundary = false;

        while (stack.length > 0) {
            let [grid, ...rest] = stack;
            iterations++;

            if (iterations > 4000) {
                return { sudoku: this.toSimpleSudoku(grid), iterations: Infinity };
            }

            const tag = didRootBoundary ? "branch" : "root";
            const { grid: newGrid, solvable } = this.propagate(grid, tag);

            // Root boundary = after first propagation pass returns to driver.
            // If root propagation alone solves, ROOT_END === full history length.
            if (!didRootBoundary) {
                didRootBoundary = true;
                this.ROOT_END = this.AC3_HISTORY.length;
            }

            if (!solvable) {
                stack = rest;
                continue;
            }
            grid = newGrid;

            const isFilled = grid.every(row => row.every(dom => dom.length === 1));
            if (isFilled) {
                return { sudoku: this.toSimpleSudoku(grid), iterations };
            }

            // MRV: pick smallest domain > 1
            const possibles = [];
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 9; x++) {
                    if (grid[y][x].length > 1) possibles.push([x, y]);
                }
            }
            possibles.sort((a, b) => grid[a[1]][a[0]].length - grid[b[1]][b[0]].length);

            const [x, y] = possibles[0];
            const dom = grid[y][x];

            this.record({
                type: "branch",
                tag: "branch",
                iter: iterations,
                cell: { x, y },
                domain: dom.slice(),
            });

            // domain split
            const newGrids = dom.map(v => {
                const copy = this.cloneDomainGrid(grid);
                copy[y][x] = [v];
                return copy;
            });

            stack = newGrids.concat(rest);
        }

        return { sudoku: null, iterations: Infinity };
    }

    solve(simpleGrid) {
        this.AC3_HISTORY.length = 0;
        this.ROOT_END = 0;

        const root = this.toDomainSudoku(simpleGrid);
        return this._solveGrid([root], 0);
    }

    // --- root-history helpers ---
    getRootHistory() {
        return this.AC3_HISTORY.slice(0, this.ROOT_END);
    }

    // ****************************************************************************************
    // --- clues ---
    getClueCandidates(root) {
        const candidates = [];

        // ---- WRITES: naked single + hidden single ----
        for (let i = 0; i < root.length; i++) {
            const e = root[i];
            if (e.type !== "write" || e.tag !== "root") continue;

            // Naked single: domain collapsed to 1
            if (Array.isArray(e.after) && e.after.length === 1) {
                candidates.push({
                    technique: "naked_single",
                    action: {
                        type: "place",
                        cell: e.cell,
                        value: e.value
                    },
                    rationale: {
                        cell: e.cell,
                        value: e.value,
                        domainBefore: e.before
                    },
                    sourceEvents: [i],
                    score: this.CLUE_PRIORITY.naked_single
                });
            }

            // Hidden single (explicitly tagged by solver)
            if (e.technique === "hidden_single") {
                candidates.push({
                    technique: "hidden_single",
                    action: {
                        type: "place",
                        cell: e.cell,
                        value: e.value
                    },
                    rationale: e.rationale,
                    sourceEvents: [i],
                    score: this.CLUE_PRIORITY.hidden_single
                });
            }
        }

        // ---- NAKED PAIRS: group eliminations ----
        const npGroups = new Map();

        root.forEach((e, i) => {
            if (
                e.type === "elimination" &&
                e.technique === "naked_pair" &&
                e.tag === "root"
            ) {
                const r = e.rationale;
                const key = JSON.stringify({
                    unit: r.unit,
                    values: r.values,
                    pairCells: r.pairCells
                });

                if (!npGroups.has(key)) {
                    npGroups.set(key, []);
                }
                npGroups.get(key).push({ event: e, index: i });
            }
        });

        for (const group of npGroups.values()) {
            // Deterministic choice: first elimination in history
            const chosen = group[0];

            candidates.push({
                technique: "naked_pair",
                action: {
                    type: "eliminate",
                    cell: chosen.event.cell,
                    value: chosen.event.value
                },
                rationale: chosen.event.rationale,
                sourceEvents: group.map(g => g.index),
                score: this.CLUE_PRIORITY.naked_pair
            });
        }

        return candidates;
    }

    getFirstClue(root) {
        const candidates = this.getClueCandidates(root);
        if (!candidates.length) return null;

        candidates.sort((a, b) => {
            // Higher clarity first
            if (b.score !== a.score) return b.score - a.score;

            // Prefer placements over eliminations
            if (a.action.type !== b.action.type) {
                return a.action.type === "place" ? -1 : 1;
            }

            // Deterministic fallback: row, col, value
            if (a.action.cell.y !== b.action.cell.y)
                return a.action.cell.y - b.action.cell.y;
            if (a.action.cell.x !== b.action.cell.x)
                return a.action.cell.x - b.action.cell.x;
            return a.action.value - b.action.value;
        });

        return candidates[0];
    }
    // ****************************************************************************************
    // --- clues ---

}
