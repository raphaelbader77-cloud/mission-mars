# Testprotokoll · Kapitel 1

## Durchgeführte Prüfungen

| Bereich | Durchführung | Beobachtung |
|---|---|---|
| Machbarkeit | Separater Browserprototyp, Erststart und Reload | Pyodide validierte die Zeilen in Python. PGlite meldete SQLSTATE 42601 nach absichtlich falschem SQL. Die Folgeabfrage war erfolgreich. Zwei zusammen gespeicherte Zähler blieben nach Reload konsistent. |
| Python-Modell | Vier unittest-Tests | Sperren, Importvalidierung, Reihenfolge, NULL, Typen, Dubletten und Inhaltsreferenzen bestanden. |
| SQL und Laufzeitgrenze | Node-Test mit echtem Pyodide und PGlite | Alle 13 Untertests bestanden. Neun SQL-Missionen wurden jeweils mit neun Eingaben geprüft. |
| Spielbarkeit | Interaktiver Chromium-Durchlauf gegen den statisch ausgelieferten Produktionsbuild unter `/mission-mars/` | Briefing, Orientierung, Felderkundung, Hilfe, SQL Guide, neun SQL-Aufgaben und Abschlussbildschirm mit allen vier Rollen erreicht. |
| Sicherung und Wiederaufnahme | Separater automatisierter Chromium-Durchlauf | Pilot auf James Wilson gewechselt, Ton ausgeschaltet, JSON heruntergeladen, Fortschritt zurückgesetzt und dieselbe Datei importiert. Nach Reload erschienen derselbe Pilot und ausgeschalteter Ton. |
| Wiederholung | Abgeschlossene Mission über Mission directory geöffnet | Der Editor öffnete die gewählte Leseaufgabe erneut, auch nach Reload und Continue. Ein ungültiger JSON-Import wurde abgewiesen; der vorhandene Spielstand blieb erhalten. |
| Darstellung | Chromium mit Desktop-, Tablet- und Smartphone-Viewport | Bei 390 und 768 CSS-Pixeln waren das Hauptmenü und der durchsuchbare Guide bedienbar. Bei 390 Pixeln blieb auch der SQL-Editor sichtbar. Die Seite hatte keinen horizontalen Überlauf. |
| Grafiken, Schriften und Ton | Lokale Bild- und Schriftdateien, Web Audio und SFX-Schalter geprüft | Titelgrafik sowie die vier Crew-Sprites wurden geladen. Die Schriftdateien für Barlow, IBM Plex Mono und Press Start 2P waren verfügbar. Chromium startete die Oszillatoren für den Funkton. Bei ausgeschaltetem Ton blieb der nächste Klick stumm. |
| Build | `npm run build` | Vite erzeugte zwei statische HTML-Einstiege, lokale WASM-Dateien, Editor- und Worker-Bundles sowie die Assets. |
| Browserfehler und Pfade | Drei Playwright-Tests gegen den gebauten Unterpfad `/mission-mars/` | Die Tests beobachten fehlgeschlagene Anfragen, HTTP-Fehler, JavaScript- und Konsolenfehler und HTTP-Anfragen ausserhalb des Unterpfads. |

Die neun Prüfungen je SQL-Mission umfassen eine leere Eingabe, einen Syntaxfehler, einen Schreibversuch, eine falsche Spalte im Ergebnis, eine unbekannte Spalte, ein inhaltlich falsches Ergebnis, die Referenzlösung, eine gleichwertige Alternative und abweichende Formatierung. Zusätzliche Prüfungen decken fest codierte IDs, Mehrfachanweisungen, Funktionsaufrufe und den Zugriff auf andere Tabellen ab. Für die erste Mission prüft ein eigener Test die Tabelleninteraktion.

Der Browsertest verwendet die normale Editor-Tastenkombination, alle drei Hilfestufen, die heruntergeladene Datei und das Datei-Eingabefeld für den Import. Die akustische Qualität auf physischen Lautsprechern wurde nicht gemessen.

## Wiederholen

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:browser
node prototype/node-probe.mjs
```

Für einen bereits installierten Chromium-Browser kann `MARS_TEST_CHROMIUM` auf die ausführbare Datei zeigen. Die Testläufe verwenden temporäre Browserprofile. Für eine manuelle Prüfung unter `/mission-mars/` die Vorschau mit `npm run preview -- --base /mission-mars/` starten und die von Vite ausgegebene Adresse öffnen.

Die Playwright-Prüfungen laufen lokal und in GitHub Actions. Die Prüfung der öffentlichen Version erfolgt nach dem Deployment gemäss [Team und Veröffentlichung](TEAM-UND-PAGES.md). Durchläufe auf physischer Android- und iOS-Hardware, in Safari und in Firefox sind eigene Prüfungen. [Prototyp und Messbedingungen](../prototype/README.md)
