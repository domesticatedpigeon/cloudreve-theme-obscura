<h1 align="center">Obscura</h1>

<p align="center">
<strong>A visual redesign for <a href="https://github.com/cloudreve/cloudreve">Cloudreve</a> featuring a recent files list and an enhanced image viewer.</strong><br>
It is a single HTML file that runs in Cloudreve's <strong>Custom footer HTML</strong> setting.<br>
</p>

<p align="center">
<img src="screenshots/desktop-light.webp" height="400" alt="My Files in light mode">
<img src="screenshots/mobile-light.webp" height="400" alt="Phone, light">
</p>
<p align="center">
  <img src="screenshots/viewer.webp" width="720" alt="My Files in light mode">
</p>


## Features

### Look and feel
- Frosted pill toolbars and menus, 24px file tiles, Inter for text and Boldonse for headings.
- Follows the system light/dark setting.
- Cursor-following spotlight on tiles, rows and menu items.
- Press feedback on tiles and cards, for mouse, pen and touch.
- Pages fade in once, without flashes or layout shifts; nothing shows until the theme has styled the page.
- Uses Cloudreve's own translations wherever it adds or replaces text.

### Desktop
- Docked top bar: the page heading (e.g. "MY FILES") sits beside the + New button, and the toolbar is grouped into pills.
- Fixed-width sidebar, with pinned folders you can drag to reorder; folder colours and emoji show in the sidebar.
- Single click opens files and folders. Drag-select works in grid and gallery views, and you can drag files onto folders in the gallery.
- Restyled list view with squircle checkboxes, type icons and a "more" button on every row.
- Right-click menus reliably target the file under the pointer, even right after scrolling.

### Recently viewed
- A row of the files you last opened, at the root of My Files and of share links, with thumbnails and the file type icons configured in Cloudreve.
- Click to open a file in its folder, right-click or ⋯ for its menu. Arrow buttons page through the row on desktop; swipe on phones.

### Image viewer
- Top pills with file name, position, resolution, file size and ICC colour profile.
- Background swatches (System, black, white, checkerboard) and Color/Grayscale proofing.
- Wraps from the last image to the first (and back) in every folder, with a toast and an entrance animation.
- Keyboard, wheel, trackpad pinch and swipe navigation, double-click for actual size, a hint legend and custom cursors.
- Right-click menu on the photo; click anywhere to hide or show the interface.
- Thumbnail strip on phones; on desktop, a peek of the previous or next image follows the cursor while it points that way.
- Video viewer with a dark frame that keeps the video in place while it loads.

### Phones
- Bottom navigation (My Files / Shared with me) and a floating + button.
- Pinned path bar, frosted sidebar, and taps that never scroll the page by accident.
- Edge-to-edge viewer with native pinch zoom and double-tap zoom.
- Tuned for iOS Safari, including Liquid Glass status and address bar tinting, and landscape safe areas.

### Smaller changes
- Tag chips keep their own colours in both themes.
- Avatar menu without the user group, aligned with its icons.
- Settings pages as clean label/value rows.
- Tree view > Auto expand is off by default (each user can turn it back on).
- The Finance settings tab is hidden.
- Recovers from failed lazy-loaded chunks instead of showing Cloudreve's error page.

## Installation

Requires Cloudreve v4 (tested with 4.19.1) and an admin account.

1. Open **Dashboard → Settings → Site information → Custom footer HTML**.
2. Paste the loader below and save.
3. Reload Cloudreve.

```html
<script>
(() => {
	const url = "https://raw.githubusercontent.com/domesticatedpigeon/cloudreve-theme-public/main/cloudreveCustomFooter.html";
	fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" })
		.then((r) => r.text())
		.then((html) => {
			const box = document.createElement("div");
			box.innerHTML = html;
			box.querySelectorAll("style").forEach((s) => document.head.appendChild(s));
			box.querySelectorAll("script").forEach((s) => {
				const n = document.createElement("script");
				n.textContent = s.textContent;
				document.body.appendChild(n);
			});
		});
})();
</script>
```

The loader fetches the latest theme from this repository on every page load, so updates arrive automatically.

### Pin a version or self-host
- **Pin a version:** replace `main` in the URL with a commit hash or tag to stop automatic updates.
- **Self-host:** download `cloudreveCustomFooter.html`, serve it from your own domain (the response must allow your Cloudreve origin via CORS, or come from the same origin), and point `url` at it.
- **No loader:** paste the whole contents of `cloudreveCustomFooter.html` into Custom footer HTML. This works too, but you will have to paste it again for every update.

### External requests
The theme loads its fonts from Google Fonts and jsDelivr. If you configured iconify file icons in Cloudreve, the Recently viewed row loads them from the same Iconify API hosts Cloudreve uses.

## Development
- `cloudreveCustomFooter.html` is the whole theme: a flat list of `<style>` and `<script>` blocks.
- [`architecture.md`](architecture.md) explains how each feature hooks into Cloudreve, and [`design-language.md`](design-language.md) lists the visual rules.
- [`CLAUDE.md`](CLAUDE.md) covers conventions and how to test changes.
