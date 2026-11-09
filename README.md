# Vela · High Low High

Ein kleines Abendritual als App (Oberfläche auf Spanisch): Kerze anzünden, drei Momente erzählen – etwas Gutes, etwas Schweres, wieder etwas Gutes. Vela spiegelt jeden Moment in einem Satz zurück. Über die Zeit entstehen Kalender, Highs und Muster.

## Was die App kann

| Bereich | Funktion |
|---|---|
| Anzünden | Docht gedrückt halten, ein Atemzug (3/5/8 s in den Ajustes) |
| Erzählen | **Einsprechen** (Spracherkennung Spanisch + Tonaufnahme) oder Tippen; „No lo sé“ mit Vorschlägen |
| Spiegel | „Lo que escuché“: ein Satz von Claude in Velas Stimme; ohne Netz/Schlüssel eine Vorlage aus den eigenen Worten |
| Tu día | Alle Momente des Abends, ergänzbar mit „+ Añadir“, Aufnahmen abspielbar, Atemübung |
| Erinnerung | Abend-Erinnerung als Kalendereintrag (.ics, täglich, mit Hinweis) – funktioniert auf iPhone und Android ohne Server |
| Resumen | Kalender mit echten Monaten, Tage mit Momenten, besondere Tage; **Patrones** ab 7 Abenden: Kraftquellen, Energieräuber, Ideen (Claude) |
| Highs | „Lo que viene“ (Vorfreude mit Datum), „Lo que fue“ (alle Highs, abspielbar), „Hace un año“ |
| Ajustes | Erinnerung, Hablar/Escribir, Atemdauer, Spotify, Export (JSON), alles löschen, Beispieldaten |
| App | Installierbar (Home-Bildschirm), offline nutzbar (Service Worker) |

**Datenschutz:** Alle Momente und Aufnahmen bleiben auf dem Gerät (localStorage + IndexedDB). An Claude geht nur Text – für den Spiegel und die Muster –, nie Audio.

## Einrichtung des Claude-Schlüssels (einmalig)

Ohne Schlüssel funktioniert alles, nur Spiegel und Muster nutzen dann Vorlagen bzw. sind nicht verfügbar.

1. Auf https://console.anthropic.com einen API-Schlüssel erstellen.
2. In Vercel: Projekt `vela-high-low-high` → **Settings → Environment Variables** → `ANTHROPIC_API_KEY` = Schlüssel (Production, Preview).
3. **Deployments → … → Redeploy**, damit der Schlüssel aktiv wird.

Kosten: ein Spiegel-Satz ist eine sehr kurze Anfrage; die Muster-Analyse läuft nur, wenn sich die Abende geändert haben.

## Adressen

| URL | Zweck |
|---|---|
| `/` | Die App |
| `/?prueba=1` | Testmodus: Neustart-Knopf und Sprungliste zu allen Screens |
| `/?modo=recurrente` | Demo des Einstiegs über die Abend-Benachrichtigung |
| `?respira=8` | Atemdauer per URL überschreiben |

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm i && npm run dev
```

`npm run dev` bedient auch `/api/*` lokal. Für echte Claude-Antworten vorher `export ANTHROPIC_API_KEY=…` setzen.

## Deployment

Jeder Push auf `main` wird von Vercel automatisch gebaut und veröffentlicht. Manuell:

```bash
npx vercel --prod
```

## Aufbau

- `src/App.tsx` – Ablauf und alle Screens
- `src/Candle.tsx` – Kerze Variante A „Bienenwachs“ (SVG aus der Referenz)
- `src/lib/store.ts` – Datenmodell und lokale Speicherung
- `src/lib/speech.ts` – Einsprechen (Web Speech API + MediaRecorder)
- `src/lib/audio.ts` – Aufnahmen in IndexedDB, Abspielen
- `src/lib/ai.ts` – Aufrufe von `/api/mirror` und `/api/patterns` mit Rückfall
- `src/lib/reminder.ts` – Kalender-Erinnerung (.ics)
- `api/mirror.ts`, `api/patterns.ts` – Vercel-Funktionen, rufen Claude (`claude-opus-5-5`) auf
- `public/` – Manifest, Icons, Service Worker
- `projekt/` – Konzept, Brief und Design-Referenzen

## Grenzen

- Spracherkennung braucht Chrome (Android/Desktop) oder Safari (iOS) und Internet. Firefox speichert nur die Aufnahme.
- Echte Push-Benachrichtigungen gibt es nicht; die Erinnerung läuft über den Kalender.
- Daten sind gerätegebunden. Auf dem iPhone sind Safari und die installierte App getrennte Speicher – am besten direkt die installierte App nutzen. Export sichert die Texte.

## Lizenzen

Icons: [Solar Icon Set](https://www.figma.com/community/file/1166831539721848736) von 480 Design, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
