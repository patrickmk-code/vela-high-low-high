# Vela · High Low High – Brief für Claude Code

**Auftrag:** Baue einen klickbaren, mobil-optimierten Web-Prototyp der App „Vela · High Low High“ (Sprache der Oberfläche: **Spanisch**), deploye ihn und gib mir **einen öffentlichen Link**, den ich teilen und auf dem Smartphone testen kann.

Alle Inhalte, Abläufe und Gestaltungsregeln stehen in diesem Dokument. Die bereits funktionierenden Design-Prototypen liegen als **Referenz** im Ordner `reference/` bei (siehe Abschnitt 11) – dort findest du exakte Markups, SVG-Pfade, Texte und Zustandslogik.

---

## 1. Ziel & Rahmen

- Ein **Klickprototyp**, kein Produkt: keine Accounts, kein Backend, keine echte KI. Zustand nur im Speicher (optional `localStorage` für „wiederkehrend“).
- **Mobile first:** Zielgröße 390 × 844 (iPhone 14/15). Auf größeren Screens zentriert als Telefon-Rahmen mit dezentem Hintergrund.
- **Zwei Einstiege** (über URL wählbar):
  - `/` → **Erstnutzung**: Start bei „Hola, soy Vela.“
  - `/?modo=recurrente` → **Wiederkehrende Nutzung**: Start auf einem Sperrbildschirm mit Vela-Benachrichtigung, Tipp darauf → direkt zur Kerze („Mecha“). Keine Erinnerungsfrage am Ende.
- **Test-Leiste** (nur Prototyp): ein dezenter Neustart-Button oben und unter dem Telefon (Desktop) bzw. hinter einem kleinen „☰ Pantallas“-Button (Mobil) eine Liste zum direkten Springen zu jedem Screen (siehe Abschnitt 8).

## 2. Tech-Empfehlung

- **Vite + React + TypeScript** (oder Vanilla, wenn dir das schneller ist), reines Frontend, statischer Build.
- Animationen mit CSS-Transitions/Keyframes; keine schweren Libraries nötig.
- Fonts über Google Fonts: **Fraunces** (300/400, auch kursiv), **Nunito Sans** (400/600/700).
- **Deployment:** Vercel (bevorzugt) oder Netlify bzw. GitHub Pages. Frag mich, falls du einen Login/Token brauchst, und gib am Ende die **Live-URL** aus.
- Mobile-Meta: `viewport-fit=cover`, `apple-mobile-web-app-capable`, `theme-color #2B2430`, Safe-Area-Insets beachten, kein Text-Zoom, `touch-action: none` + kein Kontextmenü auf dem Docht (Long-Press).
- Optional (nur wenn trivial): `navigator.vibrate` für sanfte Haptik auf Android.

## 3. Marke & Ton

- **Vela** = die Kerze, die man sich abends anzündet. Sie ist die Figur, mit der man spricht: eine kluge, warme Freundin mit psychologischem Wissen. Spiegelt, deutet nicht. Nie Therapeutin.
- **Ritual:** High → Low → High (positiv enden, Peak-End-Regel).
- **Ton:** ruhig, warm, klar. Du-Form („tú“), kurze Sätze, eine Frage pro Screen, einladen statt auffordern, keine Ausrufezeichen, keine Emojis, keine Streaks/Scores.
- **Gefühl:** weich, organisch, subtil, „wie nach Hause kommen“. Langsame Übergänge (≈1,4 s), Bewegungen im Atemrhythmus.

## 4. Design-Tokens

| Token | Wert |
|---|---|
| Hintergrund (Abend) | `#2B2430` |
| Hintergrund dunkel (Schlaf/Bleiben) | `#211B26` |
| Text | `#F5EFE4` |
| Text gedämpft | `#CDBFAE` |
| Text sekundär hell | `#E6DACB` |
| Gold / Akzent / Flamme | `#F2B45A` (hell `#FBE0A0`) |
| Low-Akzent (nur Mikro-Ring, nie Flamme) | `#9FB4C8` |
| Flächen | `rgba(245,239,228,0.05–0.09)`, Rand `rgba(245,239,228,0.08–0.2)` |
| Radien | Pillen 20–30 px, Karten 20–26 px |
| Schriften | Fragen/Titel: Fraunces 300 (26–32 px); UI: Nunito Sans; Notizen/Spiegel: Fraunces kursiv 300 |
| Raum-Glow | radial-gradient um die Flamme: `rgba(242,180,90,0.34)` → transparent |

