# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docusaurus-based static website project for "global-engineering-standards". The site uses Docusaurus v3.8.1 with TypeScript support and includes documentation, blog functionality, and custom React components.

## Development Commands

### Installation
```bash
yarn
```

### Development Server
```bash
yarn start
```
Starts the local development server with hot reload at http://localhost:3000

### Build
```bash
yarn build
```
Generates static content into the `build` directory

### Type Checking
```bash
yarn typecheck
```
Runs TypeScript type checking using `tsc`

### Other Available Commands
- `yarn serve` - Serves the built website locally
- `yarn clear` - Clears Docusaurus cache
- `yarn deploy` - Deploys to GitHub Pages
- `yarn swizzle` - Ejects Docusaurus theme components
- `yarn write-translations` - Generates translation files
- `yarn write-heading-ids` - Adds heading IDs to markdown files

## Architecture

### Key Directories
- `docs/` - Documentation markdown files (auto-generated sidebar)
- `blog/` - Blog posts in markdown/MDX format
- `src/` - Custom React components and pages
  - `src/components/` - Reusable React components
  - `src/pages/` - Custom pages (index.tsx is the homepage)
  - `src/css/` - Global CSS styles
- `static/` - Static assets (images, icons, etc.)

### Configuration Files
- `docusaurus.config.ts` - Main Docusaurus configuration
- `sidebars.ts` - Sidebar structure (currently auto-generated)
- `tsconfig.json` - TypeScript configuration extending @docusaurus/tsconfig

### Component Structure
- Homepage features are defined in `src/components/HomepageFeatures/index.tsx`
- Uses CSS modules for component-specific styling
- Imports SVG assets from `static/img/` directory

### Styling
- Uses Docusaurus theming with Prism syntax highlighting
- Custom CSS in `src/css/custom.css`
- CSS modules for component-specific styles
- Supports both light and dark themes

## Development Notes

- The project uses yarn as the package manager
- Node.js >=18.0 is required
- TypeScript is configured but not strictly enforced in development
- The site supports MDX for enhanced markdown with React components
- Sidebar is auto-generated from the docs folder structure
- Blog supports RSS/Atom feeds and reading time estimates