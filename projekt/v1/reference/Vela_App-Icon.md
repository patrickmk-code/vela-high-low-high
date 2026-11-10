# Vela · App-Icon

Stand: 10.11.2026

**Entschieden: A1 · Vela Gota.** Die handgemachte beige Kerze mit gepressten Farnen steht unter dem Sternenhimmel und trägt die runde Gota-Flamme.

- **Hintergrund:** Nachtverlauf wie in der App, von `#060509` (unten) über `#241D2E` / `#231F3A` bis `#0A0918` (oben); ca. 34 Sterne `#F5EFE4`
- **Kerze:** `#D2BE9E → #F2E6D1 → #E7D7BC → #BFA987`, Oberseite `#EFE2CB` / `#F7EDDB`, nach unten abgedunkelt
- **Farne:** `#2F4A2E`, `#2B452B`, hell `#5E7A57`
- **Flamme „Gota“:** runder Tropfen `#FFF8EA → #F7E6C4 → #F2B45A → #E0913A`, weicher Kern `#FFFBF2`, Halo `#F2B45A`
- Unter etwa 60 px verschwinden die Farne, die Silhouette aus Kerze und Flamme bleibt lesbar.

**Übergabe an Claude Code:** `vela-icon-claude-code.zip`
- `public/`: favicon.ico, apple-touch-icon.png (180), icons/ (svg, 16, 32, 192, 512, maskable-512, 1024), manifest.webmanifest
- `source/`: iOS Standard, iOS 18 Dark und Tinted, Android Foreground und Background, Mono-Glyph (SVG + PNG, 1024)
- `README.md`: Einbau in Vite (Dateien, `<head>`-Snippet, Abnahme)