Barrierearmut: echte `<button>`, `aria-label` bei Icon-Buttons, Kontrast ≥ 4.5:1, `prefers-reduced-motion` respektieren (Animationen aus, Fingergeste weg).

## 5. Die Kerze (Variante A „Bienenwachs“)

- SVG 390 × 520, Docht-Ursprung bei `translate(195 284)`. Körper: handgezogener Wachszylinder mit Wachsschichten, Körnung, Tropfen, Gradienten `#D4A27C → #AE785B`. **Exaktes SVG** (inkl. Defs, Gradienten, Clip, Filter) in `reference/Vela-ES.dc.html` im Block nach `<sc-if value="{{ showCandle }}"` – bitte 1:1 übernehmen.
- **Flamme:** Pfad aus Funktion `fp(w, h, lean)` (siehe Referenz-Script), Standard `fp(22, 58, 0)`, Kern `fp(9, 24, 0)`. Schichten: Glow (blur), warmer Verlauf, heller Kern. **Farbe immer gleich warm-golden**, auch beim Low. Stimmung nur über **Größe** und **Bewegung** (sanftes Flackern 3,2 s).
- **Position/Größe** der ganzen Kerze (Wrapper `top`, `scale`, Transform-Origin `195px 0`, Übergang 1,4 s):

| Phase | top | scale | Hinweis |
|---|---|---|---|
| Einstieg, Mecha, Anzünden, „Luz encendida“ | 150 | 0.75 | Text **unter** der Kerze |
| Ritual-Screens (High/Low/Pregunta/High 2), Recordatorio | 280 | 0.6 | Frage oben, Kerze Mitte, Interaktion unten |
| Tu día | 360 | 0.55 | etwas tiefer, damit die Karte Platz hat |
| Opciones (Ende) | 318 | 1.0 | groß, leuchtend, nah am unteren Rand |
| Quedarme / Diario / Apagar / Dormir | 200 | 1.3 | sehr groß |

- **Flammen-Skalierung & Halo pro Phase** `[flameScale, –, haloScale, haloOpacity]`:
  `home/intro [0,0,.6,.25]` · `lit [1,0,1,1]` · `high1 [1.3,0,1.3,1]` · `low/ask [.68,0,.75,.55]` · `high2 [1.15,0,1.18,1]` · `mirror/remind [1,0,1,1]` · `now [1.2,0,1.5,1]` · `stay/blow [1.3,0,1.7,1]` · `journal [1.2,0,1.6,1]` · `sleep [0,0,.55,.15]`.

## 6. Ablauf & Screens (UI-Texte exakt so übernehmen)

### 6.0 Sperrbildschirm (nur `modo=recurrente`)
Dunkler Verlauf, „lunes, 9 de noviembre“, große Uhrzeit **21:30**. Benachrichtigungskarte: App-Icon (kleine Flamme), „VELA · ahora“, **„El día se va apagando.“** / „¿Quieres cerrarlo con tres momentos?“. Kurz eingeblendeter Hinweis „Toca la notificación“. Tipp → Mecha.

### 6.1 Einstieg (nur Erstnutzung)
Kerze aus. Darunter: **„Hola, soy Vela.“** / „Cada noche, tres momentos: algo bueno, algo difícil y otra vez algo bueno. No hace falta más.“ Button unten **„Enciende tu primera luz“**, darunter klein „Tus momentos son solo tuyos.“ → Mecha.

