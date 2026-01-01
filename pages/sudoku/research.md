# sudoku research 

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


## https://sudokubliss.com/sudoku-solver
this one is a whole own embedded system, it's awesome, and it's too dense to provide much inspiration here

found these imports:
```html
<!-- Add sudoku.js library-->
<script src="/javascripts/sudoku.js?v=1765828896000"></script>
<!-- Add the compiled sudoku game code-->
<script src="/javascripts/dist/Player32.js?v=1765829253000"></script>
```

## https://tn1ck.com/blog/how-to-generate-sudokus
discussing methods to design a sudoku solver, the article explores using a 'depth-first search' approach.
> `We use a depth-first search (short DFS) for all our different strategies here. We abstract this by the following function. We make it Sudoku specific instead of completely generic for ease of use.`
exploring DFS, it describes
- brute-force
- skip on invalid (improved brute-force)
- minimum remaining value

after exploring DFS, the article explores an 'arc consistency' approach.
> `We now embark on a different way to solve the Sudoku, namely framing it as a Constraint Satisfaction Problem to solve it and then use Arc Consistency to simplify the problem.`

this proved to be the 'best' method per the article conclusion

> for constructing a solver in this project, the 'arc consistency' approach was chosen

# cases

## puzzle 701
```js
const puzzle_701 = { 
    id: 701, 
    mission: "005070036400000510002000000000000040507080000010030020600000004240300080003008070", 
    solution: "185479236439862517762513498396725841527184963814936725678291354241357689953648172", 
    difficultyCode: 4 
},
```

at this point:
>`105070236400000517702500498300725841527080963814936725678000354241357689953648172`
is "too hard" for sudokubliss.com's 'clue generator'? ('Sorry, this is too hard for me' or something like that as popup on clue request)

when using sudokubliss.com's **solver**:
>`Brute force was required to finish the puzzle.`

**the same goes for using sudokubliss at a certain point on puzzle 702**

## hard sudoku from the newspaper (26/12/25)

progress: 509003214060042905400095608306917502200356109195284367604021893000009421900438756
```js
{
    id: 703,
    mission: `
    500000210
    060000000
    400005000
    300010000
    000006009
    105280307
    604020003
    000030756
    `
}
```
```js
{
    id: 703,
    mission: "500000210060000000400005000300010000000006009105280307604020003000030756",
    solution: "",
}