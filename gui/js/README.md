# gui/js/

Shared JavaScript utilities for all Sigil GUI pages.

## shared.js

Include at the bottom of `<body>` on every GUI page:

```html
<script src="/js/shared.js"></script>
```

### API

#### `showToast(message, type?, duration?)`
Shows a slide-in toast notification at the bottom-right.
- `type`: `'success'` | `'error'` | `'warning'` | `'info'` (default: `'info'`)
- `duration`: milliseconds before auto-dismiss (default: `3800`)
- Click toast to dismiss early.

```js
showToast('Brand kit generated!', 'success');
showToast('Server error — try again.', 'error');
showToast('Rate limit hit, wait 1 minute.', 'warning');
```

#### `showLoading(message?)`
Shows a full-page spinner overlay. Blocks interaction.
```js
showLoading('Rendering…'); // or showLoading() for default 'RENDERING…'
```

#### `hideLoading()`
Hides the loading overlay.
```js
hideLoading();
```

#### `sigilSetTheme(theme)`
Sets and persists the page theme.
```js
sigilSetTheme('dark');  // or 'light'
```

### Auto-init
`shared.js` automatically runs on `DOMContentLoaded`:
- Injects shared CSS (toast, overlay, hamburger)
- Restores saved theme from `localStorage`
- Inserts and wires the mobile hamburger button into `<nav>`

### Usage in GUI pages (replacing inline fetch handlers)

```js
async function previewBrandKit() {
  showLoading('Rendering brand kit…');
  try {
    const res = await fetch('/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!data.ok) { showToast(data.error, 'error'); return; }
    // render images…
    showToast('Brand kit generated!', 'success');
  } catch (err) {
    showToast('Network error — check your connection.', 'error');
  } finally {
    hideLoading();
  }
}
```
