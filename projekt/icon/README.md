# Vela · App-Icon A1 – Übergabe an Claude Code

**Auftrag:** Binde das App-Icon in den Prototyp „Vela · High Low High“ ein (Vite + React + TS, siehe `Vela_Claude-Code-Brief_Klickprototyp.md`). Damit hat der Prototyp ein Favicon, ein Homescreen-Icon auf iOS und Android und ist als PWA installierbar.

Stand: 10.11.2026 · Icon: **A1 · Vela Gota**. Das ist die handgemachte beige Kerze mit gepressten Farnen und der runden Gota-Flamme unter dem Sternenhimmel.

## 1. Dateien kopieren

Kopiere den Inhalt von `public/` 1:1 in den `public/`-Ordner des Vite-Projekts:

```
public/
├── favicon.ico                 16/32/48 px
├── apple-touch-icon.png        180 × 180 (iOS-Homescreen, ohne Transparenz)
├── manifest.webmanifest
└── icons/
    ├── icon.svg                Vektor-Favicon (moderne Browser)
    ├── favicon-16.png
    ├── favicon-32.png
    ├── icon-192.png            PWA / Android
    ├── icon-512.png            PWA / Android
    ├── icon-maskable-512.png   Android Adaptive (Motiv liegt im Schutzbereich)
    └── icon-1024.png           Master
```

`source/` ist nicht für den Build gedacht. Dort liegen die Quell-Varianten für spätere native Apps: iOS 18 Dark und Tinted, Android Foreground und Background sowie ein Mono-Glyph, jeweils als SVG und PNG in 1024 px.

## 2. `index.html` – in den `<head>` einfügen

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
<link rel="icon" href="/icons/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/icons/favicon-16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#2B2430">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Vela">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Vela · High Low High</title>
```

Bestehende Favicon-Links und das Vite-Standard-Icon (`/vite.svg`) entfernen. `theme-color` und `viewport-fit=cover` aus dem Haupt-Brief bleiben.

## 3. Icon im UI (optional)

Das Icon wird **nicht** in der App-Oberfläche gezeigt. Die Kerze im Prototyp bleibt das große Kerzen-SVG aus der Referenz. Wenn irgendwo ein kleines Marken-Zeichen gebraucht wird, etwa auf dem Sperrbildschirm neben „VELA · ahora“, nimm `/icons/icon-192.png` mit `border-radius: 22%`.

## 4. Gestaltung (zur Info, nicht ändern)

| Element | Wert |
|---|---|
| Hintergrund | Nachtverlauf `#060509` (unten) → `#241D2E` → `#231F3A` → `#0A0918` (oben), ca. 34 Sterne `#F5EFE4` |
| Kerze | Verlauf `#D2BE9E → #F2E6D1 → #E7D7BC → #BFA987`, Oberseite `#EFE2CB` / `#F7EDDB`, Schatten nach unten |
| Farne | `#2F4A2E`, `#2B452B`, hell `#5E7A57` |
| Flamme „Gota“ | runder Tropfen, Verlauf `#FFF8EA → #F7E6C4 → #F2B45A → #E0913A`, Kern `#FFFBF2` (weich), Halo `#F2B45A` |
| Theme / Manifest | `#2B2430` |

## 5. Abnahme

- Im Browser-Tab erscheint das Kerzen-Icon und nicht das Vite-Logo.
- iPhone Safari → „Zum Home-Bildschirm“ zeigt das Kerzen-Icon mit dem Namen „Vela“.
- Android Chrome → „App installieren“ ist verfügbar, das Icon wird rund bzw. als Squircle maskiert, ohne dass Flamme oder Kerze abgeschnitten werden.
- Lighthouse (PWA / Installable) meldet keine Fehler zu Icons oder Manifest.
