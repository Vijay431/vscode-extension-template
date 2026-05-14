# docs/

This directory contains assets and supplementary documentation for the extension.

## docs/images/

Store screenshots, GIFs, and banner images here. These are referenced from:

- `README.md` — marketplace listing and repository landing page
- `package.json` `marketplace.screenshots` — VS Code marketplace gallery

Example reference in `README.md`:

```markdown
![My Feature](docs/images/my-feature.gif)
```

Recommended naming: `docs/images/<feature-name>.<gif|png>`.

## site/

Full prose documentation lives in the `site/` directory as a Jekyll GitHub Pages site. Run it locally with:

```bash
pnpm run site:serve
```
