---
layout: page
title: Documentation
nav_order: 3
---

# Documentation

## Commands

<div class="commands-api">

<div class="command-item">
<h3>Hello World</h3>
<p>A starter command that shows an information message. Use this as your pattern for adding new commands.</p>
<ul>
  <li><strong>Command ID:</strong> <code>{{EXTENSION_ID}}.helloWorld</code></li>
  <li><strong>Palette:</strong> Yes (when extension is enabled)</li>
</ul>
</div>

</div>

## Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `{{EXTENSION_ID}}.enabled` | boolean | `true` | Enable/disable the extension |
| `{{EXTENSION_ID}}.accessibility.verbosity` | string | `"normal"` | Screen reader announcement verbosity |
| `{{EXTENSION_ID}}.accessibility.screenReaderMode` | boolean | `false` | Enhanced screen reader support |
| `{{EXTENSION_ID}}.accessibility.keyboardNavigation` | boolean | `true` | Keyboard hints in Quick Pick |
