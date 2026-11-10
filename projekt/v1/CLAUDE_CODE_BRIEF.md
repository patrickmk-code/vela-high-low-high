# Vela · High Low High · Prototipo v1 – Brief für Claude Code

**Auftrag:** Baue aus diesem Brief einen klickbaren, mobil-optimierten Web-Prototyp der App **„Vela · High Low High“** (Oberflächensprache **Spanisch**), deploye ihn und gib mir **einen öffentlichen Link**, den ich teilen und auf dem Smartphone testen kann.

Alles Nötige steht hier. Die funktionierenden Design-Prototypen liegen als **Referenz** in `reference/` (Abschnitt 14). Dort findest du exakte Markups, SVG-Pfade, Farben, Texte, Demo-Daten und Zustandslogik. **Bei Widersprüchen gilt die Referenz `reference/Vela-ES.dc.html`.**

Stand: 10.11.2026 · Version: Prototipo v1

---

## 1. Ziel & Rahmen

- **Klickprototyp, kein Produkt:** keine Accounts, kein Backend, keine echte KI und keine echte Spracherkennung. Zustand im Speicher, optional `localStorage`.
- **Mobile first:** Zielgröße 390 × 844 (iPhone 14/15). Auf Desktop zentriert als Telefonrahmen (Radius 44 px) auf hellem Grund `#EDEAE6`. Darunter liegen die Test-Hilfen (Abschnitt 11).
- **Zwei Einstiege per URL:**
  - `/` → **Erstnutzung**, Start bei „Hola, soy Vela.“, Nächte = 0
  - `/?modo=recurrente` → **Wiederkehrend**, Start auf dem Sperrbildschirm mit Vela-Benachrichtigung, Tipp führt zur Kerze. Keine Erinnerungsfrage. Nächte = 3.
- Zusätzliche Query-Params: `?noches=0|1|3|5|7|14|18|22|26|28|30` (Startwert Nächte), `?respira=3..12` (Atemdauer in s, Standard 8).

## 2. Tech

- **Vite + React + TypeScript**, rein statisch. Ein Zustands-Store (z. B. `useReducer` oder Zustand), keine schweren Libraries.
- Animationen mit CSS-Transitions und -Keyframes. **Alle Bewegungen weich**, siehe Abschnitt 4.3.
- Fonts (Google Fonts): **Fraunces** (300/400, auch kursiv) und **Nunito Sans** (400/600/700/800).
- **Deploy:** Vercel bevorzugt, sonst Netlify oder GitHub Pages. Frag nach Login oder Token, falls nötig. Am Ende die **Live-URL** ausgeben.
- **Mobile-Meta:**
  - `viewport-fit=cover`, `apple-mobile-web-app-capable`, `theme-color #2B2430`
  - Safe Areas beachten, kein Text-Zoom
  - Auf der Halte-Fläche: `touch-action: none`, kein Kontextmenü, keine Textauswahl
- **Barrierearmut:**
  - echte `<button>`-Elemente, `aria-label` bei Icon-Buttons
  - Kontrast ≥ 4.5:1
  - `prefers-reduced-motion`: Funkeln, Atmen, Orbs, Stern-Animation und Fingergeste aus

## 3. Marke & Ton

- **Vela** ist die Kerze, die man sich abends anzündet: eine kluge, warme Freundin mit psychologischem Wissen. Sie spiegelt, deutet nicht und ist **nie Therapeutin**.
- **Ritual:** High → Low → High, also positiv enden (Peak-End-Regel).
- **Ton:**
  - ruhig, warm, klar
  - „tú“, kurze Sätze, eine Frage pro Screen
  - einladen statt auffordern
  - keine Ausrufezeichen, keine Emojis, keine Streaks oder Scores
  - „a menudo“ statt Prozentzahlen
- **Gefühl:** weich, organisch, „wie nach Hause kommen“. Nacht, Kerzenlicht, Sternenhimmel.

## 4. Design-System

