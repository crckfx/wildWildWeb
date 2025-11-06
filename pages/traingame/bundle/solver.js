
export function countdownSolve(numbers, target, opts = {}) {
    const { allowDecimal = false, maxSolutions = 500 } = opts;
    const tol = 1e-9;
    const results = new Set();

    // Canonical representation for commutative ops
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
            if (Math.abs(v - target) < tol)
                results.add(exprs[0]);
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
                    reduce([...restVals, val], [...restExprs, ex]);
                };

                // Operations with canonicalized expressions
                push(a + b, canonical(ea, eb, '+'));
                push(a * b, canonical(ea, eb, '*'));
                push(a - b, `(${ea}-${eb})`);
                push(b - a, `(${eb}-${ea})`);
                if (b !== 0) push(a / b, `(${ea}/${eb})`);
                if (a !== 0) push(b / a, `(${eb}/${ea})`);
            }
        }
    }

    // Enumerate all subsets (allow discard)
    const n = numbers.length;
    for (let mask = 1; mask < (1 << n); mask++) {
        const subset = [];
        for (let i = 0; i < n; i++)
            if (mask & (1 << i)) subset.push(numbers[i]);
        if (subset.length < 2) continue;
        reduce(subset, subset.map(String));
    }

    return Array.from(results);
}

// ---------------- Demo tests ----------------
(function runTests() {
    // console.clear();
    console.log("Countdown Numbers Solver — v4 (ordered +/*)");

    const tests = [
        { nums: [4, 9, 10, 11], target: 36, allowDecimal: false },
        { nums: [1, 3, 7, 10], target: 21, allowDecimal: false },
    ];

    for (const t of tests) {
        const opts = { allowDecimal: t.allowDecimal, maxSolutions: 500 };
        const sols = countdownSolve(t.nums, t.target, opts);
        console.group(`nums=${t.nums.join(',')} target=${t.target} decimals=${opts.allowDecimal}`);
        console.log(`Total solutions: ${sols.length}`);
        console.log(sols);
        console.groupEnd();
    }
})();