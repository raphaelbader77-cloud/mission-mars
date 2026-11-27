# Mission Mars

Mission Mars ist ein statisches SQL-Lernspiel für den Browser. Kapitel 1 umfasst die Orientierung und neun SQL-Missionen. Bei technischen Änderungen bleiben Gestaltung, englische Dialoge, Lernziele und Spielregeln erhalten, soweit die Aufgabe ihre Änderung nicht verlangt.

## Zuständigkeiten

- `content/` enthält Szenenreferenzen, Story, Lehrtexte, Aufgaben und Crew-Daten. Beim Bearbeiten die Referenzen auf Missions-IDs, Guide, Sprecher und Grafiken gemeinsam prüfen.
- `src/python/` ist für Spielregeln, Fortschritt, Bewertung und Spielstandformat zuständig. Pyodide führt den Python-Code im Worker aus.
- `src/js/database.js` und `src/js/query-policy.js` steuern den PostgreSQL-Zugriff über PGlite. Die Leseaufgaben prüfen Schüler- und Referenzabfragen auf zwei Datenmengen. Schreibaufgaben benötigen eine eigene transaktionale Strategie.
- `src/js/runtime*.js` verbindet die Oberfläche mit dem Worker und der lokalen IndexedDB. Bei Änderungen am Spielstandformat ältere Exporte und bestehende Spielstände berücksichtigen. Die Speicheridentität hängt vom Ursprung und dem Pfad der Startseite ab.
- `src/js/screens.js`, `src/js/panels.js`, `src/js/main.js` und `src/style.css` bilden die Oberfläche. Originalgrafiken und Lizenztexte liegen in `public/art/` und `public/licenses/`.

## Entwicklung und Veröffentlichung

- Mit Node.js 24 und `npm ci` arbeiten. Bei Änderungen der Abhängigkeiten auch `package-lock.json`, die Drittanbieter-Lizenzen und die kopierten Dateien in `scripts/vendor.mjs` prüfen.
- `npm run dev` startet Vite. `npm test` führt die Python- und SQL-Tests aus. Vor `npm run test:browser` den Produktionsbuild mit `npm run build` erstellen und Chromium mit `npx playwright install chromium` installieren.
- Assets relativ zum Eintrag auflösen. Der Produktionsbuild muss unter `/mission-mars/` laufen. Playwright prüft diesen Unterpfad und beobachtet Browserfehler sowie fehlgeschlagene Anfragen.
- Abhängigkeiten, Schriften und WebAssembly-Dateien lokal ausliefern. Der Betrieb erfolgt über GitHub Pages ohne eigenes Backend, Tracking oder kostenpflichtige Dienste.
- `dist/`, `public/vendor/`, `node_modules/` und Testausgaben sind generiert. Änderungen an Quellen vornehmen und den Build daraus erzeugen. Den Veröffentlichungsworkflow unter `.github/workflows/pages.yml` pflegen.