### 4.1 Farben & Flächen
| Token | Wert |
|---|---|
| Grund (Abend) | `#2B2430` |
| Grund dunkel (Bleiben/Schlaf) | `#211B26` |
| Text | `#F5EFE4` · gedämpft `#CDBFAE` · sekundär `#E6DACB` · leise `#9C8F86` · sehr leise `#7F736C` |
| **Primär-Button / Akzent UI** | **Beige `#E6CDA3`**, Text darauf `#2B2430` (kein Gelb mehr in der UI) |
| Warm-Glow / „erreicht“ | `#F6E3C0`, Verlauf `#F7E6C4 → #E6CDA3 → #C9A97A` |
| High (Inhalte) | Gold `#F2B45A` (hell `#F6D49A`) |
| Low (Inhalte) | Blau `#9FB4C8` (hell `#C9D6E2`) |
| Introspección | Lila `#C9B6E4` (hell `#E9DCFA`, Fläche `#3A2C58`) |
| Karten | `rgba(245,239,228,0.06)`, Rand `rgba(245,239,228,0.08)`, Radius 20–26 px, **`backdrop-filter: blur(16px) saturate(130%)`** |
| Radien | Pillen 15–30 px, Karten 20–28 px |
| Schrift | Titel/Fragen: Fraunces 300 (26–34 px), Zitate/Momente: Fraunces kursiv 300; UI: Nunito Sans; Abschnitts-Labels: 11 px, 700, Versalien, Sperrung 0.16em, `#CDBFAE` |

### 4.2 Hintergrund: Nacht & Sternenhimmel
- **Basisverlauf**, liegt auf `#2B2430`, Deckkraft je Phase:
  `linear-gradient(to top, #050409 0%, rgba(6,5,11,.97) 8%, rgba(9,7,15,.88) 16%, rgba(14,11,21,.72) 24%, rgba(20,16,28,.56) 32%, rgba(26,21,36,.48) 40%, rgba(30,25,44,.56) 47%, rgba(34,29,52,.72) 54%, rgba(36,31,56,.88) 61%, #231F3A 68%, #1C1931 76%, #15132A 84%, #0F0D21 92%, #0A0918 100%)`
  Unten ist es fast schwarz, die Mitte ist etwas heller und warm, nach oben wird es tiefes Nachtviolett.
- **Sterne:** ca. 60 feste Sterne (1–2,2 px, oben dichter), jeder funkelt einzeln und zeitversetzt (3–8 s). Positionen sind im Referenz-Script als `STARS` hinterlegt (LCG, Seed 7).
- **Warmer Raum-Glow** um die Flamme: radial `rgba(242,180,90,.34)` → transparent.
- **Kopf-Fade:** Oben (96 px) blendet scrollender Inhalt unter der Statusleiste aus. Unten liegt hinter der Navbar ein 220 px hoher Verlauf nach `rgba(6,5,10,1)`.

### 4.3 Bewegung (alles sehr weich)
| Was | Wie |
|---|---|
| Kerze Position/Größe | `top`/`transform` 2.4 s `cubic-bezier(.45,.05,.2,1)` |
| Anzünden → erstes High | „Tu luz está encendida.“ bleibt 2.6 s; Texte erscheinen mit `softin` (1.4 s, 10 px Aufschweben) bzw. `softin2` (1.6 s, 0.9 s Verzögerung) |
| Tab-Wechsel | Inhalt blendet 0.28 s aus, neuer Inhalt `tabin` (0.75 s, 12 px Aufschweben); Kerze blendet weich aus (0.7 s, Scale 0.92) statt zu springen |
| Navbar-Indikator | beige Pille gleitet (`left`/`width` 0.65 s `cubic-bezier(.4,0,.2,1)`), Label blendet verzögert ein |
| Introspección-Schritte | `stagein`: 1 s, Opacity + 16 px + leichte Unschärfe (6 px → 0) |
| Leuchtende Kugel („Orb“) | `orb` 5 s pulsieren (Scale .9 ↔ 1.15), `breathe` 7 s |
| Lichtschleier | `aurora` 9–11 s langsames Driften |

### 4.4 Wiederkehrendes Symbol: die leuchtende Kugel
Das leuchtende Spiral-Symbol der Introspección ist das **Leitmotiv**, dezent überall eingesetzt:
- Lichtpunkt vor jedem Seiten-Label („● DÍA 7“, „● TUS HIGHS“, „● TUS NOCHES“)
- Kugeln in „Tu camino“
- Kugeln vor Mustern und Highs
- Introspección-Karten
- Navbar-Hinweis

