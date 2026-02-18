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

- [x] **1.1** Set up environment variables for API keys (`.env` file)
  - [x] Add `OPENROUTER_API_KEY` to api package
  - [x] Add `ELEVENLABS_API_KEY` to api package

- [x] **1.2** Create API endpoints in `packages/api/index.ts`
  - [x] POST `/api/chat` - Send user message, receive AI response
  - [x] WebSocket `/ws/audio` - Stream TTS audio to client

- [x] **1.3** Implement OpenRouter integration
  - [x] Create function to call OpenRouter API
  - [x] Select fast model (e.g., Qwen Q3, DeepSeek V3)
  - [ ] Handle streaming response from LLM

- [x] **1.4** Implement ElevenLabs WebSocket integration
  - [x] Set up WebSocket connection to ElevenLabs
  - [x] Send text for TTS conversion
  - [x] Stream audio chunks back to client

### Phase 2: Frontend Setup

- [x] **2.1** Create chat UI components
  - [x] Message list component (display user/AI messages)
  - [x] Message input component (text input + send button)
  - [x] Audio status indicator (showing when AI is speaking)

- [x] **2.2** Implement chat service
  - [x] Service to handle HTTP requests to backend
  - [x] State management for messages array

- [x] **2.3** Implement WebSocket client for audio
  - [x] Connect to `/ws/audio` endpoint
  - [x] Receive audio chunks
  - [x] Play audio chunks progressively in browser

- [x] **2.4** Add loading states
  - [x] Show "AI is thinking..." while generating response
  - [x] Show "Generating speech..." during TTS
  - [x] Show audio playback indicator

### Phase 3: Integration & Polish

- [x] **3.1** Connect frontend to backend
  - [x] Send user message to `/api/chat`
  - [x] Display AI response in chat
  - [x] Trigger TTS automatically after response

- [x] **3.2** Handle edge cases
  - [x] Handle API errors gracefully
  - [x] Handle WebSocket disconnection/reconnection
  - [x] Cancel previous audio when new message arrives

- [x] **3.3** Basic styling
  - [x] Chat message bubbles (user vs AI)
  - [x] Input area at bottom
  - [x] Responsive layout

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
