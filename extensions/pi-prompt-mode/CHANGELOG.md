# Changelog

## Unreleased

### Added

- Mouse clicks and wheel scrolling work in the Mode picker, Configure modes, Edit
  mode, Thinking level, Store into mode, and use/store menus.
- Configure modes returns to the mode you last edited, including after a rename,
  after adding a mode, and when you open it again from Mode picker. Mode picker
  returns to Configure modes when you leave it. Both reset when `/mode` closes.

### Fixed

- Navigation in the Configure modes, Edit mode, Thinking level, Store into mode,
  and use/store menus now wraps between the first and last options, as in Mode
  picker.
- Menus keep their borders and keyboard hints visible in terminals under ten
  rows.

## 0.1.1 - 2026-11-06

### Fixed

- Mode picker navigation now wraps between the first and last modes with arrow
  keys, configured navigation keys, and `j`/`k`. The picker keeps its borders and
  keyboard hints, fits the terminal height, and preserves the selected mode when
  resized.

## 0.1.0 - 2026-11-04

### Added

- Named model and thinking presets, with mode selection and editing.
- A mode label in the prompt editor border.
- Prompt history across sessions in the same working directory.
