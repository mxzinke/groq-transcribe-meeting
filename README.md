# Meeting Recorder App

A modern Electron-based desktop application for macOS that records, transcribes, and summarizes meetings using AI. Built with React, TypeScript, and Tailwind CSS, it provides a beautiful and intuitive interface for capturing and managing meeting content.

## Features

- 🎙️ **Audio Recording**: Simultaneous capture of system audio and microphone input
- 🤖 **AI Transcription**: Automatic transcription using Groq's Whisper model
- 📝 **Smart Summaries**: AI-generated meeting summaries with key points and action items
- 🌓 **Dark Mode**: Beautiful light and dark themes
- 🔒 **Privacy First**: All data stored locally, only audio sent for transcription
- 💾 **Local Storage**: Secure local storage of recordings and transcripts

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Desktop Framework**: Electron with Vite
- **Styling**: Tailwind CSS with custom design system
- **AI Integration**: Groq API (Whisper + Llama models)
- **State Management**: React Context API
- **Testing**: Vitest + React Testing Library

## Prerequisites

- Node.js 18+ and npm
- macOS 11.0+ (Big Sur or newer)
- Groq API key (get one at [console.groq.com](https://console.groq.com))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/meeting-recorder.git
cd meeting-recorder
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Development

### Available Scripts

- `npm start` - Start the app in development mode
- `npm test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Lint the codebase
- `npm run package` - Package the app for distribution
- `npm run make` - Create platform-specific installers

### Project Structure

```
meeting-recorder/
├── src/
│   ├── main.ts           # Electron main process
│   ├── preload.ts        # Preload script for IPC
│   ├── renderer.ts       # React app entry point
│   ├── App.tsx           # Main React component
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── services/         # Business logic
│   ├── tests/           # Unit tests
│   └── types/           # TypeScript types
├── index.html           # HTML template
├── tailwind.config.js   # Tailwind configuration
└── vite.*.config.ts     # Vite configurations
```

### Architecture Overview

The app follows a clean architecture pattern:

1. **Main Process** (`src/main.ts`): Handles system-level operations, window management, and IPC communication
2. **Renderer Process** (`src/renderer.ts`): React application with UI components
3. **Preload Script** (`src/preload.ts`): Secure bridge between main and renderer processes
4. **Services Layer**: Business logic for audio processing and AI integration
5. **Context Providers**: Global state management for recording and theming

### Key Components

- **RecordingInterface**: Main recording UI with start/stop controls
- **MeetingHistory**: List view of past recordings
- **SettingsView**: Configuration for API keys and preferences
- **RecordingContext**: Global recording state and logic
- **AIService**: Integration with Groq API for transcription and summarization

## Building for Production

### macOS

```bash
npm run make
```

This will create a `.dmg` file in the `out/make` directory.

### Code Signing (Required for distribution)

1. Obtain an Apple Developer certificate
2. Configure electron-forge with your certificate details
3. Build with: `npm run make -- --arch=universal`

## API Integration

### Groq Setup

1. Sign up at [groq.com](https://groq.com)
2. Generate an API key from the console
3. Add the key in the app's Settings page

### Models Used

- **Transcription**: `whisper-large-v3-turbo` - Fast and accurate speech-to-text
- **Summarization**: `llama3-8b-8192` - Intelligent meeting summaries

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing component structure
- Write tests for new features
- Use conventional commits

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run
```

## Privacy & Security

- **Local First**: All recordings and transcripts are stored locally
- **Minimal Data Sharing**: Only audio is sent to Groq for transcription
- **No Telemetry**: No usage data or analytics collected
- **Secure Storage**: API keys stored securely using electron-store

## Troubleshooting

### Audio Permissions

On macOS, you'll need to grant microphone permissions:
1. System Preferences → Security & Privacy → Microphone
2. Check the box next to Meeting Recorder

### Common Issues

- **No audio recording**: Check microphone permissions and audio input settings
- **Transcription fails**: Verify your Groq API key is valid
- **App won't start**: Try deleting `node_modules` and reinstalling

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Electron Forge](https://www.electronforge.io/)
- UI components inspired by [Tailwind UI](https://tailwindui.com/)
- Icons from [Lucide](https://lucide.dev/)
- AI powered by [Groq](https://groq.com/)

---

**Note**: This is an open-source project created for educational purposes. For production use, ensure proper security auditing and compliance with data protection regulations.
