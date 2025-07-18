import { createGroq } from "@ai-sdk/groq";
import { generateText, LanguageModelV1 } from "ai";

interface TranscriptionResult {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface TranscriptionProgress {
  status: "processing" | "completed" | "error";
  progress?: number;
  message?: string;
}

class AIService {
  private groq: ReturnType<typeof createGroq>;
  private apiKey: string;
  private model: LanguageModelV1;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.groq = createGroq({
      apiKey: apiKey,
    });
    this.model = this.groq("moonshotai/kimi-k2-instruct");
  }

  async transcribeAudio(
    audioBlob: Blob,
    onProgress?: (progress: TranscriptionProgress) => void,
  ): Promise<TranscriptionResult> {
    try {
      // Notify start of processing
      onProgress?.({
        status: "processing",
        progress: 10,
        message: "Audio wird vorbereitet...",
      });

      // Convert blob to File object for Groq API
      const audioFile = new File([audioBlob], "recording.webm", {
        type: audioBlob.type,
      });

      // Since the AI SDK doesn't directly support audio transcription,
      // we'll use the native Groq API with fetch
      onProgress?.({
        status: "processing",
        progress: 30,
        message: "Audio wird an Groq gesendet...",
      });

      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "whisper-large-v3");
      //formData.append("language", "de"); // German language
      formData.append("response_format", "json");

      const response = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      onProgress?.({
        status: "processing",
        progress: 80,
        message: "Transkription wird verarbeitet...",
      });

      const result = await response.json();

      onProgress?.({
        status: "completed",
        progress: 100,
        message: "Transkription abgeschlossen!",
      });

      return {
        text: result.text,
        segments: result.segments || [],
      };
    } catch (error) {
      console.error("Transcription failed:", error);
      onProgress?.({
        status: "error",
        message: "Transkription fehlgeschlagen",
      });
      throw new Error(
        "Transkription fehlgeschlagen: " + (error as Error).message,
      );
    }
  }

  async generateSummary(
    transcript: string,
    metadata: any = {},
  ): Promise<string> {
    try {
      const prompt = `You are a helpful assistant that summarizes meetings. You will be given a transcript of a meeting and you will need to summarize it. Here is how you should structure your response:

## 1. Metadata
- **Date**: ${metadata.date || new Date().toLocaleDateString("de-DE")}
- **Duration**: ${metadata.duration || "Unknown"}
- **Participants**: ${metadata.participants || "Unknown"}

## 2. Main Topics
[Extract the main topics of the meeting. List them as bullet points.]

## 3. Decisions
[List all decisions made in the meeting as bullet points. If no explicit decisions were made, write "No explicit decisions documented".]

## 4. Action Items
[Concrete tasks and responsibilities formatted as markdown list. If none were mentioned, write "No concrete action items identified".]

## 5. Next Steps
[Planned follow-up actions. If none were mentioned, write "No next steps defined".]

## 6. Summary
[A concise, clear summary of the meeting in 2-3 sentences.]


<additional_context>
${metadata.additionalContext}
</additional_context>

<transcript>
${transcript}
</transcript>

Use the lanaguage of the users within the transcript and format in markdown document.`;

      const { text } = await generateText({
        model: this.model,
        prompt: prompt,
        temperature: 0.2,
        maxTokens: 4000,
      });

      return text;
    } catch (error) {
      console.error("Summary generation failed:", error);
      throw new Error("Summary generation failed: " + (error as Error).message);
    }
  }

  async checkApiKey(): Promise<boolean> {
    try {
      // Test the API key with a simple request
      const { text } = await generateText({
        model: this.groq("llama-3.1-8b-instant"),
        prompt: "Hello",
        maxTokens: 5,
        maxRetries: 0,
      });
      return true;
    } catch (error) {
      console.error("API key validation failed:", error);
      return false;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default AIService;
