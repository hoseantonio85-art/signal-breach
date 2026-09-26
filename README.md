# SIGNAL//BREACH

Atmospheric synthwave/cyberpunk Minesweeper game with campaign missions, RU/EN localization, mobile-first interaction, local progress, and a future Android build via Capacitor.

## Current direction

This repository is the source of truth for the TypeScript migration of the working standalone prototype.

### Architecture

- React + TypeScript + Vite
- pure game engine under `src/game`
- screens under `src/screens`
- campaign data under `src/campaign`
- RU/EN dictionaries under `src/i18n`
- local settings/progress stores under `src/stores`
- Web Audio engine under `src/audio`
- Capacitor will be added after the web build is stable

### Product flow

`Boot -> Main Menu -> Campaign / Free Run -> Mission / Difficulty -> Briefing -> Game -> Result -> Map Review`

### Migration principle

The existing standalone HTML prototype is a visual and UX reference. The TypeScript migration should preserve the current atmosphere and interaction model rather than redesigning the game during refactoring.

## Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```