### 6.2 Mecha (Docht)
Kerze aus, Text darunter: **„Aquí estoy, cuando quieras.“** + Pill-Hinweis „Mantén pulsada la mecha“. Unten Navigation. **Fingergeste** (nur initial, 2 Durchläufe ab 1,4 s, dann weg): feiner Finger-Umriss gleitet zum Docht, drückt, weicher Glow.

### 6.3 Anzünden
Finger auf dem Docht halten → Ring um den Docht füllt sich über **einen Atemzug** (Standard 3 s im Test, einstellbar; Produktidee 8 s). Erste Hälfte **„Inhala conmigo.“**, zweite Hälfte **„Y exhala despacio.“**, Untertitel „Deja el dedo sobre la mecha.“ Docht glimmt, Flamme wächst mit dem Ausatmen. Früh losgelassen: Ring zieht sich sanft zurück, keine Fehlermeldung. Voll → **„Tu luz está encendida.“** (1,7 s) → automatisch High.

### 6.4 Erzähl-Screens (High → Low → Pregunta → High 2)
Layout fix: **Frage oben**, Kerze Mitte, **Interaktion unten**. Oben Fortschrittspunkte (3), Zurück-Pfeil, ggf. „Saltar …“ rechts.

| Schritt | Eyebrow | Frage | Untertitel | Skip |
|---|---|---|---|---|
| high1 | HIGH | ¿Qué fue hoy un buen momento? | Puede ser algo muy pequeño. | – |
| low | LOW | ¿Y qué fue difícil hoy? | Puedes dejarlo aquí, sin más. | Saltar hoy → high2 |
| ask | – | Suena agotador. | ¿Qué te habría sentado bien en ese momento? | Saltar → high2 |
| high2 | HIGH | Terminemos con algo bonito. | ¿Qué más fue bonito hoy? ¿O qué te hace ilusión? | – |

**Zustände unten (fokussiert):**
1. **Bereit:** nur Mikrofon-Kreis (92 px, feiner Goldring, leicht getönt), „Toca y cuéntamelo“, darunter „Prefiero escribir“ (bei *ask* zusätzlich „· No lo sé“). **Kein „Seguir“.**
2. **Aufnahme:** Stopp-Quadrat, sanft atmender Glow, „Te escucho … 0:12“. Die Zeile darunter bleibt unsichtbar reserviert → **Mikro springt nicht**.
3. **Tippen:** Textfeld (100 px), Button „Listo“, darunter „Prefiero hablar“.
4. **Nachdenken:** drei atmende Punkte + „Un momento …“ (~1,6 s).
5. **Spiegel:** Karte „LO QUE ESCUCHÉ“ mit Velas Zusammenfassung in Fraunces; darunter „Repetir“ + Pille **„Seguir“** (erst jetzt sichtbar).

**Spiegel-Texte** (Prototyp, keine echte KI):
- Bei Sprache: high1 „Un paseo al sol te regaló hoy un poco de calma.“ · low „La reunión te quitó energía; sentiste que todo te llegaba a la vez.“ · ask „Una pausa corta, solo para ti, te habría sentado bien.“ · high2 „Te hace ilusión el viernes y el tiempo con amigos.“
- Bei Text: high1 „Hoy te sentó bien esto: {t}.“ · low „Hoy te pesó esto: {t}.“ · ask „Te habría venido bien: {t}.“ · high2 „Te llevas algo bonito: {t}.“

**„No lo sé“ (nur ask):** „Está bien no saberlo. Quizás algo de esto:“ + Chips „Una pausa corta“, „Hablar con alguien“, „Tomar aire fuera“, „Decir que no a algo“ (Tipp = Antwort → Spiegel) + Link „Seguir sin respuesta“.