Erreichte Dinge leuchten **warm**, Kommendes leuchtet **lila**, Späteres ist **gedimmt**.

## 5. Die Kerze („handgemacht“, beige mit Farnen)

- SVG 390 × 520, Docht-Ursprung `translate(195 284)`.
- **Körper:** handgegossene Stumpenkerze, etwa 13 % höher als ursprünglich, unten verlängert.
  - Verlauf `bodyA`: `#F2E6D1 → #E7D7BC (0.6) → #D2BE9E`
  - weicher Seitenschatten, sehr feine Wachslinien (`#B8AC98`, 0.12), Körnung 0.08
  - Oberseite `#EFE2CB` / `#F7EDDB`, Tropfen `#E6D5B9`
- **Gepresste Farne:** 4 Wedel aus Stiel plus gedrehten Ellipsen-Fiedern, dunkelgrün `#2F4A2E` / `#2B452B` plus ein heller `#5E7A57`. Sie liegen innerhalb des Körper-Clips.
- **Das exakte SVG (Defs, Pfade, Farne) bitte 1:1 aus der Referenz übernehmen**, Block nach `<sc-if value="{{ showCandle }}"`.
- **Flamme:**
  - Pfad `fp(22,58,0)`, Kern `fp(9,24,0)`, Funktion im Referenz-Script
  - Schichten: Glow (blur), warmer Verlauf, heller Kern
  - **Farbe immer gleich warm**, Stimmung nur über Größe und Halo
  - sanftes Flackern 3.2 s
- **Positionen** (`top`, `scale`, Transform-Origin `195px 0`):

| Phase | top | scale |
|---|---|---|
| Einstieg, Mecha, Anzünden, „Luz encendida“ | 150 | 0.75 |
| High / Low / Pregunta / High 2 / Recordatorio | 280 | 0.6 |
| Tu día | 360 | 0.55 |
| Opciones, Música | 318 | 1.0 |
| Quedarme / Diario / Apagar / Dormir | 180 | 1.3 |
| Tabs Highs / Patrones / Diario / Dentro | Kerze ausgeblendet (Opacity 0, Scale ×0.92) |

- **Flamme/Halo pro Phase** `[flameScale, –, haloScale, haloOpacity]`:
  - `home/intro [0,0,.6,.25]` · `lit [1,0,1,1]` · `high1 [1.3,0,1.3,1]`
  - `low/ask [.68,0,.75,.55]` · `high2 [1.15,0,1.18,1]` · `mirror/remind [1,0,1,1]`
  - `now [1.2,0,1.5,1]` · `stay/blow [1.3,0,1.7,1]` · `journal [1.2,0,1.6,1]` · `sleep [0,0,.55,.15]`

## 6. Navigation

- **Schwebende Pillen-Navbar:**
  - zentriert, 26 px über dem Rand, Radius 32 px
  - Hintergrund `rgba(36,31,48,.62)` mit Blur 18 px, feiner Rand, weicher Schatten
- **Reihenfolge:** **Hoy · Highs · Patrones · Diario**. Ab 14 Nächten kommt als fünfter Punkt **Dentro** (Introspección) dazu.
- **Aktiver Punkt:** beige Pille `#E6CDA3` mit Icon und Label in `#2B2430`; Breiten Hoy 92, Highs 104, Patrones 128, Diario 108, Dentro 112 px.
- **Inaktive Punkte:** nur Icon `#CDBFAE`, 56 px breit bzw. 50 px bei 5 Punkten.
- Sichtbar auf Hoy (Mecha, erledigt), Highs, Patrones, Diario und Dentro (Startseite und Reflexiones). Während der Introspección-Fragen ist sie **ausgeblendet**.
- **Icons:** Mond+Sterne (Hoy), Stern mit Strahlen (Highs), konzentrische Kreise (Patrones), Kalender (Diario), Spirale (Dentro). Wunsch: **Solar Icon Set** (`@iconify/react`, Prefix `solar:`; Linear inaktiv, Bold Duotone aktiv), Lizenz prüfen. Die Referenz nutzt Platzhalter im Solar-Stil.

