# 🎯 GROWMEDICA — ULTIMATE CURSOR SETUP GUIDE

## 🚀 Najrýchlejší a Najpokojnejší Editor Setup

Kompletný návod na konfiguráciu Cursora pre **GrowMedica** projekt — bez bugov, maximálna rýchlosť, nulové lagi.

---

## 📋 PREDPOKLADY

- Cursor 0.42+ (najnovšia verzia)
- Node.js 22+
- Yarn 1.22+
- macOS/Linux (alebo WSL2 na Windows)

---

## KROK 1: CURSOR INSTALLATION & BASIC SETUP

### 1.1 Nainštaluj Cursor
```bash
# macOS (Homebrew)
brew install --cask cursor

# Alebo si stiahnuť z https://cursor.com
```

### 1.2 Otvori Workspace
```bash
cd /Users/erikbabcan/Downloads/c1growmedical-full-web
cursor .
```

### 1.3 Nastaviť Cursor Settings
**File → Preferences → Settings** (alebo `Cmd+,`)

#### Editor essentials
```json
{
  "editor.fontFamily": "Fira Code, Menlo, monospace",
  "editor.fontSize": 13,
  "editor.lineHeight": 1.6,
  "editor.letterSpacing": 0.5,
  "editor.fontLigatures": true,
  
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  
  "editor.semanticHighlighting.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  
  "files.exclude": {
    "**/.next": true,
    "**/.vercel": true,
    "**/node_modules": true,
    "**/.git": true
  },
  
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/.vercel": true
  },
  
  "extensions.recommendations": true
}
```

#### Performance optimizations
```json
{
  "editor.maxTokenizationLineLength": 2000,
  "editor.largeFileOptimizations": true,
  
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/.venv": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/.vercel": true,
    "**/dist": true
  },
  
  "[javascript]": {
    "editor.formatOnSave": false
  },
  "[typescript]": {
    "editor.formatOnSave": false
  },
  "[javascriptreact]": {
    "editor.formatOnSave": false
  },
  "[typescriptreact]": {
    "editor.formatOnSave": false
  }
}
```

#### VSCode Explorer
```json
{
  "explorer.compactFolders": true,
  "explorer.excludeGitIgnore": true,
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.expand": false,
  "explorer.fileNesting.patterns": {
    "*.json": "${basename}.lock, ${basename}.schema",
    "*.ts": "${basename}.test.ts, ${basename}.spec.ts",
    "*.tsx": "${basename}.test.tsx, ${basename}.spec.tsx",
    "package.json": "yarn.lock, .npmrc, .yarnrc",
    "tsconfig.json": "tsconfig.*.json"
  }
}
```

---

## KROK 2: ESSENTIAL EXTENSIONS

### 2.1 Officiálne MS Extensions
```bash
# Otvor Command Palette: Cmd+Shift+P
# Vyhľadaj: "Extensions: Show Recommended"
# Alebo nainštaluj:

code --install-extension ms-vscode.vscode-typescript-next
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
```

