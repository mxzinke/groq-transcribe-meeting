# Meeting Recorder App - Detaillierte Anforderungsspezifikation

## 1. Projektübersicht

### 1.1 Ziel
Entwicklung einer Electron-basierten Desktop-Anwendung für macOS, die System-Audio von Meetings (Signal, Google Meet, etc.) aufzeichnet, lokal speichert und automatisch mit KI-Modellen (Whisper für Transkription, Kimi-K2 für Zusammenfassung) über Groq verarbeitet.

### 1.2 Kernfunktionen
- **Audio-Aufzeichnung**: Simultane Erfassung von System-Audio und Mikrofon
- **Lokale Speicherung**: Sichere Speicherung aller Aufnahmen auf dem Gerät
- **KI-Transkription**: Automatische Umwandlung in Text via Groq Whisper
- **KI-Zusammenfassung**: Intelligente Meeting-Summaries via Kimi-K2
- **Moderne UI**: Intuitive, minimalistische Benutzeroberfläche

## 2. Technische Anforderungen

### 2.1 Frontend-Architektur
- **Framework**: Electron + React 18 mit TypeScript
- **UI-Library**: Tailwind CSS für modernes, responsives Design
- **State Management**: React Context API für einfache State-Verwaltung
- **Routing**: React Router für Navigation zwischen Views

### 2.2 Audio-System
- **Loopback-Erfassung**: electron-audio-loopback für System-Audio
- **MediaRecorder API**: Für Aufnahme-Steuerung
- **Audio-Format**: WebM mit Opus-Codec (effizient & qualitativ hochwertig)
- **Multi-Stream**: Mischen von System-Audio und Mikrofon

### 2.3 KI-Integration
- **AI SDK**: Vercel AI SDK für Groq-Integration
- **Whisper Model**: whisper-large-v3-turbo für schnelle Transkription
- **LLM Model**: Kimi-K2 (oder llama3-8b-8192 als Alternative)
- **Streaming**: Echtzeit-Verarbeitung für bessere UX

### 2.4 Datenverwaltung
- **Speicherort**: Electron userData Directory
- **Struktur**:
  ```
  /recordings   - Audio-Dateien (.webm)
  /transcripts  - Transkriptionen (.txt)
  /summaries    - Zusammenfassungen (.md)
  /metadata     - Meeting-Metadaten (.json)
  ```

## 3. Funktionale Anforderungen

### 3.1 Aufnahme-Funktionen
- **Start/Stop**: Ein-Klick-Aufnahme mit visueller Statusanzeige
- **Audio-Quellen**: Automatische Erkennung und Auswahl
- **Live-Monitoring**: Audio-Level-Anzeige während Aufnahme
- **Pause/Resume**: Unterbrechung ohne Datenverlust

### 3.2 Verarbeitungs-Pipeline
1. **Aufnahme beenden** → Automatischer Start der Verarbeitung
2. **Transkription** → Progress-Anzeige während Whisper-Verarbeitung
3. **Zusammenfassung** → KI-generierte Struktur mit:
   - Hauptthemen
   - Entscheidungen
   - Action Items
   - Nächste Schritte

### 3.3 Benutzeroberfläche
- **Dashboard**: Übersicht aktiver/vergangener Meetings
- **Aufnahme-View**: Große, klare Kontrollelemente
- **Verlauf**: Durchsuchbare Liste aller Aufnahmen
- **Detail-View**: Transkript + Zusammenfassung nebeneinander

### 3.4 Erweiterte Features
- **Export**: PDF/Markdown-Export der Zusammenfassungen
- **Suche**: Volltextsuche in Transkripten
- **Tags**: Manuelle Kategorisierung von Meetings
- **Templates**: Anpassbare Zusammenfassungs-Templates

## 4. Nicht-funktionale Anforderungen

### 4.1 Performance
- **Aufnahme**: < 5% CPU-Auslastung während Recording
- **Transkription**: < 30 Sekunden für 10 Minuten Audio
- **UI-Response**: < 100ms für alle Interaktionen

### 4.2 Sicherheit & Datenschutz
- **Lokale Verarbeitung**: Nur Audio wird an Groq gesendet
- **Verschlüsselung**: Optional für gespeicherte Dateien
- **Keine Telemetrie**: Kein Tracking oder Analytics
- **API-Key-Verwaltung**: Sichere Speicherung in Electron Store

