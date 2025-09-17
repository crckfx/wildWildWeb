# todo

## current
- [ ] start work on "draggers"
- [ ] create (generate on builds) a map of the built pages (to be inflated at runtime for nav / UI purposes)
- [ ] create a ready-to-go build script inside this project (extending this - consider making "path to pageGoblin" part of the config)


<hr>

## finished
- [x] run headerPath custom include on "/away/"
- [x] (in build tools) make ensureDir() a global function
- [x] apply theme on page load globally
- [x] separate pageGoblin from wildWildWeb
- [x] persist theme choice across browser sessions
- [x] make theme application instantaneous (set the theme in the head; don't wait for DOMContentLoaded)