## 7. Abendritual (Tab „Hoy“) – UI-Texte exakt übernehmen

### 7.0 Sperrbildschirm (nur `recurrente`)
- Dunkler Verlauf, Datum, große Uhrzeit **21:30**.
- Benachrichtigung: Flammen-Icon, „VELA · ahora“, **„El día se va apagando.“** / „¿Quieres cerrarlo con tres momentos?“.
- Kurz erscheint „Toca la notificación“. Tipp → Mecha.

### 7.1 Einstieg (nur Erstnutzung)
- Kerze aus. Text: **„Hola, soy Vela.“** / „Cada noche, tres momentos: algo bueno, algo difícil y otra vez algo bueno. No hace falta más.“
- Beiger Button **„Enciende tu primera luz“**, darunter „Tus momentos son solo tuyos.“

### 7.2 Mecha + Kopfzeile mit Mond
- **Kopfzeile:** links das Datum (z. B. „Lunes, 9 de noviembre“) und klein die Mondphase („LUNA NUEVA · 0 %“), rechts der plastische Mond (≈78 px, Variante D).
- **Datum und Mond hängen an den „Nächten“:** Datum = 9.11.2026 + N Tage, 21:30. Mondphase live berechnet: synodischer Monat 29.530588853 d, Referenz-Neumond 6.1.2000 18:14 UTC, Funktionen `moonPhase()` und `litPath19()` in der Referenz.
- **Text unter der Kerze:** **„Qué bien que estés aquí.“** / „¿Cómo ha ido tu día?“ + Pille „Deja el dedo en la pantalla“.
- Der Finger kann **irgendwo** auf dem Screen liegen. Die Fingergeste erscheint nur initial (2 Durchläufe).
- **Ab 14 Nächten:** unten rechts über der Navbar die Pille **„Nuevo · Introspección, aquí abajo“** (lila Glas, leuchtender Punkt). Ein kleiner leuchtender **Stern fällt wiederholt** zum Dentro-Punkt der Navbar, der lila pulsiert. Tipp → Dentro.

### 7.3 Anzünden
- Halten füllt einen Ring über **einen Atemzug** (Standard 8 s): erste Hälfte **„Inhala conmigo.“**, zweite **„Y exhala despacio.“**.
- Lässt man los, zieht sich der Ring sanft zurück.
- Voll: **„Tu luz está encendida.“** (2.6 s), dann weich ins erste High.

### 7.4 Erzähl-Screens (High → Low → Pregunta → High 2)
- **Layout:** Frage oben, Kerze Mitte, Interaktion unten. Oben 3 Fortschrittspunkte und Zurück.

| Schritt | Eyebrow | Frage | Untertitel | Skip |
|---|---|---|---|---|
| high1 | HIGH | ¿Qué fue hoy un buen momento? | Puede ser algo muy pequeño. | – |
| low | LOW | ¿Y qué fue difícil hoy? | Puedes dejarlo aquí, sin más. | Saltar hoy |
| ask | – | Suena agotador. | ¿Qué te habría sentado bien en ese momento? | Saltar |
| high2 | HIGH | Terminemos con algo bonito. | ¿Qué más fue bonito hoy? ¿O qué te hace ilusión? | – |

- **Zustände:**
  1. **Bereit:** Mikrofon-Kreis 92 px (beige, beim Low blau), „Toca y cuéntamelo“, darunter „Prefiero escribir“ **ohne Unterstreichung**. Bei *ask* zusätzlich „· No lo sé“.
  2. **Aufnahme:** atmender Glow, „Te escucho … 0:12“. Das Mikro springt dabei nicht.
  3. **Tippen:** Textfeld, Button „Listo“, darunter „Prefiero hablar“.
  4. **Nachdenken:** drei Punkte, „Un momento …“ (~1.6 s).
  5. **Spiegel:** Karte „LO QUE ESCUCHÉ“, darunter „Repetir“ und die beige Pille **„Seguir“**.
