# Social Justice Innovations (SJI) — landing page

A single-page, bilingual (English / Armenian) site for SJI, an Armenian women-led non-profit.
It's plain HTML, CSS and vanilla JavaScript: no framework, no build step, no npm. Upload the files and it works.

## Structure

```
index.html              The page: all sections, meta/SEO tags, JSON-LD
assets/css/style.css    All styles; design tokens (colors, type, spacing) at the top
assets/js/i18n.js       EN + HY text dictionaries (every visible string)
assets/js/main.js       Language switch, mobile nav, scroll reveal, form handling
assets/img/             sji-logo.png (official logo, master file), logo.png,
                        hero-illustration.svg, photo-placeholder.svg,
                        og-image.svg/.png (social preview), apple-touch-icon.png,
                        icon-192.png, icon-512.png
contact.php             OPTIONAL form handler (PHP mail()), config at the top
favicon.ico, favicon-32.png  Browser icons
site.webmanifest        App name + icons for "Add to home screen"
tools/make-icons.py     Regenerates logo.png and all icons from sji-logo.png (don't upload)
robots.txt, sitemap.xml
content/brief.md        Source copy. Reference only; don't upload it
```

## Deploying (Plesk)

1. Upload everything except `content/`, `tools/` and `README.md` to `/httpdocs`.
2. If you keep the contact form, edit the CONFIG block at the top of `contact.php` (see TODOs below) and make sure PHP mail is enabled for the domain.
3. Replace `https://www.example.org/` with the real domain (see TODOs).

To preview locally: `php -S localhost:8000` in this folder, then open http://localhost:8000. You can also run `python3 -m http.server`, but the form won't send without PHP.

## Editing content

**Text.** Every visible string has a key, e.g. `<h2 data-i18n="about.title">Who we are</h2>`.
- Change the text in `assets/js/i18n.js`, in **both** the `en` and `hy` blocks.
- The English text inside `index.html` is the fallback for search engines and visitors without JavaScript. If you change an English string in `i18n.js`, update it in `index.html` too.
- Attributes are translated the same way: `data-i18n-attr="aria-label:nav.label"` or `alt:about.photoAlt`.
- To add a new string, add a key to both dictionaries and put `data-i18n="your.key"` on the element. Put it on the innermost element that holds only text; the script replaces the element's text, so any child elements inside it are removed.

**Armenian.** The `hy` dictionary is a careful translation that a native speaker has **not** reviewed yet. It is flagged in a comment in `i18n.js`. Get it proofread before launch, especially the official Armenian organization name and the terms used for "mainstreaming" and "advocacy".

**Language behavior.** The page first uses the visitor's saved choice (`localStorage`, key `sji-lang`). If there is none, it uses Armenian for browsers set to Armenian and English for everything else. The switch also updates `<html lang>`, the page title and the meta description. There's only one URL, so search engines index the English version.

