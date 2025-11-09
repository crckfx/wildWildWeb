# solver

>## it's like a calculator, but sorta backwards

it's an attempt to provide an engine that can brute-force solve both TRAIN GAME and Countdown's numbers game (a.k.a. Letters & Numbers' numbers game)

it takes in:
- some array of numbers 
- a target number to reach

and tries to make a maths out of the bunch of numbers to solve for the target, using simple math operations (```+ - * /```)

## todo

yeah we got some stuff to do on the solver

- [ ] implement ***kitchenSink*** flag

# interface(s)

there's 2 different UIs being developed in parallel that use *solver*:

- **traingame**
- **countdownGame**

### an interface uses several numbins

- always 1x for the **targetNumber** (1-999)
- ***traingame*** uses 4x digits (0-9)
- ***countdown*** uses 6x numbers (1-100)

### event overrides: why we're trying to get them out of the UI scripts

the idea with numbin is you opt-in to listen on its **input** events.

- traingame *really* wants to have single digit only, so targeting beforeInput events is a neat way to sanitise everything typed.
- same goes for countdownGame, we want to allow typing but block if the new digit would render us exceeding max
- but the beforeinput events are not really related to any solver UI; they're specific behaviour types.

### architectural solution: UI overwrites default handler with imported one

- Numbin provides a default handler for beforeinput, which discards non-number characters via `this.input.addEventListener("beforeinput", e => this.handleBeforeInput(e));`,
- UI does `import { beforeInput_range } from "/misc/numbin/numbinHandlers.js";`,
- UI then does (in initSolverGame): `nb.handleBeforeInput = e => beforeInput_range(e, nb);`.

>this way, UI can overwrite with whatever it wants, including certain behaviour templates provided ready-to-go by Numbin on the side.

because there's no way (yet) to specify behaviour in html, UI must overwrite the handler with *SOMETHING*. however, it's currently none of our business whether that *something* is: 
- inlined and very specific, or
- imported from some existing pool of handlers for defined behaviours

## cool bugs
### range 1-100 allows 0 while typing

typing '0' in an empty Numbin that doesn't allow 0, it totally updates the UI's array before blur (aka unfocus).

on blur the 0 is deemed invalid and it snaps back to lastValid. but disallowed numbing is peeking through whilst focused.

## todo

- [ ] for example, typing '0' is allowed in a range 1-100. enter is prevented if the field is empty, and it should be prevented the same way if the field is '0'; don't just reset and carry on: clear it and stay there as if you'd entered "nothing"