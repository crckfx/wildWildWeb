export function countdownSolve(numbers, target, opts = {}) {
    const {
        allowDecimal = false,
        maxSolutions = 500,
        allowNegativeIntermediate = false // dCode toggle: default off
    } = opts;

    const tol = 1e-9;
    const results = new Set();

    function canonical(aExpr, bExpr, op) {
        if (op === '+' || op === '*') {
            return (aExpr < bExpr)
                ? `(${aExpr}${op}${bExpr})`
                : `(${bExpr}${op}${aExpr})`;
        }
        return `(${aExpr}${op}${bExpr})`;
    }

    function reduce(vals, exprs) {
        if (results.size >= maxSolutions) return;
        const n = vals.length;

        if (n === 1) {
            const v = vals[0];
            if (Math.abs(v - target) < tol) results.add(exprs[0]);
            return;
        }

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const a = vals[i], b = vals[j];
                const ea = exprs[i], eb = exprs[j];
                const restVals = [];
                const restExprs = [];
                for (let k = 0; k < n; k++) if (k !== i && k !== j) {
                    restVals.push(vals[k]);
                    restExprs.push(exprs[k]);
                }

                const push = (val, ex) => {
                    if (!Number.isFinite(val)) return;
                    if (!allowDecimal && Math.abs(val - Math.round(val)) > tol) return;
                    if (!allowNegativeIntermediate && val < -tol) return; // NEW
                    reduce([...restVals, val], [...restExprs, ex]);
                };

                // try all ops; +/* canonicalize only by operand order
                push(a + b, canonical(ea, eb, '+'));
                push(a * b, canonical(ea, eb, '*'));
                push(a - b, `(${ea}-${eb})`);
                push(b - a, `(${eb}-${ea})`);
                if (b !== 0) {
                    const q = a / b;
                    if (allowDecimal || Math.abs(q - Math.round(q)) < tol)
                        push(q, `(${ea}/${eb})`);
                }
                if (a !== 0) {
                    const q = b / a;
                    if (allowDecimal || Math.abs(q - Math.round(q)) < tol)
                        push(q, `(${eb}/${ea})`);
                }
            }
        }
    }

    const n = numbers.length;
    for (let mask = 1; mask < (1 << n); mask++) {
        if ((mask & (mask - 1)) === 0) continue; // need at least 2 tiles
        const subset = [];
        for (let i = 0; i < n; i++) if (mask & (1 << i)) subset.push(numbers[i]);
        reduce(subset, subset.map(String));
        if (results.size >= maxSolutions) break;
    }

    return Array.from(results);
}
