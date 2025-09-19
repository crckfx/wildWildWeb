# wildWildWeb
a project to supersede MathIsWild
- initially got swallowed up by its build tool
- then, the build tool was separated into a project called *pageGoblin*
- now, it's a site to supersede MathIsWild again (built with pageGoblin)

## overview
- uses *pageGoblin* (you need to have the repo on your machine)

### default template
- stored at ```templates/page.ejs```
- it targets some site default layout styles via using '.page-content' and then &lt;main&gt;
- this template:
    - injects `headContent`, `title` & `styles` inside &lt;head&gt;
    - injects a &lt;header&gt; component before the &lt;main&gt;
    - injects 'body' inside &lt;main&gt;
    - injects a 'footer' component after the &lt;main&gt;
    - injects 'modules', 'scripts' & 'global' at the end of &lt;body&gt;


```html page.ejs
<!DOCTYPE html>
<html lang="en">

<head>
	<%- head %>
	<title><%= title %></title>
	<%- styles %>
</head>

<body>
	<div class="page-content">
		<%- header %>
		<main>
			<%- body %>
		</main>
		<%- footer %>
	</div>
	<%- modules %>
	<%- scripts %>
    <%- global %>
</body>

</html>
```

this is the default page template, an example with less assumptions is at ```templates/page_blank.ejs```

### *config.json*
defaults for pageGoblin. default config is:
```json
{
    "headContentPath": "components/head-content.html",  // global inject into <head>
    "headerPath": "components/header/header.html",      // global <header> component
    "footerPath": "components/footer/footer.html",      // global <footer> component
    "templatePath": "templates/page.ejs",               // default page template

    "pagesJsonPath": "pages.json",
    "globalHtmlPath": "components/global.html"
}

```

### using pageGoblin
- pageGoblin is called as a node CLI script
- execute its `resolve-all.js`, along with the following params::
    1. path to wildWildWeb root directory
    2. path to your desired build (output) directory
    3. path to this repo's pageGoblin `config.json` file
    4. flags: `--write` and/or `--clean` 

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