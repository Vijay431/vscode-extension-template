# docs/

Static assets and supplementary documentation for the extension.

## docs/images/

Store screenshots, GIFs, and banner images referenced from:

- `README.md` — repository landing page and VS Code Marketplace listing
- `package.json` `marketplace.screenshots` — Marketplace gallery

Recommended naming: `docs/images/<feature-name>.<gif|png>`.

## Optional: GitHub Pages (legacy)

`docs/` can serve as a GitHub Pages source with no workflow required.

**Setup:** Repository **Settings → Pages → Build and deployment → Source: Deploy from a
branch → Branch: `main` / `docs/`.**

Place an `index.md` (or `index.html`) at `docs/index.md` and GitHub Pages will publish it
at `https://<username>.github.io/<repo>`. This is the "Deploy from branch" (legacy) Pages
method — no Actions workflow, no Jekyll, no Ruby dependency.

Leave the directory with only `docs/images/` if you don't need a docs site.
