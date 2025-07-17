import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

interface TranscriptionResult {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface TranscriptionProgress {
  status: 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
}

class AIService {
  private groq: ReturnType<typeof createGroq>;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.groq = createGroq({
      apiKey: apiKey
    });
  }

  async transcribeAudio(audioBlob: Blob, onProgress?: (progress: TranscriptionProgress) => void): Promise<TranscriptionResult> {
    try {
      // Notify start of processing
      onProgress?.({ status: 'processing', progress: 10, message: 'Audio wird vorbereitet...' });

      // Convert blob to File object for Groq API
      const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type });
      
      // Since the AI SDK doesn't directly support audio transcription,
      // we'll use the native Groq API with fetch
      onProgress?.({ status: 'processing', progress: 30, message: 'Audio wird an Groq gesendet...' });
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'de'); // German language
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      onProgress?.({ status: 'processing', progress: 80, message: 'Transkription wird verarbeitet...' });
      
      const result = await response.json();
      
      onProgress?.({ status: 'completed', progress: 100, message: 'Transkription abgeschlossen!' });
      
      return {
        text: result.text,
        segments: result.segments || []
      };
    } catch (error) {
      console.error('Transcription failed:', error);
      onProgress?.({ status: 'error', message: 'Transkription fehlgeschlagen' });
      throw new Error('Transkription fehlgeschlagen: ' + (error as Error).message);
    }
  }

  async generateSummary(transcript: string, metadata: any = {}): Promise<string> {
    try {
      const prompt = `
Analysiere das folgende Meeting-Transkript und erstelle eine strukturierte Zusammenfassung im Markdown-Format:

# Meeting-Zusammenfassung

## Metadaten
- **Datum**: ${metadata.date || new Date().toLocaleDateString('de-DE')}
- **Dauer**: ${metadata.duration || 'Unbekannt'}
- **Teilnehmer**: ${metadata.participants || 'Unbekannt'}

## Hauptthemen
[Extrahiere die wichtigsten Diskussionspunkte aus dem Transkript. Liste sie als Bullet Points auf.]

## Entscheidungen
[Liste alle getroffenen Entscheidungen auf. Falls keine expliziten Entscheidungen getroffen wurden, schreibe "Keine expliziten Entscheidungen dokumentiert".]

## Action Items
[Konkrete Aufgaben und Zuständigkeiten. Falls keine genannt wurden, schreibe "Keine konkreten Action Items identifiziert".]

## Nächste Schritte
[Geplante Folgemaßnahmen. Falls keine genannt wurden, schreibe "Keine nächsten Schritte definiert".]

## Zusammenfassung
[Eine kurze, prägnante Zusammenfassung des Meetings in 2-3 Sätzen.]

---

TRANSKRIPT:
${transcript}`;

      const { text } = await generateText({
        model: this.groq('llama-3.3-70b-versatile'), // Using a more capable model
        prompt: prompt,
        temperature: 0.3,
        maxTokens: 4000
      });

      return text;
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw new Error('Zusammenfassung konnte nicht erstellt werden: ' + (error as Error).message);
    }
  }

  async checkApiKey(): Promise<boolean> {
    try {
      // Test the API key with a simple request
      const { text } = await generateText({
        model: this.groq('llama-3.3-70b-versatile'),
        prompt: 'Hello',
        maxTokens: 5
      });
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default AIService;