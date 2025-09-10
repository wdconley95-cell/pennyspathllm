# 🐷 Penny's Path - AI Career Coaching

A production-ready web application that provides AI-powered career coaching through different coaching personas, powered by OpenAI's latest models and featuring our friendly mascot Penny the Pig.

![Penny's Path](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

## ✨ Features

### 🎭 Multiple Coaching Personas
- **Supportive Coach**: Empathetic, strengths-based guidance with actionable steps
- **Data-Driven Mentor**: Evidence-based insights on competencies and career progression  
- **Tough-Love PM**: Direct, decisive guidance that pushes for clarity and decisions
- **Compliance Sherpa**: Policy-aware, risk-mitigating guidance for workplace navigation

### 💬 Advanced Chat Features
- **Streaming responses** with real-time text generation
- **File attachments** (PDF, Markdown, Text) for context
- **Message actions**: Copy, regenerate, delete messages
- **Export conversations** to JSON or Markdown
- **Responsive design** with mobile-friendly interface

### 🎤 Voice Mode (Optional)
- **WebRTC integration** with OpenAI Realtime API for low-latency conversations
- **Fallback to Web Speech API** for broader browser compatibility
- **Audio visualization** with real-time volume meters
- **Voice activity detection** and transcript display

### ⚙️ Customizable Settings
- **Model selection** (GPT-4o, GPT-4o Mini, GPT-4 Turbo)
- **Temperature control** for response creativity
- **Token limits** for response length
- **Custom system prompts** for persona fine-tuning per session

### 🔒 Security & Performance
- **Rate limiting** with in-memory or Redis-based storage
- **CORS protection** with configurable origins
- **Edge runtime** for streaming chat responses
- **Server-side API key management** (never exposed to client)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or pnpm
- OpenAI API key
- (Optional) Upstash Redis for production rate limiting

### 1. Clone and Install

```bash
git clone <repository-url>
cd pennys-path
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional - for voice mode
OPENAI_REALTIMES_MODEL=gpt-4o-realtime-preview

# Optional - for local development CORS
ALLOWED_ORIGIN=http://localhost:3000

# Optional - for production rate limiting
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

### 3. Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting with Penny!

### 4. Production Build

```bash
pnpm build
pnpm start
```

## 🌐 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/pennys-path&env=OPENAI_API_KEY&envDescription=OpenAI%20API%20key%20is%20required%20for%20AI%20functionality)

### Manual Deploy

1. **Push to GitHub** (or your preferred Git provider)

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables**:
   - Add your `OPENAI_API_KEY` (required)
   - Optionally add other environment variables

4. **Deploy**: Vercel will automatically build and deploy your app

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | Your OpenAI API key |
| `OPENAI_REALTIMES_MODEL` | ❌ | Model for voice mode (default: `gpt-4o-realtime-preview`) |
| `ALLOWED_ORIGIN` | ❌ | CORS origin restriction (leave empty for same-origin) |
| `UPSTASH_REDIS_REST_URL` | ❌ | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | Upstash Redis token for rate limiting |
| `NEXT_PUBLIC_APP_URL` | ❌ | Your app's public URL for metadata |

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand with persistence
- **API Integration**: OpenAI SDK with streaming
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── chat/          # Streaming chat endpoint (Edge)
│   │   ├── realtime-token/ # Voice session tokens (Node)
│   │   └── speech/        # Text-to-speech fallback (Node)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── icons/            # Custom icons (Penny mascot)
│   ├── ui/               # shadcn/ui components
│   ├── Chat.tsx          # Main chat interface
│   ├── PersonaPicker.tsx # Persona selection
│   ├── VoiceControls.tsx # Voice mode interface
│   └── SettingsSheet.tsx # Settings panel
└── lib/                  # Utilities and configuration
    ├── openai.ts         # OpenAI integration
    ├── personas.ts       # Coaching persona definitions
    ├── rate-limit.ts     # Rate limiting utilities
    ├── stream.ts         # Server-sent events
    ├── store.ts          # Zustand state management
    ├── markdown.ts       # Markdown processing
    └── utils.ts          # Helper functions
```

### API Endpoints

| Endpoint | Runtime | Purpose |
|----------|---------|---------|
| `/api/chat` | Edge | Streaming chat responses |
| `/api/realtime-token` | Node | WebRTC session tokens |
| `/api/speech` | Node | Text-to-speech generation |

## 🎭 Persona System

Each persona has a unique coaching style with customized:

- **System prompts** tailored to coaching methodology
- **Temperature settings** for response creativity
- **Token limits** for response length
- **Visual themes** with distinctive colors and icons

### Adding New Personas

1. **Define the persona** in `src/lib/personas.ts`:

```typescript
{
  id: "new-coach",
  name: "New Coach Style",
  description: "Description of the coaching approach",
  icon: "🎯",
  color: "bg-blue-500 text-white",
  temperature: 0.7,
  maxTokens: 800,
  systemPrompt: `Your detailed system prompt here...`
}
```

2. **Update persona picker** styling in `PersonaPicker.tsx` if needed

## 🎤 Voice Mode

### WebRTC Realtime (Preferred)
- Low-latency audio streaming
- Real-time transcription and synthesis
- Requires OpenAI Realtime API access

### Web Speech API (Fallback)
- Browser-native speech recognition
- Server-side text-to-speech via OpenAI
- Broader browser compatibility

### Browser Support
- **Chrome/Edge**: Full WebRTC + Speech API support
- **Firefox**: Speech API support (limited WebRTC)
- **Safari**: Limited support (fallback recommended)

## 🛡️ Security Features

### Rate Limiting
- **Development**: In-memory token bucket algorithm
- **Production**: Upstash Redis with sliding window
- **Configurable limits**: Per endpoint (chat, voice, files)

### API Security
- Server-side API key management
- CORS protection with origin validation
- Request validation and sanitization
- File upload restrictions (type, size)

### Privacy
- No client-side API key exposure
- Optional conversation persistence
- Configurable data retention

## 🔧 Customization

### Theme Colors
Edit `tailwind.config.ts` to customize the color palette:

```typescript
colors: {
  brand: "#E35C4A",      // Primary accent color
  ink: "#2C2C2C",        // Text color
  sand: "#F7F4F2",       // Background color
  stone: "#EDEAE7",      // Card/surface color
}
```

### Penny Mascot
Customize the mascot in `src/components/icons/PennyMark.tsx` or replace with your own SVG.

## 📝 Development

### Adding Features

1. **New API endpoints**: Add to `src/app/api/`
2. **UI components**: Add to `src/components/`
3. **State management**: Extend `src/lib/store.ts`
4. **Utilities**: Add to `src/lib/`

### Testing Locally

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start

# Lint code
pnpm lint
```

## 🐛 Troubleshooting

### Common Issues

#### API Key Not Working
- Verify your OpenAI API key is correct
- Check that the key has sufficient credits
- Ensure the key is set in environment variables

#### Voice Mode Not Working
- Check browser console for errors
- Verify microphone permissions
- Try the fallback Web Speech API mode

#### Streaming Responses Slow
- Check your internet connection
- Try switching to a different OpenAI model
- Verify Vercel edge function deployment

#### Rate Limits Hit
- Check rate limit configuration
- Consider upgrading to Upstash Redis for production
- Monitor usage patterns

### Environment Debugging

```bash
# Check environment variables
echo $OPENAI_API_KEY

# Test API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI** for the powerful language models and APIs
- **Vercel** for the hosting platform and Next.js framework
- **shadcn/ui** for the beautiful component library
- **Tailwind CSS** for the utility-first styling approach
- **The Penny Community** for inspiring this career coaching platform

---

Made with ❤️ and 🐷 by the Penny's Path team
