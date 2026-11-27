# Grafiken, Ton und Bibliotheken

Die Weltraumszene, das Space Center, der Kontrollraum, die Kolonievorschau, sieben Porträts und sechs Figuren-Sprites wurden eigens für Mission Mars erzeugt. Der Generator liegt in `tools/generate_art.py`. Zum Ausführen aus dem Projektordner Python, Pillow und NumPy installieren. Die fertigen PNGs liegen in `public/art`; zum Spielen werden die Zeichenbibliotheken nicht benötigt. Die drei vorgegebenen Bilder dienten als Stilreferenz und werden nicht mit dem Spiel ausgeliefert.

Die kurzen Klangeffekte entstehen im Browser mit einfachen Wellenformen. Der vollständige Synthesecode steht in `src/js/ui-kit.js`. Es gibt keine aufgenommenen Samples und keine Musikdateien.

| Bestandteil | Herkunft und Lizenzhinweis |
|---|---|
| Barlow, IBM Plex Mono, Press Start 2P | Lokal gebündelte Fontsource-Pakete, SIL Open Font License 1.1. Originalhinweise unter `public/licenses/@fontsource_*.txt`. |
| CodeMirror und Lezer | npm-Pakete unter MIT, Texte mit Copyrightangaben in `public/licenses/`. |
| PGlite | @electric-sql/pglite, Apache-2.0. Enthält PostgreSQL. |
| Pyodide | Pyodide, MPL-2.0. Eingebettetes CPython und Standardbibliothek werden unter den zugehörigen Python-Lizenzen ausgeliefert. |
| pgsql-ast-parser | npm-Paket zur Analyse der Schülerabfrage, MIT. |
| Vite und Playwright | Entwicklungs- und Testwerkzeuge, Paketversionen in `package-lock.json`. |
| Lerninhalte | Eigenständig formulierte Missionsdialoge, Aufgaben, Beispiele und Hilfen. Die W3Schools-Verweise öffnen freiwillige Zusatzlektüre. |

Quellen und weitere Lizenzinformationen: [Pyodide](https://github.com/pyodide/pyodide), [CPython](https://github.com/python/cpython), [PGlite](https://github.com/electric-sql/pglite), [PostgreSQL](https://www.postgresql.org/about/licence/), [CodeMirror](https://codemirror.net/), [pgsql-ast-parser](https://github.com/oguimbal/pgsql-ast-parser), [Fontsource](https://fontsource.org/) und [W3Schools SQL](https://www.w3schools.com/sql/).

