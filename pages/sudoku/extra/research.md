# sudoku research 
## https://sudokubliss.com/sudoku-solver

found these imports:
```html
<!-- Add sudoku.js library-->
<script src="/javascripts/sudoku.js?v=1765828896000"></script>
<!-- Add the compiled sudoku game code-->
<script src="/javascripts/dist/Player32.js?v=1765829253000"></script>
```

## https://tn1ck.com/blog/how-to-generate-sudokus
it goes:
- depth-first search (We use a depth-first search (short DFS) for all our different strategies here. We abstract this by the following function. We make it Sudoku specific instead of completely generic for ease of use.)
- brute-force
- skip on invalid (improved brute-force)
- minimum remaining value
- arc consistency (DOES NOT USE DFS)

>arc consistency approach was chosen