/* =========================================================
   ac3.js — AC3 + MRV split (tn1ck-style) with history logging
   Key fix: root-only history boundary (pre-branch)
   Contract preserved:
     solve(grid) -> { sudoku, iterations }
   UI IDs assumed:
     #input, #solveBtn, #output
   Coordinates:
     x = column (0..8), y = row (0..8), grid indexed as grid[y][x]
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

function constraintType(x, y, xx, yy) {
  if (y === yy) return "row";
  if (x === xx) return "column";
  if (squareIndex(x, y) === squareIndex(xx, yy)) return "square";
  return "unknown";
}

/* =========================
   History (side channel)
   ========================= */

const AC3_HISTORY = [];
window.AC3_HISTORY = AC3_HISTORY;

// Root boundary: index into AC3_HISTORY after the FIRST ac3() call on the initial grid
let AC3_ROOT_END = 0;
window.AC3_ROOT_END = AC3_ROOT_END;

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
   AC3 (behavior preserved + logging)
   ========================= */

function ac3(sudoku) {
  sudoku = sudoku.map(r => r.map(c => c.slice()));
  let wave = 0;

  while (true) {
    let change = false;

    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        let domain1 = sudoku[y][x];

        const peers = [];

        // row peers
        for (let xx = 0; xx < 9; xx++) {
          if (xx !== x) peers.push([xx, y]); // [x,y]
        }

        // column peers
        for (let yy = 0; yy < 9; yy++) {
          if (yy !== y) peers.push([x, yy]); // [x,y]
        }

        // square peers
        const square = SQUARE_TABLE[squareIndex(x, y)];
        for (let i = 0; i < 9; i++) {
          const [xx, yy] = square[i];
          if (xx !== x || yy !== y) peers.push([xx, yy]); // [x,y]
        }

        for (const [xx, yy] of peers) {
          const domain2 = sudoku[yy][xx];

          if (domain2.length === 1) {
            const v = domain2[0];
            const idx = domain1.indexOf(v);

            if (idx !== -1) {
              record({
                type: "elimination",
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
   Search wrapper (MRV split)
   ========================= */

function _solveGridAC3(stack, iterations) {
  let didRootAC3 = false;

  while (stack.length > 0) {
    let [grid, ...rest] = stack;
    iterations++;

    if (iterations > 4000) {
      return { sudoku: toSimpleSudoku(grid), iterations: Infinity };
    }

    // AC3 propagation
    const { sudoku: newGrid, solvable } = ac3(grid);

    // Set root boundary immediately after the FIRST AC3 call on the initial grid
    if (!didRootAC3) {
      didRootAC3 = true;
      AC3_ROOT_END = AC3_HISTORY.length;
      window.AC3_ROOT_END = AC3_ROOT_END;
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
    const possibleCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].length > 1) possibleCells.push([r, c]); // [row,col]
      }
    }

    possibleCells.sort((a, b) => grid[a[0]][a[1]].length - grid[b[0]][b[1]].length);

    const [rowIndex, colIndex] = possibleCells[0];
    const cell = grid[rowIndex][colIndex];

    // Domain split (search). Log the branch point (optional but useful).
    record({
      type: "branch",
      iter: iterations,
      cell: { x: colIndex, y: rowIndex },
      domain: cell.slice(),
    });

    const newGrids = cell.map(n =>
      grid.map((row, r) =>
        r === rowIndex
          ? row.map((cands, c) => (c === colIndex ? [n] : cands.slice()))
          : row.slice()
      )
    );

    stack = newGrids.concat(rest);
  }

  return { sudoku: null, iterations: Infinity };
}

function solve(grid) {
  AC3_HISTORY.length = 0;
  AC3_ROOT_END = 0;
  window.AC3_ROOT_END = 0;

  const stack = [toDomainSudoku(grid)];
  return _solveGridAC3(stack, 0);
}

/* =========================
   Forced-move extraction
   ========================= */

function getRootHistory() {
  return AC3_HISTORY.slice(0, AC3_ROOT_END);
}

function findFirstForced(history) {
  const last = new Map(); // "x,y" -> last domain array

  for (const e of history) {
    if (e.type !== "domain_after") continue;

    const key = `${e.cell.x},${e.cell.y}`;
    const prev = last.get(key);
    last.set(key, e.after);

    if (prev && prev.length > 1 && e.after.length === 1) {
      return { cell: { x: e.cell.x, y: e.cell.y }, value: e.after[0], wave: e.wave };
    }
  }
  return null;
}

function explainForced(history, forced) {
  if (!forced) return [];
  return history.filter(e =>
    e.type === "elimination" &&
    e.target.x === forced.cell.x &&
    e.target.y === forced.cell.y &&
    e.wave <= forced.wave
  );
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
    console.log("AC3 history:", AC3_HISTORY);
    return;
  }

  out.textContent =
    result.sudoku.map(r => r.join(" ")).join("\n") +
    "\n\niterations: " + result.iterations;

  console.log("AC3 history (full):", AC3_HISTORY);
  console.log("AC3 root end index:", AC3_ROOT_END);

  const rootHistory = getRootHistory();
  console.log("AC3 history (root only):", rootHistory);

  const forced = findFirstForced(rootHistory);
  console.log("First forced (root only):", forced);

  const expl = explainForced(rootHistory, forced);
  console.log("Forced explanation (root only):", expl);
};