- **„No lo sé“** zeigt Chips: „Una pausa corta“, „Hablar con alguien“, „Tomar aire fuera“, „Decir que no a algo“, dazu „Seguir sin respuesta“.
- **Spiegel-Texte** stehen in der Referenz (Beispielsätze bei Sprache, Vorlagen bei Text).

### 7.5 Tu día
- Abstrakte Karte: Titel „Tu día“ + Datum, vertikale Linie mit Punkten (High gold leuchtend, Low Ring).
- Abschnitte HIGH / LOW / HIGH mit mehreren Punkten, jeweils „+ Añadir“.
- Startet kompakt (max. 300 px); bei mehr als 3 Punkten „Ver todo ⌄“ / „Ver menos ⌃“.
- Darunter „Respirar un momento“ (8-s-Atemübung) und **„Seguir“**.

### 7.6 Recordatorio (nur Erstnutzung)
- „Qué bien que hayas venido.“ / „¿Quieres que mañana por la noche te lo recuerde con suavidad?“
- Chips 21:00 · **21:30** · 22:00 / „Sí, por favor“ · „Mejor no“.

### 7.7 Opciones (offener Übergang)
- Text: **„Tu día ya puede descansar.“** / „Quédate todo el tiempo que quieras. O sigue hacia donde te lleve el momento.“ Kerze groß unten, Optionen mittig als dezente Zeilen mit kleinem Icon:
  - **Quedarme con la vela:** Kerze sehr groß; oben kurz „Toca en cualquier lugar para volver“.
  - **Escribir en mi diario:** „Coge tu libreta y tu bolígrafo.“ – analog, nicht in der App.
  - **Escuchar música tranquila:** öffnet `https://open.spotify.com/search/piano%20tranquilo` in einem neuen Tab.
  - **Irme a dormir:** „Toca la llama.“ → Flamme erlischt → „Que descanses.“ → Mecha erledigt mit „Ver tu día“ / „Volver al inicio“.

## 8. Tab „Highs“ (Patrones-Stil)

- **Kopf:** „● TUS HIGHS“ / **Highs** / „Lo bueno que viene y lo bueno que ya fue.“ Die Seite scrollt.
- **LO QUE VIENE:** eine Glas-Karte mit Zeilen. Links das beige Datum-Kästchen (13 nov „Por fin viernes: tarde libre“, 14 nov „Concierto con Ana“, 28 nov „Escapada a la costa“), darunter „en X días“. Unten „+ Añadir algo que te ilusiona“.
- **Hace un año:** hervorgehobene warme Karte mit Lichtschleier, kleinen funkelnden Sternen, leuchtender Kugel mit Funkel-Symbol, Titel „Una tarde en el lago con amigos“ und „Escúchalo con tu voz · 0:42“.
- **LO QUE FUE:** Liste vergangener Highs, inklusive der heutigen. Links eine kleine warme Kugel mit ✦ (**kein Play-Icon**), Datum, Text in Fraunces; rechts eine dezente Schallwelle („escuchar“).

## 9. Tab „Diario“ (Patrones-Stil)

- **Kopf:** „● TUS NOCHES“ / **Diario** / „Cada noche que encendiste la vela, guardada aquí.“
- **Kalender** „noviembre 2026“ (Mo-Start, L M X J V S D) in einer Glas-Karte:
  - Ausgewählter Tag = **beige leuchtende Kugel**, heute = feiner beiger Rand.
  - Tage mit Eintrag = leuchtender beiger Punkt, besondere Tage = leuchtendes ★.
- **Tageskarte darunter:** Datum in Fraunces 22, „☆ Marcar especial“ / „★ Día especial“ (dezent beige), High/Low/High mit leuchtenden Punkten (High gold, Low blau).
  - Ohne Eintrag: „Este día no encendiste la vela. Está bien así.“
  - Demo-Daten: `DAYDATA` in der Referenz.

## 10. Tab „Patrones“ – wächst mit den Nächten

**Kopf überall:** „● DÍA N“ / **Patrones** + Pille **„♡ Apoyo“** rechts / ein Satz. Die Seite scrollt.

