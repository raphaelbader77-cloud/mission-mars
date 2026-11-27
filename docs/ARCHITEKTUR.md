# Architektur und Unterrichtsdokumentation

## Vom Spielziel zum Modell

Die Frage «Wer kann mitfliegen?» lässt sich als Datenbankabfrage ausdrücken. Eine Person kann erfahren, aber bereits eingeteilt sein. Deshalb braucht man mehrere Bedingungen, bevor man einen Namen auf das Flugmanifest schreibt. Der Spielverlauf liefert zuerst kleine Teilfragen und kombiniert sie in der letzten Mission.

Die Anwendung besteht aus statischen Dateien. Der Browser lädt das Menü und initialisiert die beiden WebAssembly-Laufzeiten in einem Worker. CodeMirror lädt erst beim ersten SQL-Editor. Im Gegensatz zu QRLock braucht dieses Projekt keinen dauerhaft betriebenen Python-Webserver. Der Server liefert Dateien aus, der Computer des Spielers führt Python und PostgreSQL aus.

## Verantwortlichkeiten und OOP

| Objekt | Verantwortung | Beispiel |
|---|---|---|
| `Game` | Erlaubte Zustandsübergänge und Spielregeln | Eine abgeschlossene Mission lässt sich wiederholen, eine gesperrte noch nicht starten. |
| `Chapter` | Baut Missionsobjekte aus denselben JSON-Feldern auf und findet sie über die ID | Die neun SQL-Aufgaben verwenden dieselbe Bewertungslogik. |
| `Mission` | Holt über eine übergebene Funktion Ist- und Soll-Ergebnisse ein; gibt die Prüfung an den Validator weiter | Mission 5 fordert Ingenieure an. |
| `Orientation(Mission)` | Überschreibt die Methode `attempt` für einen anderen Aufgabentyp | Die Einführung prüft die Inspektion einer Zeile und einer Spalte. |
| `Character` | Hält Identität, Anzeigename und Rolle einer Person zusammen | Alex Chens Schlüssel verbindet Dialogporträt und Crew-Sprite. |
| `SolutionValidator` | Vergleicht strukturierte Ergebnisse und erzeugt Lernfeedback | Vertauschte Zeilen dürfen richtig sein, fehlende Dubletten können falsch sein. |
| `GameState` | Speichert typisierte Daten und prüft das versionierte Austauschformat | Ein negativer Missionsstand oder ein unbekannter Pilot wird zurückgewiesen. |
| `Database` (JavaScript) | Parametrisierte Schreibvorgänge des Spiels, echte PostgreSQL-Abfragen, Metadaten | Der Explorer liest Spalten und Typen aus dem Datenbankkatalog. |

**Komposition.** Ein Game besitzt ein Chapter und einen GameState. Ein Chapter enthält mehrere Mission-Instanzen, die unterschiedliche Aufgaben, Texte und Referenzabfragen tragen. Character-Objekte werden in mehreren Dialogen und am Kapitelende wiederverwendet.

**Polymorphie.** Game ruft für jede Aufgabe dieselbe Methode `attempt` auf. Abhängig vom konkreten Objekt prüft sie eine Tabelleninteraktion oder eine SQL-Abfrage. Tutorial-, Practice- und Challenge-Missionen unterscheiden sich in Inhalt und Hilfen. Dafür genügt ein Datenfeld. Eine Unterklasse wird dort eingesetzt, wo sich das Verhalten tatsächlich ändert.

## Weg einer Abfrage

1. Der Spieler tippt in CodeMirror und drückt **Run Query**.
2. Die Oberfläche schickt einen Befehl mit einer Anfrage-ID an den Worker. Der Worker verarbeitet Befehle nacheinander.
3. `bridge.py` dekodiert die JSON-Daten und ruft `Game.command("attempt", ...)` auf. Die aktuelle Mission bestimmt die Referenzabfrage.
4. Python wartet mit `await` auf die registrierte Funktion `flight_bridge.query`. JavaScript parst die Eingabe, begrenzt ihre Struktur und führt sie in einer lesenden PostgreSQL-Transaktion aus.
5. Beide Datenmengen liefern Spaltenmetadaten und geordnete Werte pro Zeile zurück. JSON erhält Text, Zahlen, Boolean und NULL als unterschiedliche Datentypen.
6. Python prüft das Ergebnis. Bei Erfolg aktualisiert Game den Fortschritt. Erst nach dem Speichern erhält die Oberfläche die Bestätigung und kann die Folgemission anbieten.

