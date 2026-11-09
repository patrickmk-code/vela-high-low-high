# Vela · High Low High

Klickbarer, mobil-optimierter Web-Prototyp des Abendrituals „Vela · High Low High“ (Oberfläche auf Spanisch).
Kein Backend, keine Accounts, keine echte KI – reiner Klickprototyp.

## Einstiege

| URL | Was passiert |
|---|---|
| `/` | Erstnutzung: Start bei „Hola, soy Vela.“ |
| `/?modo=recurrente` | Wiederkehrende Nutzung: Sperrbildschirm mit Benachrichtigung → direkt zur Kerze, ohne Erinnerungsfrage |
| `?respira=8` | Dauer des Atemzugs beim Anzünden in Sekunden (Standard 3), kombinierbar: `/?modo=recurrente&respira=8` |

Test-Hilfen: Neustart-Icon oben mittig; Sprungliste zu jedem Screen unter dem Telefon (Desktop) bzw. hinter „☰ Pantallas“ (Handy).

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm i && npm run dev
```

Dann die angezeigte Adresse öffnen (z. B. http://localhost:5173). Mit `npm run dev` ist die App auch im WLAN erreichbar, zum Testen auf dem Handy.

## Deployment (Vercel)

Einmalig: auf vercel.com „Add New → Project“, dieses Repository importieren, „Deploy“. Vite wird automatisch erkannt
(Build `npm run build`, Output `dist`). Danach geht jeder Push auf `main` automatisch live.

Alternativ per CLI:

```bash
npx vercel --prod
```

## Aufbau

- `src/App.tsx` – Ablauf, Zustände und alle Screens (Logik entspricht `renderVals()` der Referenz)
- `src/Candle.tsx` – Kerze Variante A „Bienenwachs“, SVG 1:1 aus der Referenz
- `src/data.ts` – Texte, Demo-Daten, Flammen-Parameter
- `src/useLayout.ts` – Telefon-Rahmen am Desktop, Vollbild am Handy (kurze Screens werden sanft gestaucht)
- `src/icons.generated.ts` – benötigte Solar-Icons, erzeugt mit `npm run icons`
- `projekt/` – Konzept, Brief und Design-Referenzen

## Lizenzen

Icons: [Solar Icon Set](https://www.figma.com/community/file/1166831539721848736) von 480 Design, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) – Namensnennung im Prototyp unter der Sprungliste.