### 2.2 Code Quality & Linting
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension yamato-datsuden.vscode-typescript-validate
```

### 2.3 Framework & Language Support
```bash
code --install-extension unifiedjs.vscode-mdx
code --install-extension ms-vscode.vscode-node-debug2
code --install-extension ms-playwright.playwright
code --install-extension Shopify.theme-check-vscode
```

### 2.4 Productivity & Performance
```bash
code --install-extension yoavbain.render-crlf
code --install-extension ms-vscode.makefile-tools
code --install-extension eamodio.gitlens
code --install-extension GitHub.vscode-pull-request-github
code --install-extension streetsidesoftware.code-spell-checker-slovak
```

### 2.5 Error Handling & Diagnostics
```bash
code --install-extension usernamehw.errorlens
code --install-extension yoavbain.prettier-errors
code --install-extension unifiedjs.vscode-unified
```

### 2.6 Optional Performance Boosters
```bash
code --install-extension wix.vscode-import-cost
code --install-extension ms-python.python
code --install-extension charliermarsh.ruff
```

---

## KROK 3: WORKSPACE SETTINGS (`.vscode/settings.json`)

Vytvor súbor `.vscode/settings.json` v repo root:

```json
{
  // ═══════════════════════════════════════════════════════════════
  // EDITOR CORE — Font, spacing, rendering
  // ═══════════════════════════════════════════════════════════════
  
  "editor.fontFamily": "Fira Code, 'Courier New', monospace",
  "editor.fontSize": 13,
  "editor.lineHeight": 1.6,
  "editor.letterSpacing": 0.5,
  "editor.fontLigatures": true,
  "editor.fontWeight": "500",
  "editor.renderWhitespace": "trailing",
  "editor.renderControlCharacters": true,
  
  // ═══════════════════════════════════════════════════════════════
  // FORMATTING — Spaces, tabs, EOL
  // ═══════════════════════════════════════════════════════════════
  
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.trimAutoWhitespace": true,
  "editor.trimFinalNewlines": true,
  "files.insertFinalNewline": true,
  "files.endOfLine": "lf",
  
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.formatOnType": false,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  
  // ═══════════════════════════════════════════════════════════════
  // CODE ACTIONS & LINTING
  // ═══════════════════════════════════════════════════════════════
  
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.fixAll": "explicit"
  },
  
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.debug": false,
  "eslint.format.enable": true,
  
  // ═══════════════════════════════════════════════════════════════
  // TYPESCRIPT — Strict, IntelliSense, Performance
  // ═══════════════════════════════════════════════════════════════
  
  "typescript.check.npmIsInstalled": false,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.implicitProjectConfig.checkJs": false,
  "typescript.preferences.importModuleSpecifierPreference": "shortest",
  "typescript.updateImportsOnFileMove.enabled": "prompt",
  
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": false
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": false
  },
  
  // ═══════════════════════════════════════════════════════════════
  // TAILWIND CSS v4
  // ═══════════════════════════════════════════════════════════════
  
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)((?:\\\\.|(?!\\3).)*?)\\3"]
  ],
  "tailwindCSS.emmetCompletions": true,
  "tailwindCSS.lint.cssConflict": "warning",
  "tailwindCSS.lint.invalidApply": "error",
  "editor.quickSuggestions": {
    "strings": true
  },
  
  // ═══════════════════════════════════════════════════════════════
  // PRETTIER — Formatting rules
  // ═══════════════════════════════════════════════════════════════
  
  "prettier.semi": false,
  "prettier.singleQuote": true,
  "prettier.trailingComma": "es5",
  "prettier.bracketSpacing": true,
  "prettier.arrowParens": "always",
  "prettier.printWidth": 100,
  "prettier.tabWidth": 2,
  "prettier.useTabs": false,
  "prettier.endOfLine": "lf",
  
  // ═══════════════════════════════════════════════════════════════
  // SEMANTIC HIGHLIGHTING & BRACKETS
  // ═══════════════════════════════════════════════════════════════
  
  "editor.semanticHighlighting.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.bracketPairColorization.independentColorPoolPerBracketType": false,
  "editor.guides.bracketPairs": "active",
  "editor.guides.indentation": true,
  "editor.guides.highlightActiveBracketPair": true,
  
  // ═══════════════════════════════════════════════════════════════
  // EXPLORER & FILE HANDLING
  // ═══════════════════════════════════════════════════════════════
  
  "explorer.compactFolders": true,
  "explorer.excludeGitIgnore": true,
  "explorer.autoReveal": true,
  
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.expand": false,
  "explorer.fileNesting.patterns": {
    "*.json": "${basename}.lock, ${basename}.schema, ${basename}.*",
    "package.json": "yarn.lock, .npmrc, .yarnrc, .yarn/**",
    "tsconfig.json": "tsconfig.*.json, next.config.*",
    "*.ts": "${basename}.test.ts, ${basename}.spec.ts, ${basename}.d.ts",
    "*.tsx": "${basename}.test.tsx, ${basename}.spec.tsx, ${basename}.stories.tsx",
    "*.css": "${basename}.module.css"
  },
  
  "files.exclude": {
    "**/.next": true,
    "**/.vercel": true,
    "**/.turbo": true,
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/*.log": true
  },
  
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/.vercel/**": true,
    "**/dist/**": true,
    "**/.turbo/**": true
  },
  
  // ═══════════════════════════════════════════════════════════════
  // SEARCH OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════
  
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/.vercel": true,
    "**/.git": true,
    "**/dist": true,
    "**/.turbo": true,
    "**/*.log": true
  },
  
  // ═══════════════════════════════════════════════════════════════
  // PERFORMANCE — Tokenization, large files
  // ═══════════════════════════════════════════════════════════════
  
  "editor.maxTokenizationLineLength": 2000,
  "editor.largeFileOptimizations": true,
  "editor.occurrencesHighlight": "singleFile",
  "editor.selectionHighlight": true,
  
  // ═══════════════════════════════════════════════════════════════
  // EXTENSIONS
  // ═══════════════════════════════════════════════════════════════
  
  "extensions.autoUpdate": true,
  "extensions.recommendations": true,
  
  // ErrorLens — Inline errors
  "errorLens.enabled": true,
  "errorLens.excludeBySource": ["eslint"],
  "errorLens.followCursorMore": true,
  
  // Import Cost
  "importCost.largePackageHighlightColor": "#DA3633",
  "importCost.mediumPackageHighlightColor": "#F2CC0C",
  "importCost.smallPackageHighlightColor": "#52C41A",
  
  // GitLens
  "gitlens.currentLine.enabled": true,
  "gitlens.hovers.enabled": true,
  "gitlens.statusBar.enabled": true,
  
  // ═══════════════════════════════════════════════════════════════
  // DEBUGGING & TESTING
  // ═══════════════════════════════════════════════════════════════
  
  "debug.console.fontSize": 13,
  "debug.openDebug": "neverOpen",
  
  // ═══════════════════════════════════════════════════════════════
  // CURSOR AI SETTINGS
  // ═══════════════════════════════════════════════════════════════
  
  "cursor.frameworkContext": "nextjs",
  "cursor.cpp.maxTokens": 32000,
  "cursor.preferredLanguageModel": "claude-3.5-sonnet",
  
  // ═══════════════════════════════════════════════════════════════
  // TERMINAL
  // ═══════════════════════════════════════════════════════════════
  
  "terminal.integrated.fontSize": 12,
  "terminal.integrated.lineHeight": 1.4,
  "terminal.integrated.shellArgs.osx": ["--login"],
  "terminal.integrated.defaultProfile.osx": "zsh",
  
  // ═══════════════════════════════════════════════════════════════
  // MISC
  // ═══════════════════════════════════════════════════════════════
  
  "telemetry.telemetryLevel": "off",
  "security.workspace.trust.enabled": false,
  "window.restoreFullscreen": true,
  "workbench.startupEditor": "none",
  "workbench.editor.enablePreview": false
}
```

---

## KROK 4: EXTENSIONS RECOMMENDATIONS (`.vscode/extensions.json`)

Vytvor `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright",
    "eamodio.gitlens",
    "GitHub.copilot",
    "GitHub.copilot-chat",
    "GitHub.vscode-pull-request-github",
    "usernamehw.errorlens",
    "wix.vscode-import-cost",
    "ms-vscode.makefile-tools",
    "streetsidesoftware.code-spell-checker-slovak"
  ]
}
```

---

## KROK 5: KEYBINDINGS PRE RÝCHLOSŤ

**Cursor → Preferences → Keyboard Shortcuts** (alebo `Cmd+K Cmd+S`)

Pridaj:

```json
[
  {
    "key": "cmd+shift+l",
    "command": "editor.action.selectHighlights",
    "when": "editorFocus"
  },
  {
    "key": "cmd+k cmd+0",
    "command": "editor.foldAll"
  },
  {
    "key": "cmd+k cmd+j",
    "command": "editor.unfoldAll"
  },
  {
    "key": "cmd+shift+a",
    "command": "editor.action.quickFix"
  },
  {
    "key": "alt+z",
    "command": "editor.action.toggleWordWrap"
  },
  {
    "key": "cmd+shift+m",
    "command": "workbench.actions.view.problems"
  }
]
```

---

## KROK 6: LAUNCH CONFIGURATION (`.vscode/launch.json`)

Pre debugging Next.js:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js Server",
      "type": "node",
      "request": "attach",
      "skipFiles": ["<node_internals>/**"],
      "port": 9229,
      "protocol": "inspector"
    },
    {
      "name": "Playwright",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/storefront/node_modules/@playwright/test/cli.js",
      "args": ["test", "${relativeFile}"],
      "console": "integratedTerminal",
      "preLaunchTask": "yarn:build"
    }
  ]
}
```

