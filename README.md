# Mission Mars

Mission Mars ist ein englischsprachiges SQL-Adventure für den Informatikunterricht und ein Projekt von zwei Schülern eines Schweizer Gymnasiums. Im Jahr 2084 hat die Marsstation Outpost Nine den Kontakt zur Erde verloren. Am ARES Space Center untersucht der Commander die Flugakten, prüft medizinische Freigaben und stellt ein vierköpfiges Team zusammen. Kapitel 1 enthält eine interaktive Einführung und neun Aufgaben mit echten PostgreSQL-Abfragen.

## Sofort spielen

1. Die GitHub-Pages-Adresse des Projekts öffnen. [Mission Mars auf GitHub Pages](https://raphaelbader77-cloud.github.io/mission-mars/)
2. **New Game** wählen. Nach Morgans Briefing zeigt NOVA, wie sich eine Person und ein Attribut in der Tabelle finden lassen.
3. Für spätere Sitzungen dasselbe Browserprofil und dieselbe Adresse verwenden. **Continue** setzt den lokalen Flug fort.

Zum lokalen Spielen zuerst `npm ci` und `npm run build` im Projektordner ausführen. `python3 play.py` öffnet den fertigen Build unter `http://127.0.0.1:8084/`. Unter Windows lautet der Befehl `py -3 play.py`. Mit **Ctrl+C** endet der lokale Dateiserver. Die Browser-Laufzeit benötigt HTTPS oder localhost für Web Locks und den Zugriff auf den Spielstand.

## Bedienung

| Funktion | Bedienung |
|---|---|
| SQL ausführen | **Run Query** oder **Ctrl+Enter** bzw. **⌘+Enter** |
| Leeren oder neu beginnen | **Clear** leert den Editor. **Reset Query** setzt zusätzlich Hinweise und Rückmeldung der Aufgabe zurück. |
| Hinweise | Nacheinander Konzept, Syntax und vollständige Beispielantwort einblenden |
| Tabelle untersuchen | **Inspect table** zeigt Schema, Schlüssel, Feldtypen und alle 13 Datensätze |
| Themen nachschlagen | **SQL Guide** durchsucht Erklärungen, Beispiele und typische Fehler |
| Aufgabe wiederholen | **Chapter Selection** bzw. **Mission directory**, danach eine abgeschlossene Aufgabe auswählen |
| Besatzung | Nach Mission 10 sind alle vier Rollen besetzt. Der Pilot lässt sich im Abschlussbildschirm wechseln. |
| Sicherung | **Settings → Export Save** speichert JSON. **Import Save** prüft die Datei vor Übernahme. |
| Ton und Bewegung | Im Einstellungsfenster schaltbar. Die Systemeinstellung für reduzierte Bewegung hat Vorrang. |

## Entwickeln und testen

Voraussetzungen sind Git, Node.js 24 mit npm und Python 3.10 oder neuer. GitHub Actions verwendet Python 3.12 für die lokalen Domänentests. Die erste Installation braucht Internet. Die npm-Versionen der Projektabhängigkeiten sind im Lockfile fixiert.

```sh
git clone https://github.com/raphaelbader77-cloud/mission-mars.git
cd mission-mars
npm ci
npm run dev
```

Den von Vite ausgegebenen Link öffnen. Änderungen in `src/` und `content/` erscheinen in der Entwicklungsansicht. Der Start kopiert die benötigten Laufzeitdateien aus den installierten npm-Paketen nach `public/vendor/`.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run preview
```

Auf Linux lassen sich fehlende Systembibliotheken mit `npx playwright install --with-deps chromium` installieren. Unter Windows mit dem Python-Launcher die Teile von `npm test` mit `py -3 -m unittest discover -s tests` und `node --test tests/queries.test.mjs` ausführen. Playwright prüft den Produktionsbuild unter `http://127.0.0.1:4190/mission-mars/` mit frischen Browserprofilen. Der Machbarkeitstest unter `prototype.html` verwendet eine eigene Testdatenbank. Für eine manuelle Vorschau mit demselben Unterpfad dient `npm run preview -- --base /mission-mars/`.

## Verzeichnis und Zuständigkeiten

| Pfad | Inhalt |
|---|---|
| `src/python/game.py` | Spielaktionen, Freischaltungen, Crew-Auswahl und Zustandsansicht |
| `src/python/domain.py` | Chapter, Mission, Orientation, Character, GameState, SolutionValidator |
| `src/python/bridge.py` | Python-Einstieg für asynchrone SQL-Anfragen und Spielbefehle |
| `src/js/runtime*.js` | Nachrichten zwischen Oberfläche und Worker, Start der WebAssembly-Laufzeiten |
| `src/js/database.js`, `query-policy.js` | PostgreSQL-Schema, Lesezugriff, SQL-Analyse und Speicherung |
| `src/js/editor.js`, `screens.js`, `panels.js`, `main.js` | SQL-Editor, Szenen, Dialogfenster und Eingaben |
| `content/` | Missionen, Lehrtexte, Kapitelplan und Astronautendaten in JSON |
| `public/art/`, `tools/generate_art.py` | Originalgrafiken und ihr optionaler Generator mit Pillow und NumPy |
| `public/licenses/`, `scripts/vendor.mjs` | Lizenzhinweise und Kopieren der WebAssembly-Laufzeitdateien aus npm-Paketen |
| `src/js/ui-kit.js` | Pixel-Icons, Tabellen und per Web Audio erzeugte Klangeffekte |
| `tests/`, `prototype/` | Automatisierte Tests, Machbarkeitsversuch und Messungen |
| `docs/`, `.github/workflows/pages.yml` | Architektur, Zusammenarbeit und Veröffentlichung |

## Wie SQL bewertet wird

Python erhält die sichtbare Abfrage, fordert über eine asynchrone JavaScript-Funktion zwei Ergebnispaare von PGlite an und vergleicht sie. Pro Datensatz laufen Kandidatenabfrage und Referenzabfrage. Der Vergleich berücksichtigt die ausgewählten Quellspalten, PostgreSQL-Typen, Werte und Häufigkeiten. Aliasse und eine andere Zeilenreihenfolge sind in Kapitel 1 zulässig. Die DISTINCT-Mission prüft zusätzlich das entsprechende Merkmal im Syntaxbaum. In der zweiten Datenmenge sind Kandidaten und Grenzfälle anders kombiniert.

Ein Beispiel aus Mission 7 zeigt den Unterschied zwischen einer passenden Person und einer passenden Regel. Ines Costa bringt neun Jahre als Ingenieurin mit und ist bereits anderweitig eingeteilt. Eine Abfrage ohne Verfügbarkeitsbedingung findet sie fälschlich. Das Spiel lässt die Abfrage laufen, zeigt das Ergebnis und erklärt die Abweichung.

## Missionen und Kapitel ergänzen

1. Für eine zusätzliche Mission in Kapitel 1 in `content/missions.json` eine Definition mit einer fortlaufenden ID anlegen. `guide` verweist auf einen Eintrag in `content/guide.json`, `speaker` auf einen registrierten Charakter und `scene` auf eine Grafik in `public/art/`.
2. Ziel, Dialog, Referenzabfrage, drei Hinweise und eine Erfolgsmeldung ergänzen. Bei reinen Leseaufgaben übernimmt `Mission` die bestehende Prüfung. `ordered` aktivieren, wenn die Reihenfolge ausdrücklich Teil der Aufgabe ist.
3. Für neue Lernziele einen Guide-Eintrag, eine alternative Lösung und einen bewusst falschen Grenzfall ergänzen. Die Tests für die ursprünglichen zehn Aufgaben dokumentieren die bisherige Reihenfolge.
4. Für ein weiteres Kapitel den Eintrag in `content/chapters.json` mit einem eigenen Missionssatz verknüpfen. Die Kapitelwahl in `src/js/panels.js`, den Worker in `src/js/runtime-worker.js` und die Kapitelzuordnung in `src/python/game.py` erweitern. Kapitel 1 hat heute einen gemeinsamen Missionssatz mit fortlaufenden IDs. Seine IDs, Freischaltungen und Crew-Zuordnung müssen für bestehende Spielstände stabil bleiben.
5. Für Schreibmissionen eine eigene transaktionale Ausführungsstrategie hinzufügen. Wenn sich das Speicherformat ändert, die Versionsnummer erhöhen und den Import alter Spielstände mit einer Migration abdecken. In Python- und Browsertests Übergang zwischen Kapiteln, Wiederaufnahme und bestehende Kapitel-1-Spielstände prüfen. [Architektur und Erweiterung um Kapitel 2](docs/ARCHITEKTUR.md#erweiterung-um-kapitel-2)

## Technische Grundlage

| Baustein | Festgelegte Version |
|---|---|
| Pyodide / eingebettetes CPython | 314.0.8 / 3.14.2 |
| PGlite | 0.6.0 |
| CodeMirror | Version 6, SQL-Sprachpaket 6.10.0 |
| pgsql-ast-parser | 12.0.2 |
| Vite / Playwright Test | 8.4.0 / 1.65.1 |

Vite bündelt JavaScript, CSS und CodeMirror. Im Browser-Worker führt Pyodide die Python-Spielregeln aus. PGlite führt PostgreSQL-Abfragen aus und speichert den Fortschritt in IndexedDB. Der Hoster liefert ausschliesslich statische Dateien aus. Bilder, Schriften und beide WebAssembly-Laufzeiten kommen von derselben Website. Links zu W3Schools sind freiwillige Vertiefungen.

Spielstände sind pro Browserprofil, Website und Installationspfad getrennt. Der Export enthält Fortschritt, Pilot und Einstellungen sowie die Version des unveränderlichen Kapitel-1-Datensatzes. Die restliche Crew und der Lernverlauf sind daraus eindeutig rekonstruierbar. SQL-Entwürfe bleiben nur innerhalb der geöffneten Seite erhalten.

## Veröffentlichung und Zusammenarbeit

Entwickelt auf einem Branch und öffnet einen Pull Request gegen `main`. Der Workflow **Mission Mars on GitHub Pages** prüft Pull Requests mit Python, Node.js und Chromium. Bei einem Push auf `main` veröffentlicht er `dist/` nach erfolgreichen Prüfungen. Unter **Settings → Pages → Build and deployment → Source** muss dafür **GitHub Actions** ausgewählt sein. [Team und Veröffentlichung](docs/TEAM-UND-PAGES.md)

## Grenzen und nächster Meilenstein

Kapitel 2 bis 8 sind geplante Kapitel. Kapitel 1 unterstützt eine einzelne lesende SELECT-Abfrage mit Spalten, Vergleichen und Filtern. Komplexere PostgreSQL-Ausdrücke können ausserhalb dieser Lernsprache liegen. Zwei Testdatenmengen erkennen viele zufällige Treffer, sind aber kein mathematischer Beweis für beliebige SQL-Abfragen. Pro Spielstand kann ein Tab gleichzeitig schreiben. Löschen der Browserdaten entfernt die lokale Datenbank.

Die beiden WASM-Laufzeiten benötigen auf schwächeren Geräten Zeit und Speicher. [Tests](docs/TESTS.md) · [Prototyp und Messwerte](prototype/README.md)

Eigene Grafiken und Klänge, Paketlizenzen und Quellen sind in [Assets und Bibliotheken](docs/ASSETS.md) dokumentiert.
