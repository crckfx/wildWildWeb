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

### the colour relationships in sudoku.com
backgrounds
- none: #ffffff
- selected: #bbdefb
- neighbour: #e2ebf3
- sameValue: #c3d7ea

grid
- thin line: #cad0db
- thick line: #344861

text
- given: #344861
- user: #325aaf

button (new game)
- bg: #5a7bc0
- text: #ffffff

button (numpad large)
- bg: #eaeef4
- bg-hover: #dce3ed
- bg-active: #d2dae7
- text: #325aaf


so, for example, a configuration reads left to right as rows
zeroes are used for empty ones

a canvas would consist of a 9x9 grid and clicks would get listens, probably, to identify our current position. same for arrow keys when the sudo is selected.

### tasks
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
- [ ] render a completed puzzle as completed on load from storage
- [ ] provide a `reset` button for per-puzzle storage
- [ ] display more puzzles on the page