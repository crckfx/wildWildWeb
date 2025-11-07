// ============================================================
// countdownSolve()
// ------------------------------------------------------------
// Purpose:
//   Compute all valid expressions reaching a target value
//   using the Countdown Numbers game rules.
//
// Configuration (fixed to dCode strict):
//   • Only integer intermediate results allowed
//   • No negative intermediates
//   • Division only if divides exactly (a % b === 0)
//   • Commutative ops (+, *) canonicalized to avoid duplicates
//   • Outer parentheses removed on final output
// ============================================================

export function countdownSolve(numbers, target, opts = {}) {
    const { maxSolutions = 500 } = opts;

    // ------------------------------------------------------------
    // Normalize all inputs to numeric form.
    // (HTML inputs come through as strings in traingame.js.)
    // ------------------------------------------------------------
    numbers = numbers.map(Number);
    target = Number(target);

    // Results will be stored as text expressions (Set ensures uniqueness)
    const results = new Set();

    // ------------------------------------------------------------
    // canonical(aExpr, bExpr, op)
    //   Returns canonical string for operation.
    //   For commutative ops, ensures order of operands is stable
    //   (e.g., "3+4" and "4+3" collapse to the same form).
    // ------------------------------------------------------------
    function canonical(aExpr, bExpr, op) {
        if (op === '+' || op === '*') {
            return (aExpr < bExpr)
                ? `(${aExpr}${op}${bExpr})`
                : `(${bExpr}${op}${aExpr})`;
        }
        // For non-commutative ops keep explicit operand order.
        return `(${aExpr}${op}${bExpr})`;
    }

    // ------------------------------------------------------------
    // reduce(vals, exprs)
    //   Core recursion: combine every unordered pair of values
    //   with each arithmetic operator, generate new partial
    //   results, and recurse until one value remains.
    // ------------------------------------------------------------
    function reduce(vals, exprs) {
        // stop recursion if limit reached
        if (results.size >= maxSolutions) return;

        const n = vals.length;

        // Base case: one number left → check for target hit
        if (n === 1) {
            const v = vals[0];
            if (v === target) results.add(exprs[0]);
            return;
        }

        // Pairwise combination step
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {

                // current operands
                const a = vals[i], b = vals[j];
                const ea = exprs[i], eb = exprs[j];

                // remaining operands for next recursion
                const restVals = [];
                const restExprs = [];
                for (let k = 0; k < n; k++) if (k !== i && k !== j) {
                    restVals.push(vals[k]);
                    restExprs.push(exprs[k]);
                }

                // --------------------------------------------
                // push(val, ex)
                //   Helper: validates and pushes new state.
                //   Rejects negatives and non-integers.
                // --------------------------------------------
                const push = (val, ex) => {
                    if (!Number.isFinite(val)) return;
                    if (val < 0) return;                     // disallow negatives
                    if (Math.floor(val) !== val) return;     // require integer
                    reduce([...restVals, val], [...restExprs, ex]);
                };

                // --------------------------------------------
                // Enumerate all possible operations
                // --------------------------------------------

                // Addition (commutative)
                push(a + b, canonical(ea, eb, '+'));

                // Multiplication (commutative)
                push(a * b, canonical(ea, eb, '*'));

                // Subtraction (both orders)
                push(a - b, `(${ea}-${eb})`);
                push(b - a, `(${eb}-${ea})`);

                // Division (both orders) — exact divisibility only
                if (b !== 0 && a % b === 0) push(a / b, `(${ea}/${eb})`);
                if (a !== 0 && b % a === 0) push(b / a, `(${eb}/${ea})`);
            }
        }
    }

    // ------------------------------------------------------------
    // Enumerate every subset of the input numbers (size ≥ 2)
    // Each subset is treated as an independent puzzle instance.
    // ------------------------------------------------------------
    const n = numbers.length;
    for (let mask = 1; mask < (1 << n); mask++) {
        if ((mask & (mask - 1)) === 0) continue; // skip single-element subsets

        // Collect numbers present in this subset bitmask
        const subset = [];
        for (let i = 0; i < n; i++) if (mask & (1 << i)) subset.push(numbers[i]);

        // Launch recursion with numeric values and their string forms
        reduce(subset, subset.map(String));

        if (results.size >= maxSolutions) break;
    }

    // ------------------------------------------------------------
    // Post-processing:
    //   Remove redundant outer parentheses for clean display.
    // ------------------------------------------------------------
    return Array.from(results, expr =>
        expr.startsWith('(') && expr.endsWith(')')
            ? expr.slice(1, -1)
            : expr
    );
}
