# sudoku

### example puzzle from sudoku.com
```json
{
    "id": 406,
    "mission": "070800090900070003000500070100084000700000081800050400000000920490003108006028300",
    "solution":"275831694948672513631549872169284735754396281823157469387415926492763158516928347",
    "win_rate":63.26
}
```


so, for example, a configuration reads left to right as rows
zeroes are used for empty ones

a canvas would consist of a 9x9 grid and clicks would get listens, probably, to identify our current position. same for arrow keys when the sudo is selected.

## tasks
### main game
- [x] draw a grid
- [x] thick lines at edges and for 3x3 cubes
- [x] activate a grid cell
- [x] type into a grid cell
- [x] navigate grid cells with arrow keys
- [x] highlight row/column neighbours for selected cell
- [x] highlight box neighbours for selected cell
- [x] load in a puzzle as string
- [x] highlight "same value" cells
- [x] use different text colour for user-inputted numbers vs. clue numbers
- [x] use different text colour for 'incorrect' answers
- [x] track mistakes made
- [x] add a numpad so keyboard isn't required
- [x] know if the game is won
- [x] add erase button to controls
- [x] use colours from theme first
- [x] make mouse clicks snap immediately (ie. make mouse+keyboard combo feel snappy) 
    - achieved via "mousedown" instead of "click"
- [x] add undo (ie. game history)
- [x] store some memory of puzzle in `localStorage`
- [x] override puzzle loads with storage loads
- [x] block inputs on a completed puzzle
- [x] render a completed puzzle as completed on load from storage
- [x] provide a `reset` button for per-puzzle (game + storage)
- [x] provide more puzzles on the page (now 10 'easy' ones in a simple menu)
- [x] keep track of which digits have been completed (so their buttons can be styled / whatever)
- [x] trigger button style updates for completed digits (this could be used to trigger an animation or whatever event)
- [ ] provide a "how to play" description section
- [ ] show a 'congrats' modal when a puzzle is completed

### qqLoader
qqLoader.js marks a split into focusing on generating, solving, and clues. 
> multiple different pages are now using sudoku architecture

- [x] integrate qqwing JS (at /resources/qqwing-1.3.4) for generating puzzles
- [x] make a "soft load"; render puzzle to canvas bypassing game (at ./extra/qqLoader.js) - note: also uses highlighting
- [x] generate puzzle in-page using qqwing and soft-load it into canvas
- [x] derive a 'clue' from a qq-solved puzzle
    - achieved by using forked qqwing (ie. experiments in providing rich logging from qq)
- [x] provide 'paste puzzle JSON' (mission+solution) into soft-loader
- [x] provide 'paste mission string' (mission-only) into soft-loader

### ac3 solver
- [x] fork/steal tn1ck stuff to create "ac3 solver"
- [x] solve puzzle using ac3
- [x] generate clue using ac3+staging
- [x] make SolverAC3 into a JS class
- [x] test embedded puzzle solutions against live ac3+qqwing (running it gets the expected results)
- [x] create separate versions for 1D and 2D variations of the SolverAC3 class (tn1ck example uses 2D, but this project prefers 1D)
