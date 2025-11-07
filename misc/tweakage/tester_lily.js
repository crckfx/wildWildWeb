export function runTests(
    tests,
    solver,
) {
    console.log("Countdown Numbers Solver");
    const t0 = performance.now();

    for (const t of tests) {
        const opts = { allowDecimal: t.allowDecimal ?? false, maxSolutions: 500 };
        const sols = solver(t.nums, t.target, opts);
        console.group(
            `nums=${t.nums.join(',')} target=${t.target} decimals=${opts.allowDecimal}`
        );
        console.log(`Total solutions: ${sols.length}`);
        console.log(sols);
        console.groupEnd();
    }

    console.log(`Total time: ${(performance.now() - t0).toFixed(1)} ms`);
}