---

## KROK 7: TASKS (`.vscode/tasks.json`)

Pre rýchle spúšťanie príkazov:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "yarn: dev",
      "type": "shell",
      "command": "yarn",
      "args": ["dev"],
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^.*$",
          "file": 1,
          "location": 2,
          "message": 3
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^.*ready.*",
          "endsPattern": "^.*compiled.*"
        }
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "yarn: build",
      "type": "shell",
      "command": "yarn",
      "args": ["build"],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "yarn: lint",
      "type": "shell",
      "command": "yarn",
      "args": ["lint", "--fix"]
    },
    {
      "label": "yarn: test:integrity",
      "type": "shell",
      "command": "yarn",
      "args": ["test:integrity"]
    }
  ]
}
```

---

## KROK 8: FINAL CHECKLIST

```bash
# 1. Otvoriť workspace
cd /Users/erikbabcan/Downloads/c1growmedical-full-web
cursor .

# 2. Nainštaluj dependencies
cd storefront && yarn install

# 3. Spusti dev server
yarn dev

# 4. Otvor DevTools v Cursore (Cmd+Shift+D) → Playwright

# 5. Spusti test
yarn test:integrity

# 6. Check Performance:
#    - Cmd+Shift+P → "Developer: Startup Performance"
#    - By měly by trvať <2s
```

---

## 🎯 FINAL SPEED OPTIMIZATIONS

### Disable na Курser:
1. **Settings → Extensions**
   - Disable: Unused extensions (Docker, Python, Ruby, atd)
   - Keep only: ESLint, Prettier, Tailwind, Playwright, Copilot

2. **Settings → Search**
   - Reduce search.maxResults to 500
   - Enable search.quickOpen.limit

3. **Settings → Git**
   - Set git.autofetch = false (pull manuálně)
   - Set git.ignoreMissingGitWarning = true

### System-level:
```bash
# Zkontroluj Node verzi (22+)
node --version

# Zkontroluj Yarn verzi (1.22+)
yarn --version

# Clear Cursor cache
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/*

# Restartuj Cursor
```

---

## ✅ VÝSLEDOK

Po nastavení by si mal mať:

✅ **Rýchly** — Startup < 2s, coding < 100ms lag
✅ **Stabilný** — Zero crashes, smooth scrolling
✅ **Produktívny** — Keyboard shortcuts, quick actions
✅ **AI-Ready** — Cursor AI optimalizované pre Next.js
✅ **Team-Ready** — Workspace settings shared s všetkými

---

**Commit a push:**

```bash
git add .vscode/
git commit -m "chore: add ultimate Cursor setup — extensions, settings, tasks"
git push origin main
```

Hotovo! 🚀
