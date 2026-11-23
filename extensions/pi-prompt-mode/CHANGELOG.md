# Changelog

## Unreleased

The Configure modes, Edit mode, Thinking level, Store into mode, and use/store menus
now use the same picker as Mode picker. Navigation wraps between the first and last
options. Mouse clicks and wheel scrolling work in these menus. Compact framing
keeps the borders and keyboard hints visible in terminals under ten rows.

## 0.1.1

Mode picker navigation now wraps between the first and last modes with arrow keys,
configured navigation keys, and `j`/`k`. The picker keeps its borders and keyboard
hints, fits the terminal height, and preserves the selected mode when resized.

## 0.1.0

Initial release with named model and thinking presets, mode selection and editing,
a mode label in the prompt editor border, and prompt history across sessions in
the same working directory.
