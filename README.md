# Meeting Recorder App - Detaillierte Spezifikation

## Projektübersicht

Eine Electron-basierte Desktop-Anwendung für macOS, die Audio von System-Gesprächen (Signal, Google Meet, etc.) aufzeichnet, speichert und automatisch in Markdown-Transkripte und Zusammenfassungen umwandelt.

## Technologie-Stack

### Core Technologies

- **Electron**: Desktop-App Framework
- **React**: Frontend UI
- **Node.js**: Backend-Logik
- **TypeScript**: Typsicherheit
- **Tailwind CSS**: Styling

### Audio-Verarbeitung

- **electron-audio-loopback**: System-Audio-Erfassung
- **MediaRecorder API**: Audio-Aufnahme-Steuerung
- **File System**: Lokale Speicherung

### KI-Integration

- **Vercel AI SDK**: KI-Framework
- **Groq API**: Whisper-Modell für Transkription
- **Groq LLM**: Zusammenfassung und Markdown-Generierung

## Architektur

### Hauptkomponenten

```
┌─────────────────────────────────────────────┐
│                 Main Process                │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Audio Manager  │  │  File Manager   │  │
│  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │  AI Processor   │  │  Config Manager │  │
│  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────┐
│              Renderer Process               │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Recording UI   │  │  Settings UI    │  │
│  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │  History UI     │  │  Transcript UI  │  │
│  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────┘
```

## Feature-Spezifikation

### 1. Audio-Aufnahme

**Funktionalität**: Simultane Aufnahme von System-Audio und Mikrofon

**Implementierung**:

```javascript
// main/audio/AudioManager.js
const { initMain } = require('electron-audio-loopback');

class AudioManager {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.initializeAudio();
  }

  async initializeAudio() {
    initMain();
    await this.setupAudioDevices();
  }

  async setupAudioDevices() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });
    
    // System-Audio mit Loopback erfassen
    const systemStream = await navigator.mediaDevices.getDisplayMedia({
      video: false,
      audio: {
        channelCount: 2,
        sampleRate: 44100
      }
    });
    
    // Streams kombinieren
    this.combinedStream = this.combineStreams(stream, systemStream);
  }

  startRecording() {
    if (this.isRecording) return;
    
    this.mediaRecorder = new MediaRecorder(this.combinedStream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      this.saveRecording();
    };
    
    this.mediaRecorder.start(1000); // 1 Sekunde Chunks
    this.isRecording = true;
  }

  stopRecording() {
    if (!this.isRecording) return;
    
    this.mediaRecorder.stop();
    this.isRecording = false;
    return this.currentRecordingPath;
  }

  async saveRecording() {
    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recording_${timestamp}.webm`;
    const filePath = path.join(app.getPath('userData'), 'recordings', filename);
    
    await fs.promises.writeFile(filePath, Buffer.from(await blob.arrayBuffer()));
    this.currentRecordingPath = filePath;
    
    // Automatische Transkription starten
    this.processRecording(filePath);
  }
}
```

### 2. KI-Transkription mit Groq

**Funktionalität**: Automatische Transkription nach Aufnahme-Ende

**Implementierung**:

```javascript
// main/ai/TranscriptionService.js
import { createGroq } from '@ai-sdk/groq';
import { transcribe } from 'ai';

