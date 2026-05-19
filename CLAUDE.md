# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML website for **Miro Freitas**, a B2B refrigeration commercial representative (FrioRio). No build system, no frameworks, no npm — pure HTML/CSS/JS deployed to Hostinger via file upload.

## Deployment

Upload all files directly to `public_html/` on Hostinger (hPanel → Files → File Manager). The `.htaccess` handles clean URL rewrites (strips `.html` extensions and redirects `/index.html` → `/`).

## Architecture

- **`css/styles.css`** — single global stylesheet with CSS custom properties (design tokens at top of file)
- **`js/app.js`** — single IIFE; runs on all pages, feature-detects DOM elements before acting
- **Pages:** `index.html`, `produtos.html`, `empresas.html`, `sobre.html`, `contato.html`, `privacidade.html`, `termos.html`
- **`img/`** — product and portrait images; `favicon.svg` and `img/og-image.png` for meta tags

## Key Conventions

**CSS tokens** (`css/styles.css` lines 4–39): color palette uses `--ink-*` (dark navy scale), `--paper-*` (white/light), `--cyan`/`--cyan-ink` (accent). Fonts: `--font-sans` (Inter), `--font-display` (Space Grotesk), `--font-mono` (JetBrains Mono).

**JS feature detection**: `app.js` checks `if (form)`, `if (pgrid)`, etc. before binding — safe to include the same script on every page.

**Active nav link**: `[data-nav]` attribute on `<a>` tags in the desktop nav; `app.js` adds `.active` based on `location.pathname`.

**Scroll reveal**: Elements get `.reveal` class added by JS; IntersectionObserver adds `.visible` to trigger CSS transitions. Grid containers (`.grid-4`, `.grid-3`, `.audience-grid`) get `.stagger` for sequential child animation.

**Contact form**: Submits to Formspree endpoint `https://formspree.io/f/xyklpvqw`. Validation uses `[data-field="name"]` wrapper elements that receive `.error` class on failure. CNPJ and phone fields have live input masks.

**Product filter** (`produtos.html`): Cards use `data-product`, `data-cat`, and `data-search` attributes. Filter chips use `[data-cat]`; search input id is `search`.

**Cookie consent**: Stored in `localStorage` key `mf_cookie_ok`.

**WhatsApp float button**: `.wa-float` — present on every page, links to `https://wa.me/5541996483352`.

## Page Structure Pattern

Every page shares the same header/topbar/mobile-menu/footer/cookie/wa-float HTML blocks (duplicated inline — no templating). When editing shared elements, update all `.html` files.