### 4.3 Benutzerfreundlichkeit
- **Onboarding**: Schritt-für-Schritt Setup-Wizard
- **Tastenkombinationen**: Globale Hotkeys für Start/Stop
- **System-Tray**: Schnellzugriff ohne offenes Fenster
- **Dark/Light Mode**: Automatisch nach System-Einstellung

### 4.4 Kompatibilität
- **macOS**: 11.0+ (Big Sur und neuer)
- **Audio-Quellen**: Alle macOS-kompatiblen Apps
- **Dateiformate**: Export in gängige Formate

## 5. UI/UX Design-Prinzipien

### 5.1 Visuelles Design
- **Farbschema**: 
  - Primary: #3B82F6 (Blue-500)
  - Secondary: #10B981 (Emerald-500)
  - Background: #F9FAFB (Light) / #111827 (Dark)
- **Typography**: Inter oder SF Pro
- **Spacing**: 8px Grid-System
- **Animationen**: Subtle, zweckmäßige Transitions

### 5.2 Layout-Struktur
```
┌─────────────────────────────────────────┐
│  Header (Logo, Status, Settings)        │
├─────────────────────────────────────────┤
│  ┌─────────┬─────────────────────────┐  │
│  │Sidebar  │  Main Content Area      │  │
│  │         │                         │  │
│  │- Record │  [Recording Interface   │  │
│  │- History│   or                    │  │
│  │- Search │   Meeting Details]      │  │
│  └─────────┴─────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 6. Implementierungs-Roadmap

### Phase 1: Grundfunktionen (Woche 1-2)
- [x] Projekt-Setup mit Electron + React
- [ ] Audio-Aufnahme implementieren
- [ ] Basis-UI mit Recording-Controls
- [ ] Lokale Dateispeicherung

### Phase 2: KI-Integration (Woche 3-4)
- [ ] Groq API-Integration
- [ ] Whisper-Transkription
- [ ] Kimi-K2 Zusammenfassung
- [ ] Progress-Tracking

### Phase 3: UI-Polish (Woche 5-6)
- [ ] Vollständige UI-Implementierung
- [ ] Dark Mode
- [ ] Animations & Transitions
- [ ] Error Handling

### Phase 4: Erweiterte Features (Woche 7-8)
- [ ] Export-Funktionen
- [ ] Suchfunktion
- [ ] System-Tray Integration
- [ ] Hotkeys

### Phase 5: Testing & Deployment (Woche 9-10)
- [ ] Unit Tests (Vitest)
- [ ] E2E Tests (Playwright)
- [ ] Code Signing
- [ ] DMG-Erstellung

## 7. Erfolgsmetriken

### 7.1 Technische Metriken
- Audio-Qualität: ≥ 128 kbps
- Transkriptions-Genauigkeit: > 95%
- App-Größe: < 150 MB
- Memory Usage: < 200 MB im Idle

### 7.2 User Experience Metriken
- Time to First Recording: < 30 Sekunden
- Fehlerrate: < 1% der Aufnahmen
- User Satisfaction: > 4.5/5 Sterne

## 8. Risiken & Mitigationen

### 8.1 Technische Risiken
- **macOS Permissions**: Frühe Tests für Audio-Berechtigungen
- **Groq API-Limits**: Caching & Retry-Mechanismen
- **Audio-Sync**: Gründliche Tests verschiedener Audio-Quellen

### 8.2 Projekt-Risiken
- **Scope Creep**: Klare Feature-Priorisierung
- **Performance**: Kontinuierliche Profiling & Optimierung
- **API-Kosten**: Usage-Monitoring & Limits

## 9. Wartung & Support

### 9.1 Update-Strategie
- Auto-Update via Electron-Updater
- Semantic Versioning
- Release Notes in der App

### 9.2 Monitoring
- Sentry für Error-Tracking (optional, privacy-first)
- Usage-Analytics (lokal, anonymisiert)
- Performance-Metriken

## 10. Abnahmekriterien

### 10.1 Funktional
- [ ] Erfolgreiche Aufnahme von 10+ verschiedenen Audio-Quellen
- [ ] Korrekte Transkription in Deutsch/Englisch
- [ ] Generierung sinnvoller Zusammenfassungen
- [ ] Stabile Performance über 1h+ Meetings

### 10.2 Qualität
- [ ] Keine kritischen Bugs
- [ ] Responsive UI ohne Freezes
- [ ] Intuitive Bedienung ohne Anleitung
- [ ] Konsistentes Design über alle Views