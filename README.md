# Meeting Recorder

A desktop application for recording meetings with automatic transcription and AI-powered summarization using Groq.

## Features

- **Automatic Audio Recording**: Records both microphone and system audio simultaneously
- **AI Transcription**: Converts speech to text using Groq's Whisper API
- **AI Summarization**: Generates meeting summaries with key points and action items
- **Meeting Metadata**: Add titles, participants, and context for better AI analysis
- **Audio Level Monitoring**: Real-time audio input visualization
- **Dark/Light Theme**: Customizable interface

## Audio Setup

The app automatically captures:
- **Microphone audio**: Your voice and other participants in the room
- **System audio**: Audio from your computer (e.g., from video calls, presentations)

No manual audio source selection is needed - the app handles everything automatically using the `electron-audio-loopback` package.

## Requirements

- **macOS**: 12.3+ (for system audio loopback)
- **Windows**: 10+ 
- **Linux**: Supported
- **Groq API Key**: Required for transcription and summarization

## Installation

1. Clone the repository
2. Install dependencies: `bun install`
3. Start the app: `bun run start`

## Configuration

1. Open Settings in the app
2. Add your Groq API key
3. Configure other preferences as needed

## Permissions

On macOS, you may need to grant:
- **Microphone access**: For recording your voice
- **Screen recording permission**: For system audio capture

The app will prompt you for these permissions when needed.

## Development

- **Start development**: `bun run start`
- **Package app**: `bun run package`
- **Run tests**: `bun run test`

## Dependencies

- **Electron**: Cross-platform desktop framework
- **React**: UI framework
- **TypeScript**: Type safety
- **electron-audio-loopback**: System audio capture
- **Groq SDK**: AI transcription and summarization
- **TailwindCSS**: Styling

## License

MIT License
