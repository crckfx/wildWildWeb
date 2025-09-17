# wildWildWeb
a project to supersede MathIsWild
- initially got swallowed up by its build tool
- then, the build tool was separated into a project called *pageGoblin*
- now, it's a site to supersede MathIsWild again (built with pageGoblin)

## building
- uses *pageGoblin* (you need to have the repo on your machine)

### using pageGoblin
- pageGoblin is called as a node CLI script
- execute its "resolve-all", along with the following params::
    1. path to wildWildWeb root directory
    2. path to your desired build (output) directory
    3. path to this repo's pageGoblin "config.json" file
    4. flags: *--write* and/or *--clean* 

for example, from your wildWildWeb directory (Powershell):
```powershell
# in this case, pageGoblin repo lives at "Z:\dev\node\pageGoblin"
node Z:/dev/node/pageGoblin/resolve-all.js . ./dist ./config.json --write --clean
```
or (bash):
```bash
# in this case, pageGoblin repo lives at "~/webroot/nodemode/pageGoblin"
node ~/webroot/nodemode/pageGoblin/resolve-all.js . ./dist ./data/config.json --write --clean
```

- in these examples, we build the webroot at "&lt;wildWildWeb directory&gt;/dist", but there's no reason you can't build it to somewhere else
- the wildWildWeb config file (currently) lives at the wildWildWeb root directory
- the '--write' flag says "actually build; don't just show me the build proposal"
- the '--clean' flag says "if existing files in the build directory are not part of the plan, delete them"