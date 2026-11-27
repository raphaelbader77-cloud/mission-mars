# Gemeinsam entwickeln und auf GitHub Pages veröffentlichen

## Zusammenarbeit

1. Die Repository-Verwaltung kann dem Teampartner unter **Settings → Collaborators** Zugriff geben. Beide klonen das bestehende Repository und installieren die Abhängigkeiten gemäss [README](../README.md#entwickeln-und-testen).
2. Vor der Arbeit `main` aktualisieren und mit `git switch -c feature/mission-materials` einen eigenen Branch beginnen.
3. Für eine neue Mission Lernziel, eine richtige alternative Abfrage und einen falschen Grenzfall festhalten. Eine Person bearbeitet Modell und Tests, die andere Dialog und Szene. Beim nächsten Auftrag lassen sich die Rollen tauschen.
4. `npm test`, `npm run build` und `npm run test:browser` ausführen. Im Pull Request das Lernziel und die Prüffälle beschreiben. Der Partner prüft den Diff und spielt die betroffene Mission.
5. Nach dem Merge lokal mit `git switch main` und `git pull` aktualisieren.

Git synchronisiert Quellcode und Grafiken. Jeder Spieler behält seine lokale Datenbank. Zum gemeinsamen Testen desselben Fortschritts dient **Settings → Export Save** im Spiel.

## GitHub Pages einrichten

1. Mit einem Konto mit Adminrechten die Pages-Einstellungen öffnen. [Settings → Pages](https://github.com/raphaelbader77-cloud/mission-mars/settings/pages)
2. Unter **Build and deployment → Source** die Option **GitHub Actions** wählen. Bei bereits ausgewählter Option ist dieser Schritt erledigt. Falls Actions deaktiviert sind, können sie unter **Settings → Actions → General** aktiviert werden. Die im Workflow verwendeten offiziellen GitHub-Actions müssen zugelassen sein.
3. Den Pull Request nach erfolgreichem Check **Build and test** in `main` mergen. Der Push startet den Workflow **Mission Mars on GitHub Pages**. Falls Pages erst nach dem Merge umgestellt wurde, unter **Actions → Mission Mars on GitHub Pages → Run workflow** den Branch `main` wählen und den Lauf starten.
4. Unter **Actions** prüfen, ob sowohl **Build and test** als auch **Deploy to GitHub Pages** erfolgreich waren. Das Deployment verwendet die Umgebung `github-pages`. Bei benutzerdefinierten Schutzregeln muss die Umgebung Veröffentlichungen aus `main` erlauben. [Workflow-Läufe](https://github.com/raphaelbader77-cloud/mission-mars/actions)
5. Die URL aus dem Deployment in einem privaten Browserfenster öffnen. **New Game** starten, nach der Orientierung eine SQL-Abfrage ausführen und nach dem Neuladen **Continue** testen. Unter **Network** und **Console** prüfen, ob die Dateien unter `/mission-mars/` geladen werden und keine Fehler auftreten. [Öffentliche Pages-Adresse](https://raphaelbader77-cloud.github.io/mission-mars/)

Pull Requests bauen und testen das Spiel. Ein erfolgreicher Lauf auf `main` lädt `dist/` als Pages-Artefakt hoch und veröffentlicht es mit den Schreibrechten des Deployment-Jobs. Das öffentliche Repository kann GitHub Pages und Standard-GitHub-Runner kostenlos verwenden. [GitHub-Dokumentation für Pages-Workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Der Build verwendet relative Pfade. Ein anderer statischer HTTPS-Host kann den Inhalt von `dist/` mit den Unterordnern und dem WASM-MIME-Typ `application/wasm` ausliefern. Bei einem Wechsel der Adresse oder des Installationspfads den Spielstand vorher exportieren und am neuen Ort importieren.