### 6.5 Tu día (Zusammenfassung)
Abstrakte, digitale Karte (kein Papier): Titel „Tu día“ + Datum, links feine vertikale Linie mit Punkten (High = goldener, leuchtender Punkt; Low = leerer Ring). Abschnitte **HIGH / LOW / HIGH** mit **mehreren Punkten** (Fraunces kursiv, Bindestrich-Aufzählung ab 2 Punkten) und je „+ Añadir“ (Inline-Eingabe + „OK“, Enter/Escape).
- Startet **kompakt** (max. 300 px, scrollbar); ab >3 Punkten unten „Ver todo ⌄“ → Karte fährt auf (max. 580 px, dichter Hintergrund), „Ver menos ⌃“.
- Demo ohne Eingaben: High: „Un paseo al sol“ + „La llamada con tu madre te hizo reír.“; Low: „Una reunión pesada“ + „Dormiste poco y se notó todo el día.“; High: „Ganas de que llegue el viernes“.
- Unten: „Respirar un momento“ (Vollbild-Atemübung, 8-s-Zyklus „Inhala/Exhala“, „Listo“) und **„Seguir“**.

### 6.6 Recordatorio (nur Erstnutzung, einmalig)
„Qué bien que hayas venido.“ / „¿Quieres que mañana por la noche te lo recuerde con suavidad?“ / Zeit-Chips 21:00 · **21:30** · 22:00 / „Solo una vez por la noche. Puedes cambiarlo cuando quieras.“ / „Sí, por favor“ · „Mejor no“.

### 6.7 Opciones (Ende) – offener Übergang
Zurück-Pfeil oben links (→ Tu día). Oben: **„Tu día ya puede descansar.“** / „Quédate todo el tiempo que quieras. O sigue hacia donde te lleve el momento.“ Kerze groß unten. In der Mitte, sehr subtil (Textzeilen, nur Haarlinien, kleines goldenes Icon davor):
- **Quedarme con la vela** → Kerze sehr groß, UI weg; Hinweis **oben** kurz eingeblendet „Toca en cualquier lugar para volver“.
- **Escribir en mi diario** → Kerze groß; oben „Coge tu libreta y tu bolígrafo.“ / „Escribe lo que aún quiera salir. Vela te acompaña.“; Hinweis **in der Mitte** kurz. (Geschrieben wird analog, nicht in der App.)
- **Escuchar música tranquila** → öffnet direkt Spotify: `https://open.spotify.com/search/piano%20tranquilo` (neuer Tab).
- **Irme a dormir** → Kerze groß, „Cuando quieras, apágala.“ / „Toca la llama.“ → Tipp auf die Flamme: Flamme erlischt, „Que descanses.“ → nach ~4 s Mecha im Zustand „erledigt“: „Que descanses.“, Karte „Tu día“, „Mañana por la noche te espera tu luz.“, Buttons **„Ver tu día“** und **„Volver al inicio“**.

### 6.8 Reiter „Resumen“
Segment-Umschalter **Calendario | Patrones**.
- **Calendario:** Monatsansicht „noviembre 2026“ (Mo-Start; 1. Nov. = Sonntag), Wochentage L M X J V S D. Tage mit Eintrag = goldener Punkt, heute (9.) golden umrandet, Zukunft gedimmt, besondere Tage mit kleinem ★ (7. vorbelegt). Tipp auf Tag → Karte darunter: „martes, 3 de noviembre“, High/Low/High des Tages, Button „☆ Marcar especial“ / „★ Día especial“. Ohne Eintrag: „Este día no encendiste la vela. Está bien así.“ Demo-Daten in der Referenz (`DAYDATA`).
- **Patrones** (Drill-down):
  1. Übersicht – 3 Kacheln mit Icon: **Tus fuentes de energía** („Naturaleza, amigos y 2 más“), **Lo que te quita energía** („Prisas, poco sueño y 1 más“), **Ideas para ti** („Pequeñas cosas que podrían ayudarte“).
  2. Liste – z. B. „Naturaleza · A menudo · sobre todo el fin de semana“ …
  3. Detail – Beschreibung; bei Energieräubern Karte „Cuándo“; dann „Tus momentos“ (abspielbar) bzw. „Lo que te ayudó“ (Zitate).
  - Ideas: 3 Karten mit „Lo intentaré“ (toggle) / „Ahora no“ (ausblenden). Daten: `SRC`, `DRAIN`, `MORE` in der Referenz.

