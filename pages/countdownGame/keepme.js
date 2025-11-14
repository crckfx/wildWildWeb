// for solverGame - autoskip if next exists; unfocus if not. doesn't care about empty
function handleEnterKey(i) {
    // disallow Enter action if this numbin's value is null
    if (nbs[i].value === null) return;
    // validate the index first
    if (i >= 0 && i < nbs.length) {
        // see if there's a next numbin in the set
        const next = nbs[i + 1];
        if (next) {
            // move to next if exists
            next.input.focus({ preventScroll: true });
        } else {
            // unfocus if no next (it's likely the last of the set)
            nbs[i].input.blur();
        }
    }
}

// apply the input overrides to the numbin
// nb.handleBeforeInput = e => beforeInput_range(e, nb);
// nb.handleEnterKey = () => handleEnterKey(i); // overwrite the numbin's enter key handler