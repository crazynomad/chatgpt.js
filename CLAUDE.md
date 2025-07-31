# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Key Commands

### Building and Distribution
- `npm run build:js` - Build minified version to dist/chatgpt.min.js using bash utils/build.sh
- `bash utils/build.sh` - Directly minify chatgpt.js to dist/chatgpt.min.js with proper license header

### Linting and Code Quality
- `npm run lint` - Run ESLint with cache (recommended for development)
- `npm run lint:all` - Run ESLint without cache
- `npm run lint:fix` - Auto-fix linting issues with cache
- `npm run lint:fix-all` - Auto-fix linting issues without cache

### Documentation and Preview
- `npm run dev:docs` or `npm run preview:docs` - Preview documentation locally using node utils/preview-docs.js

### Version Management and Publishing
- `npm run bump:patch` - Bump patch version using bash utils/bump.sh
- `npm run bump:minor` - Bump minor version
- `npm run bump:major` - Bump major version
- `npm run publish:patch` - Bump patch version and publish to npm
- `npm run publish:minor` - Bump minor version and publish to npm
- `npm run publish:major` - Bump major version and publish to npm

### Translation and Localization
- `npm run translate` - Run Python script to translate English messages to other locales (py utils/translate-en-messages.py)

## Architecture Overview

This is a client-side JavaScript library for interacting with ChatGPT's DOM. The codebase follows these patterns:

### Core Structure
- **Main Library**: `chatgpt.js` - Single monolithic file containing the entire API (~6000+ lines)
- **Distribution**: `dist/chatgpt.min.js` - Minified version for production use
- **Starter Templates**: `starters/` directory contains Chrome extension and Greasemonkey userscript templates
- **Documentation**: `docs/` contains comprehensive multi-language documentation and user guides

### Library Architecture
The main library (`chatgpt.js`) is organized as a single global `chatgpt` object with:

1. **Configuration Objects**:
   - `endpoints` - API endpoints for ChatGPT services
   - `selectors` - CSS selectors for DOM elements (buttons, divs, etc.)

2. **Functional Categories**:
   - General utilities (language detection, code execution, random generators)
   - Page theme management (dark/light mode)
   - In-site notifications (alerts, notifications)
   - User session management (auth, account details)
   - Chat management (sending messages, getting responses, managing conversations)
   - DOM interaction helpers

3. **Design Patterns**:
   - Methods often have multiple aliases for flexibility (e.g., `getLastResponse()`, `getLastReply()`, `response.getLast()`)
   - Extensive use of DOM selectors to interact with ChatGPT's interface
   - Async/await pattern for API calls and DOM waiting
   - Promise-based architecture for better handling of ChatGPT's dynamic interface

### File Organization
- **Single Source File**: All functionality is contained in `chatgpt.js` for easy distribution
- **No Build Dependencies**: The library is written in vanilla JavaScript without external dependencies
- **Multiple Distribution Formats**: Supports ES5, ES6, Greasemonkey, and Chrome extension formats
- **Internationalization**: Extensive translation support in `assets/data/_locales/` with 100+ languages

### Development Workflow
1. Edit the main `chatgpt.js` file
2. Run linting to ensure code quality
3. Use the build script to create minified distribution
4. Version bumping automatically updates all references across documentation and starters
5. The bump script handles Git commits, version updates, and npm publishing

### Key Technical Notes
- **DOM-Dependent**: Library heavily relies on ChatGPT's specific DOM structure and CSS selectors
- **Selector Management**: Complex selector definitions in the `selectors` object need maintenance as ChatGPT UI changes
- **Async Pattern**: Most methods return promises due to the dynamic nature of ChatGPT's interface
- **Cross-Platform**: Designed to work in browsers, userscripts, and extensions
- **Version Synchronization**: Automated tooling keeps versions synchronized across all files and documentation

## Testing
This project does not appear to have automated tests. Manual testing against ChatGPT's interface is the primary verification method.

## Important Notes
- The library targets ChatGPT's web interface specifically and may break with UI updates
- Selectors in the `selectors` object may need frequent updates as ChatGPT evolves
- The build process requires the `@adamlui/minify.js` package for minification
- Version bumping is automated and updates all references across the project