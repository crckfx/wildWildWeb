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

a canvas would consist of a 9x9 grid and clicks would get listens, probably, to identify our current position. same for arrow keys (when the sudoku is selected).


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
- [x] show a 'congrats' modal when a puzzle is completed
- [x] show info about the win on a completed puzzle display
- [ ] make handled keys not nerfed when trying to use a form on the page

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
- [ ] decouple "win modal" (+ some more) from soft-load; triggerGameEnd now breaks a puzzle finished in the qqloader page

### ac3 solver
- [x] fork/steal tn1ck stuff to create "ac3 solver"
- [x] solve puzzle using ac3
- [x] generate clue using ac3+staging
- [x] make SolverAC3 into a JS class
- [x] test embedded puzzle solutions against live ac3+qqwing (running it gets the expected results)
- [x] create separate versions for 1D and 2D variations of the SolverAC3 class (tn1ck example uses 2D, but this project prefers 1D)

### general / questions

>should *selected cell* be per-page, or based on DOM focus? (ie. can it be "un-focused" or not?)

>should the sudoku game be a class, too?

## rewriting game as class
It makes sense to redesign as 'OOP-style' to help separate stuff out for a more general model of a game.

A basic class `SudokuGame` will be invoked by SOMETHING, for examples:
- a full game UI with a puzzle catalog, ecosystem-integrated menus, with stored progress and completion stats (current main game)
- a single game run totally isolated from a catalog or larger ecosystem (eg. qqLoader)
- (imagine) a terminal-based interface, where the board is printed as text. a simple highlight can be moved around on a monospace 9x9 text board using arrow keys, and numbers can be written in using keys. note: in JS, this would require its own UI layer, but the point is that our game class should be compatible with such a constrained design.

It makes sense that `draw.js` might become `Renderer.js`, but currently unclear where sharing occurs. Should Renderer receive a Game? Should a Game receive a Renderer? Should a function be passed as a param? idk

What about the UI layer? What should UI definitely own?:
- all numpad
- all key handling logic
- click handling logic

That's better described as 'controls' so far. It's possible that Controls gets further decoupled from "UI", but probably safe to say that even if written in a separate module, Controls should be owned by UI.

So, beyond controls, what else does UI own? Does it own the Renderer?
Well, loosely yes; the board is part of the UI. but perhaps in this sense, UI owns the Game, too?

It doesn't seem right for "UI to own Game". So, there's gotta be a better way to reconcile this model conceptually.

## rewrite progress
rewritten thing is now playable but doesn't have game win orchestration or puzzle browser or anything.

>new feature added: key handling only happens if the UI is focused.

in the HTML, the canvas is contained inside the UI.

in the JS, the `loader` loads (and instantiates) `SudokuGame`, `Renderer`, and `UI`. 
- `SudokuGame` and `Renderer` are both classes, and both draw from the `static` file
- `UI` is a custom object, not a class. it receives both and does DOM stuff
- `manager` is new and is for the UI beyond the board controls; for the larger app puzzle system

> problem: now, the win condition is still firing a (normal) draw after the "draw without highlighting call"

### 30/12/25
now the "board analyse" (ie. "correct digits count") is done by manager, correctly. achieved by tracking `manager.lastCompletedDigits` and writing to it each time. the printed analyses appear correct, but we need to:
- [x] make sure analysis (aka "which digits are completed?" DOM stuff) is done in replay history
- [x] make sure analysis (aka "which digits are completed?" DOM stuff) is done in undo, redo

also, (separate to board analyse) redo doesn't yet properly engage with history in the same way that normal and undo moves do. redo is not finished.

mistakesMade is calculated by the game. make a decision about whether it should be this way or not.

modified mstorage.js to overwrite history on normal forward-type saveMove instead of on history seek.

- [ ] add mistakesMade printing to manager
- [x] add currentPuzzleId printing to manager
- [x] hook up "reset this puzzle" button in manager
- [x] hook up a "copy board" button in manager
- [ ] update DOM puzzle buttons on wins / resets (potentially on more?)

### roles
**SudokuGame**:
- does the computations for a sudoku board
- loads in a puzzle fresh, or loads one in with a runtimeHistory
- receives controls via a `UI` object
- emits events for each move
- tracks a history of moves made

**Manager**:
- has a `SudokuGame` instance, along with a `Renderer` instance and a `UI` object
- knows about puzzle IDs
- receives DOM inputs: tells its `SudokuGame` to try update (if applicable), tells its `Renderer` to draw when needed