**Colors and type.** Edit the CSS variables at the top of `style.css`. The palette comes from the logo: purple (`--purple-600` #662D91, with darker shades for the hero, dark sections and footer), yellow (`--lime-400` #DEE43C, the logo's yellow as it appears on white, used for primary buttons and accents on dark backgrounds), khaki (`--khaki-*`), a gold accent (`--gold-400` #D1C266) and an off-white page (`--paper`). Never use the yellow or the gold as text on light backgrounds, because their contrast is too low there (gold is about 1.7:1). The gold is the **hero background**; everything on it uses `--purple-900` (8.2:1), and the hero's main button is aubergine because the logo yellow disappears on gold (1.3:1). Elsewhere on light sections the gold is only decorative (the line before section labels, the photo frame). On the dark purples it also colors the step numbers and the footer link hover. The pairs used for text pass WCAG AA:
purple-600 on paper ≈ 8.6:1, ink-600 on paper ≈ 8.3:1, khaki-700 on paper ≈ 7.4:1, white on purple-800 ≈ 12:1, lime-400 on purple-900 ≈ 10.8:1, purple-900 on gold-400 (hero text) ≈ 8.2:1, gold-400 on purple-800 ≈ 6.8:1, purple-950 on lime-400 (button text) ≈ 12.9:1. If you change a color, check it again. The hero illustration and `og-image.svg` use the same colors, so update them too.

**Fonts.** The fonts load from Google Fonts with `display=swap`: Fraunces for Latin headings, Noto Sans for body text, and Noto Sans Armenian / Noto Serif Armenian for Armenian. To self-host them instead, download the WOFF2 files (for example with google-webfonts-helper) into `assets/fonts/`. Then add `@font-face` rules with `font-display: swap` to the top of `style.css` and remove the three Google `<link>` tags from `index.html`. The font-family names in the CSS don't need to change.

**Logo and icons.** The master file is `assets/img/sji-logo.png`. It has a transparent background, semi-transparent color blocks and black letters, so it is designed for white or light backgrounds. On dark areas, such as the footer, it sits on a white tile. If the logo changes, replace `sji-logo.png` and run `python3 tools/make-icons.py`, which needs Pillow. The script rebuilds `logo.png`, `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png` and the manifest icons. Small favicons (16–48 px) use only the "sJi" part of the logo, because the full wordmark can't be read at that size. A vector (SVG) version of the logo would allow a sharper favicon and header logo, so ask the designer if one exists.

**Images.** Replace the files in `assets/img/` and keep the same file names, or change the paths in `index.html`. If you edit `og-image.svg`, export it to PNG again: `rsvg-convert -w 1200 -h 630 assets/img/og-image.svg -o assets/img/og-image.png`. Social networks don't accept SVG for preview images.

**Contact form.** The form is optional. To remove it, delete the `<form id="contact-form">…</form>` block in `index.html` and delete `contact.php`. The mailto link still works. The handler:
- Accepts POST only and works with or without JavaScript. Without JS, it redirects back with `?contact=sent` or `?contact=error`.
- Silently drops any submission that fills the hidden `website` field (a honeypot that catches bots).
- Validates name, email and message (10–5000 characters), removes line breaks from anything that goes into a mail header, and sends plain-text UTF-8 email with `Reply-To` set to the visitor's address.

## TODO: placeholders to replace before launch

Nothing below was invented. Each item is a placeholder waiting for real information. Search the code for `TODO(` to find them.

| What | Where |
|---|---|
| **Photos**: the About section shows a labeled placeholder | `assets/img/photo-placeholder.svg`; also set `about.photoAlt` in `i18n.js` (EN + HY) to describe the real photo. Use only photos you have consent for |
| **Form sender address**: `no-reply@example.org` | `contact.php` (`from`): use an address on the site's own domain, not Gmail |
| **Social links**: none yet | Commented-out block in the footer of `index.html`; also add the URLs to the JSON-LD as `"sameAs": [...]` |
| **Domain**: `https://www.example.org/` | `index.html` (canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD `url`/`logo`), `robots.txt`, `sitemap.xml` |
| **Official Armenian name** of the organization | `brand.name` and the name in `hero.lede` / `about.p1` / `meta.title` in the `hy` block of `i18n.js` |
| **Armenian translation review** by a native speaker | `assets/js/i18n.js` (`hy` block) |
| Optional: postal address, registration number, phone | Not in the brief and not on the page. Add them to the footer and JSON-LD `address` if you want them shown |

## Accessibility notes

The page includes:
- a skip link and semantic landmarks (`header`, `nav`, `main`, `footer`), with sections labeled by their headings;
- visible `:focus-visible` outlines, styled separately for light and dark sections;
- support for `prefers-reduced-motion`, which turns off the scroll-reveal and smooth scrolling;
- a mobile menu with `aria-expanded` that closes on Escape or an outside click;
- language buttons that use `aria-pressed`;
- form errors linked to their fields with `aria-describedby` and `aria-invalid`, and a polite live region for the send status;
- a usable page without JavaScript: all content shows in English, the nav displays inline, and the form posts normally.
