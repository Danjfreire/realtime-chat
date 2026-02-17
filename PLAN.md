# Realtime Chat with AI - Project Plan

## Project Description

A realtime chat application where users can converse with an AI assistant. When the AI responds, the response is automatically converted to speech using ElevenLabs' Flash 2.5 model and streamed to the client for real-time audio playback.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Angular       │────▶│   Bun API       │────▶│   OpenRouter    │
│   Client        │◀────│   Server        │◀────│   (LLM)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │  WebSocket            │
        │  (Audio Stream)       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Browser       │     │   ElevenLabs    │
│   Audio Player  │     │   (TTS)         │
└─────────────────┘     └─────────────────┘
```

### Technology Stack
- **Frontend**: Angular 21 with standalone components
- **Backend**: Bun HTTP server
- **AI**: OpenRouter API (fast model selection)
- **TTS**: ElevenLabs WebSocket API (Flash 2.5 model)
- **Communication**: HTTP for messages, WebSocket for audio streaming

### Security
- API keys stored only on backend (environment variables)
- Client never sees OpenRouter or ElevenLabs keys
- No authentication (toy project)

## Implementation Tasks

### Phase 1: Backend Setup

- [ ] **1.1** Set up environment variables for API keys (`.env` file)
  - [ ] Add `OPENROUTER_API_KEY` to api package
  - [ ] Add `ELEVENLABS_API_KEY` to api package

- [ ] **1.2** Create API endpoints in `packages/api/index.ts`
  - [ ] POST `/api/chat` - Send user message, receive AI response
  - [ ] WebSocket `/ws/audio` - Stream TTS audio to client

- [ ] **1.3** Implement OpenRouter integration
  - [ ] Create function to call OpenRouter API
  - [ ] Select fast model (e.g., Qwen Q3, DeepSeek V3)
  - [ ] Handle streaming response from LLM

- [ ] **1.4** Implement ElevenLabs WebSocket integration
  - [ ] Set up WebSocket connection to ElevenLabs
  - [ ] Send text for TTS conversion
  - [ ] Stream audio chunks back to client

### Phase 2: Frontend Setup

- [ ] **2.1** Create chat UI components
  - [ ] Message list component (display user/AI messages)
  - [ ] Message input component (text input + send button)
  - [ ] Audio status indicator (showing when AI is speaking)

- [ ] **2.2** Implement chat service
  - [ ] Service to handle HTTP requests to backend
  - [ ] State management for messages array

- [ ] **2.3** Implement WebSocket client for audio
  - [ ] Connect to `/ws/audio` endpoint
  - [ ] Receive audio chunks
  - [ ] Play audio chunks progressively in browser

- [ ] **2.4** Add loading states
  - [ ] Show "AI is thinking..." while generating response
  - [ ] Show "Generating speech..." during TTS
  - [ ] Show audio playback indicator

### Phase 3: Integration & Polish

- [ ] **3.1** Connect frontend to backend
  - [ ] Send user message to `/api/chat`
  - [ ] Display AI response in chat
  - [ ] Trigger TTS automatically after response

- [ ] **3.2** Handle edge cases
  - [ ] Handle API errors gracefully
  - [ ] Handle WebSocket disconnection/reconnection
  - [ ] Cancel previous audio when new message arrives

- [ ] **3.3** Basic styling
  - [ ] Chat message bubbles (user vs AI)
  - [ ] Input area at bottom
  - [ ] Responsive layout

### Phase 4: Testing & Refinement

- [ ] **4.1** Test end-to-end flow
  - [ ] Send message → Get AI response → Hear audio

- [ ] **4.2** Optimize latency
  - [ ] Test different LLM models for speed
  - [ ] Tune audio chunk size

- [ ] **4.3** Code cleanup
  - [ ] Remove debug logs
  - [ ] Add error handling UI
  - [ ] Ensure TypeScript strict mode compliance

## API Specification

### POST /api/chat
**Request:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "response": "Hello! I'm doing great, thank you for asking!",
  "done": true
}
```

### WebSocket /ws/audio
**Client sends:**
```json
{
  "text": "Hello! I'm doing great, thank you for asking!"
}
```

**Server streams:**
- Raw audio chunks (PCM/MP3) sent progressively

## Environment Variables

Create `packages/api/.env`:
```
OPENROUTER_API_KEY=your_openrouter_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

## File Structure Changes

```
packages/
├── api/
│   ├── index.ts        # Main server (update)
│   ├── .env           # API keys (create)
│   ├── chat.ts        # OpenRouter logic (create)
│   └── tts.ts         # ElevenLabs WebSocket (create)
│
└── client/
    └── src/app/
        ├── services/
        │   ├── chat.service.ts    # HTTP chat service (create)
        │   └── audio.service.ts   # WebSocket audio service (create)
        ├── components/
        │   ├── chat/              # Chat component (create)
        │   └── message/           # Message component (create)
        └── app.ts                 # Update to use chat
```

## Notes

- ElevenLabs Flash 2.5 is their fastest model - ideal for realtime
- OpenRouter provides access to many models - we'll start with a fast one like Qwen
- Audio will play chunk-by-chunk for minimal latency
- In-memory message storage (no database needed)