class TranscriptionService {
  constructor() {
    this.groq = createGroq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  async transcribeAudio(audioFilePath) {
    try {
      const audioBuffer = await fs.promises.readFile(audioFilePath);
      
      const { text } = await transcribe({
        model: this.groq.speech('whisper-large-v3-turbo'),
        audio: audioBuffer,
        language: 'de', // Deutsch
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      });

      return {
        transcription: text,
        segments: text.segments,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Transkription fehlgeschlagen:', error);
      throw error;
    }
  }
}
```

### 3. Zusammenfassung und Markdown-Generierung

**Funktionalität**: Automatische Meeting-Zusammenfassung als Markdown

**Implementierung**:

```javascript
// main/ai/SummaryService.js
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

class SummaryService {
  constructor() {
    this.groq = createGroq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  async generateSummary(transcription, metadata = {}) {
    const prompt = `
Analysiere das folgende Meeting-Transkript und erstelle eine strukturierte Zusammenfassung im Markdown-Format:

# Meeting-Zusammenfassung

## Metadaten
- **Datum**: ${metadata.date || 'Unbekannt'}
- **Dauer**: ${metadata.duration || 'Unbekannt'}
- **Teilnehmer**: ${metadata.participants || 'Unbekannt'}

## Hauptthemen
[Extrahiere die wichtigsten Diskussionspunkte]

## Entscheidungen
[Liste alle getroffenen Entscheidungen auf]

## Action Items
[Konkrete Aufgaben und Zuständigkeiten]

## Nächste Schritte
[Geplante Folgemaßnahmen]

## Vollständiges Transkript
[Strukturiertes Transkript mit Zeitstempeln]

---

TRANSKRIPT:
${transcription}
`;

    const { text } = await generateText({
      model: this.groq('llama3-8b-8192'),
      prompt: prompt,
      temperature: 0.3,
      maxTokens: 4000
    });

    return text;
  }
}
```

### 4. Benutzeroberfläche

**Funktionalität**: Intuitive Aufnahme-Steuerung und Transkript-Anzeige

**Implementierung**:

```jsx
// src/components/RecordingInterface.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, FileText, Settings } from 'lucide-react';

const RecordingInterface: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  useEffect(() => {
    // IPC-Listener für Audio-Events
    window.electronAPI.onRecordingStatusChanged((status) => {
      setIsRecording(status.isRecording);
      setRecordingDuration(status.duration);
    });

    window.electronAPI.onTranscriptionComplete((transcript) => {
      setCurrentTranscript(transcript);
      setIsProcessing(false);
    });
  }, []);

  const handleStartRecording = async () => {
    const hasPermission = await window.electronAPI.requestAudioPermission();
    if (hasPermission) {
      await window.electronAPI.startRecording();
    }
  };

  const handleStopRecording = async () => {
    setIsProcessing(true);
    await window.electronAPI.stopRecording();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Meeting Recorder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={handleStartRecording}
              disabled={isRecording}
              className="flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Aufnahme starten
            </Button>
            
            <Button
              onClick={handleStopRecording}
              disabled={!isRecording}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stoppen
            </Button>
            
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></span>
              <span className="text-sm text-gray-600">
                {isRecording ? `Aufnahme läuft - ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')}` : 'Bereit'}
              </span>
            </div>
          </div>

          {isProcessing && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600">Transkription wird verarbeitet...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {currentTranscript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Meeting-Zusammenfassung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                {currentTranscript}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecordingInterface;
```

### 5. Dateiverwaltung

**Funktionalität**: Automatische Organisation und Speicherung

**Implementierung**:

```javascript
// main/storage/FileManager.js
const path = require('path');
const fs = require('fs').promises;

class FileManager {
  constructor() {
    this.baseDir = path.join(app.getPath('userData'), 'meetings');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    await fs.mkdir(path.join(this.baseDir, 'recordings'), { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'transcripts'), { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'summaries'), { recursive: true });
  }

  async saveRecording(audioBlob, metadata) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `meeting_${timestamp}.webm`;
    const filePath = path.join(this.baseDir, 'recordings', filename);
    
    await fs.writeFile(filePath, Buffer.from(await audioBlob.arrayBuffer()));
    
    // Metadaten speichern
    const metadataPath = path.join(this.baseDir, 'recordings', `${filename}.json`);
    await fs.writeFile(metadataPath, JSON.stringify({
      ...metadata,
      filename,
      timestamp,
      path: filePath
    }, null, 2));
    
    return filePath;
  }

  async saveTranscript(transcript, audioFilePath) {
    const audioFilename = path.basename(audioFilePath, '.webm');
    const transcriptPath = path.join(this.baseDir, 'transcripts', `${audioFilename}.txt`);
    
    await fs.writeFile(transcriptPath, transcript);
    return transcriptPath;
  }

  async saveSummary(summary, audioFilePath) {
    const audioFilename = path.basename(audioFilePath, '.webm');
    const summaryPath = path.join(this.baseDir, 'summaries', `${audioFilename}.md`);
    
    await fs.writeFile(summaryPath, summary);
    return summaryPath;
  }

  async getMeetingHistory() {
    const recordings = await fs.readdir(path.join(this.baseDir, 'recordings'));
    const meetings = [];
    
    for (const file of recordings) {
      if (file.endsWith('.json')) {
        const metadata = JSON.parse(
          await fs.readFile(path.join(this.baseDir, 'recordings', file), 'utf8')
        );
        meetings.push(metadata);
      }
    }
    
    return meetings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}
```

## Projekt-Setup

### Installation

```bash
# Projekt erstellen
npm create electron-app@latest meeting-recorder -- --template=typescript-webpack

cd meeting-recorder

# Dependencies installieren
npm install electron-audio-loopback @ai-sdk/groq ai
npm install react react-dom @types/react @types/react-dom
npm install tailwindcss @tailwindcss/typography
npm install lucide-react

# Dev Dependencies
npm install --save-dev @types/node concurrently
```

### Konfiguration

```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { initMain } = require('electron-audio-loopback');

// Audio-Loopback initialisieren
initMain();

// App-Initialisierung
app.whenReady().then(() => {
  createWindow();
  setupIPC();
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // macOS Berechtigungen anfordern
  if (process.platform === 'darwin') {
    systemPreferences.askForMediaAccess('microphone');
  }
}
```

### Umgebungsvariablen

```bash
# .env
GROQ_API_KEY=your_groq_api_key_here
```

## Sicherheit und Datenschutz

### Berechtigungen

- Mikrofon-Zugriff erforderlich
- System-Audio-Zugriff (macOS-spezifisch)
- Dateisystem-Zugriff für lokale Speicherung

### Datenschutz

- Alle Daten bleiben lokal gespeichert
- Nur Audio-Transkription wird an Groq gesendet
- Keine Metadaten oder persönliche Informationen in der Cloud

### Zustimmung

- Explizite Zustimmung vor jeder Aufnahme
- Sichtbare Aufnahme-Indikatoren
- Einfache Stopp-Funktionalität

## Deployment

### Build-Prozess

```bash
# Electron-Builder für Distribution
npm install --save-dev electron-builder

# Build für macOS
npm run build:mac
```

### Code-Signing (macOS)

```bash
# Entwickler-Zertifikat erforderlich für System-Audio-Zugriff
electron-builder --mac --publish=never
```

## Erweiterungsmöglichkeiten

1. **Multi-Sprach-Support**: Automatische Spracherkennung
1. **Cloud-Sync**: Optionale Synchronisation mit Cloud-Diensten
1. **Meeting-Planung**: Integration mit Kalender-Apps
1. **Collaboration**: Sharing-Funktionen für Teams
1. **Analytics**: Meeting-Statistiken und Trends

## Geschätzte Entwicklungszeit

- **MVP (Grundfunktionen)**: 3-4 Wochen
- **Vollständige Implementierung**: 6-8 Wochen
- **Testing und Polishing**: 2-3 Wochen

## Kosten

- **Groq API**: ~$0.111 pro Stunde Audio-Transkription
- **Entwicklerkosten**: Apple Developer Account ($99/Jahr) für Code-Signing
- **Hosting**: Nur für Updates/Distribution nötig