**„Apoyo“** öffnet ein Bottom-Sheet **„Cuando no sabes seguir“** mit „A veces no basta con una vela. Pedir ayuda también es cuidarte.“ und tippbaren Zeilen:
- Hablar con alguien de confianza
- Buscar un psicólogo
- Teléfono de la Esperanza **717 003 717** (`tel:717003717`)
- **Línea 024** (`tel:024`, „Si piensas en hacerte daño · gratis, 24 h“)
- Emergencias **112**

Hilfe ist **nie** hinter Nächten gesperrt.

### 10.1 Día 0 und Día 1 – „Qué verás, noche a noche“
- **Wischkarten** (350 × 250, eine Info nach der anderen): Wischen, Punkte, „Siguiente“ / „Otra vez“, Pfeil stupst anfangs an.
- Jede Karte zeigt Icon, Titel, eine Zeile und ein dezentes Badge (🔒 Noche X · ✓ Ya disponible · Siempre).

| Badge | Titel | Zeile |
|---|---|---|
| Noche 1 | Tus noches | Tus highs y lows, noche a noche. |
| Noche 1 | Tus buenos momentos | Vuelve a escuchar tus highs. |
| Noche 3 | Lo que más aparece | Las palabras que se repiten. |
| Noche 5 | Tu energía | Qué te llena y qué te vacía. |
| Noche 7 | Tus patrones | Qué te pesa, y cuándo. |
| Noche 7 | Más de esto | Impulsos a partir de tus highs. |
| Noche 14 | Tu espejo | Dos semanas tuyas, en pocas palabras. |
| Noche 14 | **Introspección** – Sonderkarte: lila Nachthimmel, funkelnde Sterne, Lichtschleier, leuchtende Kugel, „✦ LO MÁS TUYO“ | Preguntas que te acercan a ti. Más claridad, más calma. |
| Siempre | No estás solo | Ayuda, siempre que la necesites. |

- Darunter die **Teaser-Karte** „EN LA NOCHE 14 SE ABRE · **Introspección**“ mit dem Text „Preguntas hechas solo para ti, a partir de tus highs, tus lows y tus patrones. Filosóficas y del día a día.“ Dazu Labels *De tus highs* (gold), *De tus lows* (blau), *De tus patrones* (lila) und ein Fortschritt „Empieza esta noche · 0/14“ bzw. „Faltan 13 noches · 1/14“.
- Danach „Tu camino“ (10.4).

### 10.2 Día 3 und Día 5 – Wischkarten mit ersten Ergebnissen
- **Día 3 „Lo que empieza a aparecer“:**
  - *Tus noches:* pro Nacht High (gold) und Low (blau), Legende ● High ● Low
  - *Lo que más aparece:* zwei Spalten „En tus highs“ / „En tus lows“ mit ×-Zählern
  - verschwommenes erstes Muster mit 🔒 „Lo verás en 4 noches“
  - eine Frage („Llevarla a mi noche“ / „Otra pregunta“) und ein Gedanke
- **Día 5 „Se empieza a ver“:**
  - *Tu energía · borrador:* Balken „Te da energía“ / „Te la quita“
  - verschwommenes Muster „en 2 noches“
  - Frage und kleine Geste

### 10.3 Ab Día 7 – Liste statt Wischkarten, jeder Eintrag mit Unterseite
- **Día 7:** kleines Banner „● NUEVO · Siete noches. Ya puedo enseñarte lo que se repite.“, darunter die Liste **„Tus primeros patrones“**. Zeilen mit Kugel, Titel, Zeile und ›:
  - Tu mapa de energía
  - Las personas
  - Los lunes
  - Más de esto

  Darunter „Entra en cada uno, a tu ritmo.“
- **Día 14+:** oben der Spiegel „TU PRIMER ESPEJO · 2 SEMANAS“ (Zitat in Fraunces kursiv, „Escúchalo con calma · 1:40“). Danach die Liste **„Tus patrones“**:
  - Tu mapa de energía
  - Las personas
  - Caminar y calma
  - Tu semana (Balken Highs/Lows pro Wochentag)
  - Varios lows seguidos (mit „Ver apoyo“ → Sheet)
  - Más de esto
