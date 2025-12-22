// SolverAC3_1D.js
// 1-D-permeating solver (cell = i in [0..80]) with:
// AC3 propagation, hidden singles, naked pairs, MRV branching search, root history boundary, clue extraction.
// No x/y logic in solver core; topology is static tables.

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ---------- Static topology ----------
const ROWS = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => r * 9 + c)
);

const COLS = Array.from({ length: 9 }, (_, c) =>
    Array.from({ length: 9 }, (_, r) => r * 9 + c)
);

const BOXES = Array.from({ length: 9 }, (_, b) => {
    const br = ((b / 3) | 0) * 3;
    const bc = (b % 3) * 3;
    const out = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) out.push((br + r) * 9 + (bc + c));
    }
    return out;
});

const UNITS = [...ROWS, ...COLS, ...BOXES];

const CELL_ROW = Array.from({ length: 81 }, (_, i) => (i / 9) | 0);
const CELL_COL = Array.from({ length: 81 }, (_, i) => i % 9);
const CELL_BOX = Array.from({ length: 81 }, (_, i) => (((CELL_ROW[i] / 3) | 0) * 3 + ((CELL_COL[i] / 3) | 0)));

const PEERS = Array.from({ length: 81 }, (_, i) => {
    const r = CELL_ROW[i], c = CELL_COL[i], b = CELL_BOX[i];
    const s = new Set([...ROWS[r], ...COLS[c], ...BOXES[b]]);
    s.delete(i);
    return s;
});

function constraintType(tgt, src) {
    if (CELL_ROW[tgt] === CELL_ROW[src]) return "row";
    if (CELL_COL[tgt] === CELL_COL[src]) return "column";
    if (CELL_BOX[tgt] === CELL_BOX[src]) return "square";
    return "unknown";
}

// ---------- Solver ----------
export class SolverAC3_1D {
    constructor() {
        this.SUDOKU_NUMBERS = DIGITS.slice();
        this.AC3_HISTORY = [];
        this.ROOT_END = 0;

        this.CLUE_PRIORITY = {
            naked_single: 100,
            hidden_single: 90,
            naked_pair: 60,
        };
    }

    // 81-digit string -> 1-D simple grid length 81
    parsePuzzle(str) {
        const s = (str || "").trim();
        if (!/^[0-9]{81}$/.test(s)) throw new Error("Puzzle must be exactly 81 digits.");
        const out = new Array(81);
        for (let i = 0; i < 81; i++) out[i] = s.charCodeAt(i) - 48;
        return out;
    }

    // domain grid -> simple grid
    toSimpleSudoku(domainGrid) {
        const out = new Array(81);
        for (let i = 0; i < 81; i++) out[i] = domainGrid[i].length === 1 ? domainGrid[i][0] : 0;
        return out;
    }

    // simple grid -> domain grid
    toDomainSudoku(simpleGrid) {
        const out = new Array(81);
        for (let i = 0; i < 81; i++) out[i] = simpleGrid[i] === 0 ? DIGITS.slice() : [simpleGrid[i]];
        return out;
    }

    cloneDomainGrid(grid) {
        const out = new Array(81);
        for (let i = 0; i < 81; i++) out[i] = grid[i].slice();
        return out;
    }

    record(evt) {
        this.AC3_HISTORY.push(evt);
    }

    getRootHistory() {
        return this.AC3_HISTORY.slice(0, this.ROOT_END);
    }

    // ---------- Logged mutators ----------
    applyWrite(domainGrid, cell, value, meta) {
        const before = domainGrid[cell].slice();
        domainGrid[cell] = [value];

        this.record({
            type: "write",
            technique: meta?.technique || "write",
            tag: meta?.tag || "root",
            cell,
            value,
            before,
            after: [value],
            rationale: meta || null,
        });
    }

    applyElimination(domainGrid, cell, value, meta) {
        const dom = domainGrid[cell];
        const k = dom.indexOf(value);
        if (k === -1) return false;

        const before = dom.slice();
        dom.splice(k, 1);

        this.record({
            type: "elimination",
            technique: meta?.technique || "elimination",
            tag: meta?.tag || "root",
            cell,
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
                cell,
            });
            return "contradiction";
        }

