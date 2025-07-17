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

class AIService {
  private groq: any;

  constructor(apiKey: string) {
    this.groq = createGroq({
      apiKey: apiKey
    });
  }

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);
      
      // For now, we'll return a mock result since Groq's Whisper API
      // might need specific formatting. In production, you'd use:
      // const result = await this.groq.transcribe(...)
      
      return {
        text: "Dies ist eine Beispiel-Transkription. Die tatsächliche Implementierung würde Groq's Whisper API verwenden.",
        segments: []
      };
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error('Transkription fehlgeschlagen');
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
[Extrahiere die wichtigsten Diskussionspunkte]

## Entscheidungen
[Liste alle getroffenen Entscheidungen auf]

## Action Items
[Konkrete Aufgaben und Zuständigkeiten]

## Nächste Schritte
[Geplante Folgemaßnahmen]

---

TRANSKRIPT:
${transcript}
`;

      const { text } = await generateText({
        model: this.groq('llama3-8b-8192'),
        prompt: prompt,
        temperature: 0.3,
        maxTokens: 4000
      });

      return text;
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw new Error('Zusammenfassung konnte nicht erstellt werden');
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