# Design language

## Colour
- Black/white contrast.
- Accent pink #E989B4, used sparingly: selection, checkmarks, link hover fill, selection rectangle.

## Typography
- Inter for UI text.
- Boldonse (uppercase) for headings only. Empty states, labels and messages are never headings.

## Surfaces
- Pills everywhere: frosted background var(--cr-tbp-bg), faint 1px border var(--cr-tbp-br), backdrop blur. The pill fill sits one step off the page in both themes (dark: rgba(22,22,22,.62); light: rgba(240,240,240,.72), about #f4f4f4 on white), so pills read as slightly different from folder/file tiles.
- Frosted panels (menus, mobile sidebar) use the same treatment; borders instead of drop shadows where Liquid Glass would clip a shadow.
- Elements that share styling share one class. Reuse existing classes instead of layering new ones.

## Corner scale
- 999px for pills and buttons
- 28px for cards, dialogs and side panes
- 24px for file/folder tiles
- 20px for menus and the selection rectangle
- 12px for list rows
- Squircles, not circles, for checkmarks and the viewer swatch dot (including the System swatch).

## Spacing
- A 20px rhythm: gaps between tiles, side margins, gaps between panes, bottom gaps.
- Mobile header: 20px side padding; pills 44px with 3px side margins.
- Viewer on mobile: pills use the mobile gap (the gap between the filename pill and the resolution/size pill), equal on both sides. Hiding one pill (e.g. silhouette) must not shift its neighbours.

## Interaction
- Spotlight hover (radial gradient following the cursor) on pills and rows.
- Hover highlights run edge to edge in menus and search results.
- Icons "pop" on hover (grow slightly) and dip on click. Hover effects only under @media (hover: hover), never on touch.
- Segmented controls use a sliding, draggable thumb.
	- Reference: the Color/Grayscale control.
- Viewer glyphs (silhouette, background colour) share one colour/style.

## Motion
- Smooth, swift, springy easing: cubic-bezier(0.32,0.72,0,1).
- Nothing jarring: no layout shifts, no flashes of unstyled content, no "reloading" controls.
- Elements that belong together hide/show together (e.g. viewer edge shadows and pills, no stagger).
- Pills fade without losing their frost (animate --cr-fo, not opacity).
- Viewer: quick 180ms close fade of image, background and pills. Double-tap zoom swaps instantly to the native image with a short, slightly pronounced elastic bounce that peaks early. Zooming out reveals the UI if it was hidden.

## Light/dark
- The app follows the OS.
- Inside the image viewer, follow the viewer's background palette (cr-vlight), including menus and dialogs. The System background (follows OS) is the default.
- Light palette: top/bottom edge gradients are black and subtle.

## Avatar
- Don't change the header avatar's look: 44px transparent pill, 32px avatar, aligned with the file grid.