        return true;
    }

    // ---------- AC3: singleton propagation to fixpoint ----------
    ac3(domainGrid, tag) {
        const sudoku = this.cloneDomainGrid(domainGrid);
        let wave = 0;

        while (true) {
            let changed = false;

            for (let src = 0; src < 81; src++) {
                const srcDom = sudoku[src];
                if (srcDom.length !== 1) continue;

                const v = srcDom[0];
                for (const tgt of PEERS[src]) {
                    const tgtDom = sudoku[tgt];
                    const k = tgtDom.indexOf(v);
                    if (k === -1) continue;

                    // Semantics: eliminate v from TARGET because SOURCE is singleton v
                    this.record({
                        type: "ac3_elimination",
                        tag,
                        wave,
                        target: tgt,
                        source: src,
                        value: v,
                        constraint: constraintType(tgt, src),
                        before: tgtDom.slice(),
                    });

                    tgtDom.splice(k, 1);
                    changed = true;

                    this.record({
                        type: "ac3_domain_after",
                        tag,
                        wave,
                        cell: tgt,
                        after: tgtDom.slice(),
                    });

                    if (tgtDom.length === 0) {
                        this.record({ type: "contradiction", tag, wave, cell: tgt });
                        return { sudoku, solvable: false };
                    }
                }
            }

            if (!changed) break;
            wave++;
        }

        return { sudoku, solvable: true };
    }

    // ---------- Hidden single ----------
    findHiddenSingle(domainGrid) {
        for (let ui = 0; ui < UNITS.length; ui++) {
            const cells = UNITS[ui];
            const kind = ui < 9 ? "row" : ui < 18 ? "col" : "box";
            const index = ui % 9;

            for (let d = 1; d <= 9; d++) {
                let hit = -1;
                let hits = 0;

                const unitSnapshot = new Array(9);
                for (let k = 0; k < 9; k++) {
                    const cell = cells[k];
                    const dom = domainGrid[cell];
                    unitSnapshot[k] = { cell, domain: dom.slice() };
                    if (dom.includes(d)) {
                        hits++;
                        hit = cell;
                        if (hits > 1) break;
                    }
                }

                if (hits === 1) {
                    const before = domainGrid[hit].slice();
                    if (before.length === 1 && before[0] === d) continue;

                    return {
                        technique: "hidden_single",
                        unit: { kind, index },
                        digit: d,
                        target: hit,
                        targetBefore: before,
                        unitCells: unitSnapshot,
                    };
                }
            }
        }
        return null;
    }

    // ---------- Naked pair ----------
    findNakedPair(domainGrid) {
        for (let ui = 0; ui < UNITS.length; ui++) {
            const cells = UNITS[ui];
            const kind = ui < 9 ? "row" : ui < 18 ? "col" : "box";
            const index = ui % 9;

            const buckets = new Map(); // key "a,b" -> [cell, cell, ...]

            for (let k = 0; k < 9; k++) {
                const cell = cells[k];
                const dom = domainGrid[cell];
                if (dom.length !== 2) continue;
                const a = dom[0], b = dom[1];
                const key = a < b ? `${a},${b}` : `${b},${a}`;
                const arr = buckets.get(key);
                if (arr) arr.push(cell);
                else buckets.set(key, [cell]);
            }

            for (const [key, pairCells] of buckets.entries()) {
                if (pairCells.length !== 2) continue;

                const [v1, v2] = key.split(",").map(Number);
                const eliminations = [];

                for (let k = 0; k < 9; k++) {
                    const cell = cells[k];
                    if (cell === pairCells[0] || cell === pairCells[1]) continue;

                    const dom = domainGrid[cell];
                    if (dom.includes(v1)) eliminations.push({ cell, value: v1 });
                    if (dom.includes(v2)) eliminations.push({ cell, value: v2 });
                }

                if (eliminations.length) {
                    return {
                        technique: "naked_pair",
                        unit: { kind, index },
                        values: [v1, v2],
                        pairCells: pairCells.map(cell => ({ cell, values: domainGrid[cell].slice() })),
                        eliminations,
                        unitCells: cells.map(cell => ({ cell, domain: domainGrid[cell].slice() })),
                    };
                }
            }
        }
        return null;
    }

    applyNakedPair(domainGrid, inf, tag) {
        for (const e of inf.eliminations) {
            const res = this.applyElimination(domainGrid, e.cell, e.value, {
                technique: "naked_pair",
                tag,
                unit: inf.unit,
                values: inf.values.slice(),
                pairCells: inf.pairCells.map(c => ({ cell: c.cell, values: c.values.slice() })),
                unitCells: inf.unitCells,
            });
            if (res === "contradiction") return "contradiction";
        }
        return true;
    }

    // ---------- Propagation loop ----------
    propagate(domainGrid, tag) {
        while (true) {
            const { sudoku, solvable } = this.ac3(domainGrid, tag);
            if (!solvable) return { grid: sudoku, solvable: false };
            domainGrid = sudoku;

            const hs = this.findHiddenSingle(domainGrid);
            if (hs) {
                this.applyWrite(domainGrid, hs.target, hs.digit, {
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

            const np = this.findNakedPair(domainGrid);
            if (np) {
                const r = this.applyNakedPair(domainGrid, np, tag);
                if (r === "contradiction") return { grid: domainGrid, solvable: false };
                continue;
            }

            return { grid: domainGrid, solvable: true };
        }
    }

    // ---------- MRV branching search ----------
    _solveGrid(stack, iterations) {
        let didRootBoundary = false;

        while (stack.length > 0) {
            const grid = stack[0];
            const rest = stack.slice(1);
            iterations++;

            if (iterations > 4000) {
                return { sudoku: this.toSimpleSudoku(grid), iterations: Infinity };
            }

            const tag = didRootBoundary ? "branch" : "root";
            const { grid: newGrid, solvable } = this.propagate(grid, tag);

            if (!didRootBoundary) {
                didRootBoundary = true;
                this.ROOT_END = this.AC3_HISTORY.length;
            }

            if (!solvable) {
                stack = rest;
                continue;
            }

            const filled = newGrid.every(dom => dom.length === 1);
            if (filled) {
                return { sudoku: this.toSimpleSudoku(newGrid), iterations };
            }

            // MRV: pick smallest domain > 1 (sort by size only)
            const possibles = [];
            for (let i = 0; i < 81; i++) {
                if (newGrid[i].length > 1) possibles.push(i);
            }
            possibles.sort((a, b) => newGrid[a].length - newGrid[b].length);

            const cell = possibles[0];
            const dom = newGrid[cell];

            this.record({
                type: "branch",
                tag: "branch",
                iter: iterations,
                cell,
                domain: dom.slice(),
            });

            const newGrids = dom.map(v => {
                const copy = this.cloneDomainGrid(newGrid);
                copy[cell] = [v];
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

    // ---------- Clues ----------
    getClueCandidates(rootHistory) {
        const candidates = [];

        // Writes: naked_single + hidden_single
        for (let i = 0; i < rootHistory.length; i++) {
            const e = rootHistory[i];
            if (e.type !== "write" || e.tag !== "root") continue;

            if (Array.isArray(e.after) && e.after.length === 1) {
                candidates.push({
                    technique: "naked_single",
                    action: { type: "place", cell: e.cell, value: e.value },
                    rationale: { cell: e.cell, value: e.value, domainBefore: e.before },
                    sourceEvents: [i],
                    score: this.CLUE_PRIORITY.naked_single,
                });
            }

            if (e.technique === "hidden_single") {
                candidates.push({
                    technique: "hidden_single",
                    action: { type: "place", cell: e.cell, value: e.value },
                    rationale: e.rationale,
                    sourceEvents: [i],
                    score: this.CLUE_PRIORITY.hidden_single,
                });
            }
        }

        // Naked pairs: group eliminations by identical rationale signature
        const npGroups = new Map();
        for (let i = 0; i < rootHistory.length; i++) {
            const e = rootHistory[i];
            if (e.type !== "elimination" || e.technique !== "naked_pair" || e.tag !== "root") continue;
            const r = e.rationale;
            const key = JSON.stringify({ unit: r.unit, values: r.values, pairCells: r.pairCells });
            const arr = npGroups.get(key);
            if (arr) arr.push({ e, i });
            else npGroups.set(key, [{ e, i }]);
        }

        for (const group of npGroups.values()) {
            const chosen = group[0];
            candidates.push({
                technique: "naked_pair",
                action: { type: "eliminate", cell: chosen.e.cell, value: chosen.e.value },
                rationale: chosen.e.rationale,
                sourceEvents: group.map(g => g.i),
                score: this.CLUE_PRIORITY.naked_pair,
            });
        }

        return candidates;
    }

    getFirstClue(rootHistory) {
        const candidates = this.getClueCandidates(rootHistory);
        if (!candidates.length) return null;

        candidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;

            if (a.action.type !== b.action.type) {
                return a.action.type === "place" ? -1 : 1;
            }

            // deterministic fallback: row, col, value
            const ar = CELL_ROW[a.action.cell], br = CELL_ROW[b.action.cell];
            if (ar !== br) return ar - br;

            const ac = CELL_COL[a.action.cell], bc = CELL_COL[b.action.cell];
            if (ac !== bc) return ac - bc;

            return a.action.value - b.action.value;
        });

        return candidates[0];
    }
}
