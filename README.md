# mashtu-web

The public static "coming soon" site for **MashTU** (mashtu.net).

## What this is

A minimal placeholder page — plain `index.html`, `style.css`, and a tiny
`script.js`. There is **no framework and no build step**; the files in the
repository root are the site exactly as served. It is a holding page so the
pending `.com`/`.org` → `mashtu.net` redirects have somewhere to land while the
product is being readied.

## Hosting & deployment

The site is hosted on **Cloudflare Pages** via **Git integration**. Pushing to the
`main` branch auto-deploys the latest commit.

- **Build command:** _(none)_ — leave empty.
- **Build output directory:** repository root (static files served as-is).

Because there is no build step, Cloudflare Pages serves `index.html` and its assets
directly from the repo root on every push to `main`.

## Custom domains

The site serves on:

- `mashtu.net` (apex)
- `www.mashtu.net`

DNS and Cloudflare Pages wiring for these domains is **not** managed in this
repository — it is handled in the separate infrastructure repository
(`mashtu-infra`). This repo contains only the website content.

## Brand asset

`assets/logo-v1.jpg` is the shared MashTU brand logo, sourced from the
`vpnalyzer-v2` repository's `assets/brand/` source-of-truth. (MashTU is the
forthcoming name for the product currently codenamed `vpnalyzer`.)

## Local preview

Open `index.html` directly in a browser, or serve the folder with any static file
server, for example:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Structure

```
index.html         # the page markup
style.css          # all styling (mobile-first, responsive)
script.js          # tiny progressive enhancement (current footer year)
assets/logo-v1.jpg # MashTU brand logo
```