- **Unterseite** (Tipp auf Zeile):
  - Kopf, Liste, Camino und Leiste werden ausgeblendet, die Seite springt nach oben.
  - Oben „‹ Tus patrones“, Kugel, **große Headline** (Fraunces 32), ein Satz, dann der Inhalt.
- **Unterseite „Tu mapa de energía“:**
  - **Blasenkarte:** links „Te llena“ (gold), rechts „Te pesa“ (blau). Größe = Häufigkeit, antippbar. Die gewählte Blase leuchtet; darunter z. B. „Amigos · Aparece en 5 de tus 7 highs.“ + „Última vez: el sábado, cena con amigos.“
  - **Liste „Te llena“** und **Liste „Te pesa“** mit Häufigkeiten. Jeweils **„+ Añadir algo que te hace bien“** bzw. **„+ Añadir algo que te quita energía“**: Inline-Eingabe, „Guardar“/Enter. Eigene Einträge erscheinen mit Label **„Tuyo“**.
  - Fußzeile: „Lo que añadas aquí lo tendré en cuenta en tus patrones e ideas.“
  - Daten Tag 7/14: `EN` bzw. `patDash` in der Referenz.

### 10.4 „Tu camino“ (jede Tagesstufe)
- Vertikaler Weg mit drei Kugeln:
  - **Noche 1 · Tus noches**
  - **Noche 7 · Tus patrones**
  - **Noche 14 · Introspección**
- **Zustände:** Erreicht = warm leuchtend mit ✓ und „Listo“. Nächstes Ziel = lila pulsierend mit „en X noches“. Später = gedimmt.
- Die Verbindungslinie füllt sich mit warmem Licht bis „heute“; ein leuchtender Punkt markiert den aktuellen Stand. Kopf rechts: „Hoy · noche N“.
- **Ab Día 3** steht darunter die kleine **Introspección-Leiste**: „Se abre en X noches · N/14“ mit dünnem Balken, ab 14 „Ya disponible · ábrelo en «Dentro»“ (tippbar).

## 11. Tab „Dentro“ – Introspección (ab 14 Nächten)

**Prinzip:** ein ruhiger Raum, den man **aktiv betritt**. Pro Tag **3 Fragen**, persönlich aus Highs/Lows/Mustern oder philosophisch. Leichte Reflexion, keine Therapie.

1. **Startseite** (im Stil einer Begrüßung, Navbar sichtbar):
   - große atmende Lichtkugel mit Spirale
   - Eyebrow: beim ersten Mal „NUEVO · NOCHE 14“, danach „INTROSPECCIÓN · DÍA N“
   - Titel: zuerst **„Bienvenido a la Introspección“**, danach „Tu momento para mirar dentro“
   - Text: „Cada día, tres preguntas hechas a partir de tus highs y tus lows. Sin prisa, sin respuestas correctas.“
   - drei Punkte = Fragen des Tages, Button **„Empezar“** bzw. „Seguir · 2 de 3“
   - darunter dezent Themen-Chips: **Para ti · Claridad · Calma · Conocerte · Cuestionar · Horizonte**. Sie bestimmen die drei Fragen.
   - unten die Karte **„Tus reflexiones“**
2. **Fokus-Fragen** (Navbar aus, `stagein`-Übergänge):
   - oben Fortschritt (3 leuchtende Striche) und „Saltar“
   - **eine** große Karte: Herkunft mit Farbpunkt (*De tus highs* gold / *De tus lows* blau / *Para pensar despacio* lila), Frage in Fraunces kursiv 28, darunter warum („Las prisas aparecen en 5 de tus lows.“)
   - Textfeld „Escribe lo que te venga, aunque sea poco …“
   - unten Mikrofon und **„Siguiente“** bzw. „Terminar“
3. **Abschluss:** Kugel, **„Tres pasos hacia ti“**, „Guardé tus respuestas en «Tus reflexiones». Mañana te esperan tres preguntas nuevas.“, Button „Volver“.
4. **Zurück auf der Startseite:** „Por hoy, suficiente“, drei leuchtende Punkte, kein Start-Button.
5. **Tus reflexiones:** Unterseite mit „‹ Introspección“; jede Antwort als Karte (Herkunft · hoy, Frage kursiv, Antwort).