### 6.9 Reiter „Highs“
„Tus highs“ → **LO QUE VIENE** (Datum-Kachel + Titel + „en X días“: 13 nov „Por fin viernes: tarde libre“, 14 nov „Concierto con Ana“, 28 nov „Escapada a la costa“) und **LO QUE FUE** („Hace un año: Una tarde en el lago con amigos“ + vergangene Highs inkl. der heutigen).

### 6.10 Navigation
Unten auf Mecha/erledigt, Resumen, Highs: **Hoy · Resumen · Highs** mit Icons (Mond+Sterne, Kalender mit Markierung, Stern mit Strahlen). Aktiv: Gold + Duotone-Füllung; inaktiv: Linie in `#CDBFAE`.

## 7. Icons
Gewünscht: **Solar Icon Set (480 Design)** – Linear für inaktiv, Bold Duotone für aktiv. Installiere `@iconify-json/solar` bzw. nutze `@iconify/react` (Prefix `solar:`):
`moon-stars`, `calendar-mark`, `star-shine` (Nav, jeweils `-linear` und `-bold-duotone`), `microphone-3-linear`, `pen-linear`, `play-bold`, `leaf-linear`, `battery-low-linear`, `lightbulb-minimalistic-linear`, `fire-linear`, `notebook-linear`, `music-notes-linear`, `moon-sleep-linear`, `alt-arrow-left-linear`, `alt-arrow-right-linear`, `tuning-2-linear`, `restart-linear`, `star-linear`, `star-bold`. Lizenz der Solar-Icons bitte im Repo prüfen und ggf. Namensnennung im Footer ergänzen. (Im Referenz-Prototyp sind es nur Platzhalter im Solar-Stil.)

## 8. Test-Hilfen (nur Prototyp)
- Neustart-Icon oben mittig (halbtransparent).
- Sprungliste: Notificación (recurrente) / Inicio, Mecha, High, Low, Pregunta, High 2, Tu día, Recordatorio, Opciones, Vela, Diario, Apagar, Resumen, Highs. Springen setzt Timer, Aufnahme, Halte-Zustand zurück.
- Atemdauer per Query-Param, z. B. `?respira=8`.

## 9. Bewusst NICHT im Prototyp
Echte Spracherkennung/KI (Spiegel = Beispielsätze bzw. Textvorlagen), echtes Pusten per Mikrofon (Tippen auf die Flamme), Push-Benachrichtigungen, Speicherung über Sitzungen hinweg (optional `localStorage`), Monatswechsel im Kalender.

## 10. Abnahmekriterien
- Läuft flüssig auf iPhone Safari und Android Chrome, ohne horizontales Scrollen, Safe Areas respektiert.
- Long-Press auf den Docht löst kein Kontextmenü/Textauswahl aus.
- Kerze springt nie; alle Positionswechsel gleiten.
- Flammenfarbe bleibt immer gleich.
- Beide Einstiege funktionieren (`/` und `/?modo=recurrente`).
- Öffentliche URL ist erreichbar; README mit lokalem Start (`npm i && npm run dev`) und Deploy-Befehl.

**Am Ende bitte ausgeben:** Live-URL, URL für den wiederkehrenden Modus, kurze Liste offener Punkte.

## 11. Beigelegte Referenzen (`reference/`)
- `Vela-ES.dc.html` – vollständiger Prototyp Erstnutzung (Spanisch). Format: „Design Component“ – HTML mit `{{ platzhaltern }}`, `<sc-if>`, `<sc-for>`; Logik in `class Component … renderVals()` im `<script type="text/x-dc">`. Nicht direkt lauffähig (braucht eine Runtime), aber **Quelle für exakte SVGs, Texte, Daten und Zustandslogik**.
- `Vela-ES-R.dc.html` – Variante wiederkehrende Nutzung (Sperrbildschirm-Einstieg).
- `Vela_High-Low-High_Konzept.md` – Gesamtkonzept (Psychologie, Marke, Tone of Voice/Feel, Flows, Entscheidungen).
