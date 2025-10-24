# MENU (draft)
> this is a draft to help sort out the menu structure for this applet

APP PANEL 1
- [toolt] wildWildWeb (sitewide main menu)
    - [a] go back
    - [select] change site theme
- [toolt] UPLOAD
    - [button] from file
    - [button] from URL
- [toolt] CANVAS
    - [group] Resize (real; intrinsic, like photoshop's "image/canvas size")
        - [numbin] width
        - [checkbox] dimension lock
        - [numbin] height
    - [group] Background
        - [checkbox] show background 
        - [colourPicker] choose background colour
- [toolt] PREVIEW
    - [checkbox] show outline 
    - [checkbox] fit preview to screen (dirty grow/shrink)
- [toolt] EXPORT
    - [button] edit (open texteditor zone to modify svg code)
    - [button] export. should almost certainly be behind its own toolt. eg "as SVG", "as PNG"


    
# progress
- got the menu stuff into categories.
- disabled toolt hover functionality for now. (2 styles in toolt.css, 1 line in toolt.js)

issue: bottom menu panel now overflows without scroll and without flex-wrap.

issue: export buttons still do nothing.