**Beispielfragen** (`INQ` in der Referenz):
- „¿Qué parte de tus prisas viene de fuera, y qué parte viene de ti?“
- „¿Qué tienen en común las personas con las que te sientes en casa?“
- „Si nadie te viera, ¿qué harías distinto mañana?“
- „¿Qué estás sosteniendo que podrías soltar esta noche?“
- „¿Qué sería para ti una vida buena, no perfecta?“
- „Caminar te da calma. ¿Qué encuentras ahí que te falta en otros lugares?“

## 12. Test-Hilfen (nur Prototyp)

- **Neustart-Icon** oben links.
- **Unter dem Telefon** (Desktop) bzw. hinter einem kleinen „☰“-Button (Mobil):
  - **„Ir directamente a“:** Inicio/Notificación, Mecha, High, Low, Pregunta, High 2, Tu día, Recordatorio, Opciones, Vela, Diario (Schreiben), Apagar, Highs, Patrones, Diario, Dentro. Springen setzt Timer, Aufnahme und Halten zurück.
  - **„Noches con Vela“:** 0 · 1 · 3 · 5 · 7 · 14 · 18 · 22 · 26 · 28 · 30. Das setzt die Patrones-Stufe (ab 14 Inhalt von Tag 14, Labels mit echter Zahl), Datum + Mondphase auf Hoy, Dentro ab 14 und setzt die Tagesfragen der Introspección zurück.

## 13. Bewusst NICHT im Prototyp / Abnahme

**Nicht enthalten:**
- echte Sprache und KI (Spiegel = Beispielsätze bzw. Vorlagen)
- Pusten per Mikrofon (stattdessen Tippen auf die Flamme)
- Push-Benachrichtigungen, Konten
- Monatswechsel im Kalender
- echtes Abspielen von Audio (nur Optik)
- Pfeile in Energie-Zeilen ohne Ziel

**Abnahmekriterien:**
- Flüssig auf iPhone Safari und Android Chrome, kein horizontales Scrollen, Safe Areas beachtet.
- Long-Press auf der Halte-Fläche löst kein Kontextmenü und keine Auswahl aus.
- Die Kerze springt nie; die Flammenfarbe bleibt immer gleich.
- Alle Tab-Wechsel und Introspección-Schritte laufen weich animiert.
- Patrones zeigt je nach „Noches“ die richtige Stufe; Dentro und der Hoy-Hinweis erscheinen erst ab 14.
- `/` und `/?modo=recurrente` funktionieren.
- README mit `npm i && npm run dev` und Deploy-Befehl.

**Am Ende ausgeben:**
- Live-URL
- URL für `?modo=recurrente`
- Beispiel-URL `?noches=14`
- kurze Liste offener Punkte

## 14. Beigelegte Referenzen (`reference/`)

Format der `.dc.html`-Dateien: „Design Component“, also HTML mit `{{ platzhaltern }}`, `<sc-if>` und `<sc-for>`; die Logik steckt in `class Component … renderVals()` im `<script type="text/x-dc">`. **Nicht direkt lauffähig**, aber Quelle für exakte SVGs, Texte, Farben, Daten (`STARS`, `DAYDATA`, `UPCOMING`, `INQ`, `INTH`, `SUPPORT`, `EN`) und Zustandslogik.

- `proto/Vela-ES.dc.html` – **Hauptprototyp v1** (Erstnutzung, alle Tabs, Patrones 0–30, Introspección, Test-Hilfen)
- `proto/Vela-ES-R.dc.html` – wiederkehrende Nutzung (Sperrbildschirm-Einstieg)
- `patrones/Dia-00 … Dia-14.dc.html` – Patrones je Stufe als Einzelansichten
- `patrones/Introspeccion-14.dc.html` – frühe Einzelansicht Introspección; **maßgeblich ist Abschnitt 11 bzw. der Hauptprototyp**
- `moon/Moon-D.dc.html` – Mondvariante D
- `Vela_High-Low-High_Konzept.md` – Gesamtkonzept (Psychologie, Marke, Tone of Voice/Feel, Entscheidungen)
