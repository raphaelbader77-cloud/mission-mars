# Technischer Vorversuch

`prototype.html` ist ein vom Spiel getrenntes Messinstrument. Es verwendet dieselben lokal ausgelieferten WebAssembly-Laufzeiten wie das Spiel. Der Versuch besitzt einen eigenen Datenbanknamen und einen synthetischen Datensatz.

## Versuch im Browser wiederholen

1. Hauptprojekt nach der README einrichten und starten. Im gleichen Verzeichnis wie die Startseite `prototype.html` aufrufen.
2. Die Tabelle muss Alex (8) und Maya (9) zeigen. Der Test hat die Zeilen in einer Python-Klasse validiert. Ein absichtlich falsch geschriebenes `SELECT` muss PostgreSQL-Fehler `42601` ergeben. Eine weitere Abfrage muss anschliessend erfolgreich sein.
3. Beim ersten Aufruf steht «First run». Der Test schreibt einen Fortschrittszähler und einen Datenbankeintrag in derselben Transaktion. «Reload and check restoration» drücken. Jetzt muss «Restored previous run: Yes» erscheinen. Der neue Zählerstand und die Anzahl der Logeinträge müssen übereinstimmen.
4. Die Seite zeigt Laufzeit pro Aufruf und dekodierte Grösse der geladenen lokalen Bibliotheken. Der erste Aufruf umfasst auch das Anlegen der Datenbank. Nach dem Neuladen können der HTTP-Cache und bereits initialisierte Datenbankdateien die Messung verkürzen. Verschiedene Geräte und Browser separat messen. Die optionale JS-Heap-Schätzung ist kein vollständiger WASM-Speicherwert.

Die Seite lässt sich im Entwicklungsmodus und aus dem statischen Build öffnen. Im öffentlichen Build verwendet sie relative Asset-Pfade. Alle Datenbankoperationen finden im Browser statt. Der Versuch enthält keine Spielerabfragen und keine für den Spieler freigegebene Schreibfunktion.

## Automatisierter Lauf mit Node

Im Projektverzeichnis `node prototype/node-probe.mjs` ausführen. Der Test öffnet eine temporäre PostgreSQL-Datenbank zweimal, verwirft dazwischen die Datenbankinstanz und prüft die Wiederherstellung. Er verwendet die gleichen Python- und Bridge-Dateien wie der Browsertest. Im Browser verwendet PGlite IndexedDB, im Node-Test ein temporäres Verzeichnis.

Gemessener Lauf mit Node 24.22.3, Pyodide 314.0.8 und PGlite 0.6.0:

| Messung | Ergebnis |
|---|---|
| Ergebniszeilen, beide Läufe | Alex, 8 und Maya, 9 |
| Fehlercode und Anschlussabfrage | 42601, danach 42 |
| Fortschritt / Log vor und nach Wiederöffnen | 0/0 → 1/1 → 2/2 |
| Zwei vollständige Läufe inklusive Initialisierung | 3,762 s |
| Prozess-RSS am Ende | 507,5 MiB |
| JS-Heap in Verwendung am Ende | 29,4 MiB |

Dies ist eine Einzelmessung. Die Node-Zahlen beschreiben den Testprozess und beinhalten unter anderem die beiden nacheinander geöffneten Datenbankinstanzen. Für die Speicherplanung auf Tablets und Telefonen sind konkrete Gerätetests nötig.

## Gemessener Browserlauf

Der Prototyp wurde im Chromium-Browser über die Entwicklungsvorschau aufgerufen und mit seinem Reload-Button neu geladen. Beide Läufe erledigten die Python-Ergebnisprüfung, den PostgreSQL-Fehlertest und die anschliessende Kontrollabfrage. Der zweite Lauf las den gespeicherten Zustand 1/1 aus IndexedDB und erhöhte ihn gemeinsam auf 2/2.

| Messung | Erster Aufruf | Neuladen |
|---|---:|---:|
| Beide Laufzeiten bereit | 4,198 s | 2,437 s |
| Vollständiger Versuch | 4,443 s | 2,662 s |
| Browser-Schätzung des JS-Heap | 425,4 MiB | 98,9 MiB |

Beim ersten Aufruf meldete die Resource Timing API 28,7 MiB dekodierte lokale Bibliotheksdateien. Das ist die Grösse nach HTTP-Dekomprimierung. Cache, WebAssembly-Kompilierung und Garbage Collection beeinflussen Zeit und Speicher erheblich. Im Hauptspiel bleibt der Titelbildschirm deshalb unabhängig von der Initialisierung der Lernkonsole bedienbar.

Ein separater Produktionsbuild des Prototyps mit relativer Vite-Basis war erfolgreich. Der erzeugte Einstieg verweist mit `./assets/…` auf sein Skript.