Die Referenzabfrage und die Schülerabfrage lesen denselben Datenstand. Die ausgeführte Eingabe stammt aus dem zuvor geprüften Syntaxbaum. Ohne eine echte Datenquelle, mit schreibenden Operationen oder bei mehreren Anweisungen lehnt die Konsole die Eingabe ab. Die erlaubte Ausdruckstiefe und Textlänge sind begrenzt. Die Lernsprache erlaubt weder Funktionsaufrufe noch kartesische Produkte. Zusätzlich verwendet die Verbindung ein Abfragelimit von 1,5 Sekunden und läuft im Hintergrundthread.

## Warum zwei Datenmengen?

Mission 6 verlangt mindestens acht Jahre Erfahrung. Wer die IDs der passenden Personen kennt, könnte auf der sichtbaren Tabelle dieselben Zeilen auswählen. Die zweite, separat benannte Tabelle hat denselben Aufbau, andere IDs sowie gezielte Grenzwerte. Eine korrekte Regel funktioniert auf beiden Tabellen.

Spalten müssen in der geforderten Reihenfolge erscheinen. Der Prüfer verfolgt die ursprünglichen Spalten, sodass eine umbenannte Ausgabe zulässig bleibt. Für jede Zeile entsteht eine typgetreue Darstellung. `Counter` vergleicht ihre Häufigkeit. Für eine Mission mit `ordered: true` vergleicht der Prüfer die Listen in ihrer ursprünglichen Reihenfolge. Die DISTINCT-Lektion verlangt das Schlüsselwort über ein Merkmal im Syntaxbaum.

## Daten und Speicher

`flight.astronauts` enthält 13 erfundene Datensätze, `calibration.astronauts` die Prüfdaten. Jede Datenbank wird beim ersten Start mit Primärschlüsseln und Pflichtfeldern initialisiert. Die Spielabfragen dürfen nur die unqualifizierte Tabelle `astronauts` ansprechen. Das Spiel setzt für jeden Durchlauf den Suchpfad auf die passende Datenmenge.

`public.game_save` enthält einen versionierten JSONB-Datensatz. PGlite sichert ihn und die Datenbank in IndexedDB. Der Worker meldet bleibenden Fortschritt erst nach erfolgreichem Schreiben. Bei einem Speicherfehler stellt er seinen vorherigen Python-Zustand wieder her. Web Locks verhindern zwei gleichzeitige Schreiber im selben Browserprofil. Fehlerhafte Imports lassen den vorherigen Spielstand intakt.

Der Export enthält alle veränderlichen Kapitel-1-Daten. Die Version `ares-13-v1` kennzeichnet das unveränderliche Personalverzeichnis. Für einen Wechsel der Adresse, des Browserprofils oder des Geräts dient der Export als Transportformat.

## Erweiterung um Kapitel 2

Der Kapitelplan in `content/chapters.json` enthält alle acht Schauplätze. Sieben sind aktuell nur im Verzeichnis sichtbar. Für die erste schreibende Mission sollten Inventar, Zutaten und Rezeptmengen als relationale Tabellen modelliert werden. Die neue Mission kann dieselbe Oberfläche sowie die Übergabe von Befehlen an Python verwenden.

Eine Schreibmission benötigt eine eigene Ausführungsstrategie. Sie führt die erlaubte Änderung in einer Transaktion aus, prüft vorherigen und neuen Zustand und übernimmt Materialien, Ergebnis und Missionsfortschritt gemeinsam. Bei einem Fehlversuch rollt sie die Transaktion zurück. Das Kapitel-1-Lesemodell dient weiterhin allen SELECT-Aufgaben. Für veränderliche Inventardaten braucht das Austauschformat eine neue Version mit einer Migration alter Spielstände.

## Vorschlag für eine Klassendemonstration

Die erste Person zeigt eine gültige, aber unvollständige Abfrage in Mission 7. Die zweite Person zeigt Ines Costas Datensatz im Explorer und ergänzt die fehlende Bedingung. Danach lässt sich am Python-Code zeigen, wie dasselbe Missionsobjekt erneut bewertet wird und erst beim Erfolg den Spielstand verändert. Zum Schluss das Crew-Manifest zeigen, als JSON exportieren und den Fortschritt aus dem Export wiederherstellen.

