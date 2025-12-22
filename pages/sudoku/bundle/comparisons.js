import { SolverAC3_2D } from "./SolverAC3/SolverAC3_2D.js";
import { SolverAC3_1D } from "./SolverAC3/SolverAC3_1D.js";
import { puzzles } from "./puzzles.js";

const qq = new qqwing();
const ac3_2D = new SolverAC3_2D();
const ac3_1D = new SolverAC3_1D();

console.log("qq:", qq);
console.log("ac3 2D:", ac3_2D);
console.log("ac3 1D:", ac3_1D);

function gridToString(grid) {
    // grid: 9x9 numbers
    return grid.flat().join("");
}
function gridToString1D(grid) {
    // grid: 81 numbers
    return grid.join("");
}

// if both logs work (they do), then we should be able to loop over some given set of puzzles from its start (ie stop at a named amount),
// and puzzles import is the perfect candidate for this 
// the idea is to, for each counted puzzle: 
// - solve from mission using qqwing
// - solve from mission using ac3
// - compare each solution to one another, and also compare against the puzzle's embedded solution, if one exists.
// we are assuming that puzzles have a single solution strictly here (they are 'good' puzzles), and that that solution should match across all 2 or 3 available answers.
// as such, then: if we find a mismatch, that should clearly be logged. and so too should valid continue operations.

function runTests() {
    for (let i = 0; i < puzzles.length; i++) {
        const p = puzzles[i];
        const id = p.id;

        let hasSol = "no";
        if (p.solution) {
            hasSol = "yes"
        }

        // parse
        const grid_2D = ac3_2D.parsePuzzle(p.mission);
        const grid_1D = ac3_1D.parsePuzzle(p.mission);

        // run qq first
        const qq = new qqwing();
        qq.setRecordHistory(true);
        qq.setPrintStyle(qqwing.PrintStyle.ONE_LINE);
        qq.setPuzzle(grid_1D);
        qq.solve();
        const qqSolution = qq.getSolutionString().trim();

        // solve
        const result2D = ac3_2D.solve(grid_2D);
        const result1D = ac3_1D.solve(grid_1D);
        const ac3Solution2D = gridToString(result2D.sudoku);
        const ac3Solution1D = gridToString1D(result1D.sudoku);
        
        
        //
        const resultMatches = (ac3Solution1D === p.solution);
        const solution_2D_matches = (ac3Solution2D === p.solution);
        const qq_solution_matches = (qqSolution === p.solution);
        
        
        console.group(id);
        console.log(ac3Solution2D);
        console.log(ac3Solution1D);
        console.log(qqSolution);
        console.log(`${id} has solution: ${hasSol}, matches ac31D: ${resultMatches}, all matches qq: ${qq_solution_matches}, matches ac32D: ${solution_2D_matches}`);

        console.groupEnd();
        
    }
}

runTests();