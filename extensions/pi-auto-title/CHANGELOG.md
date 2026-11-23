# Changelog

## Unreleased

## 0.1.1 - 2026-11-18

### Changed

- Update package links to the renamed `pi-garage` repository.

### Fixed

- Tell the title model to summarise review prompts rather than follow their
  instructions.

## 0.1.0 - 2026-11-04

Initial release as `@nimanzik/pi-auto-title`.

### Added

- Name sessions from their first request without blocking the conversation.
- Preserve skill prefixes and existing or manually edited titles.
- Support a pinned title model with fallback to the session model.
- Cancel pending title generation when switching sessions or shutting down.
