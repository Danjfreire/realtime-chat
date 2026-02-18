# Implementation Plan: Character Configs, Emotion Detection & UI Updates

## Overview
This plan adds character personalities, emotion detection via structured outputs, and a new UI layout with emotion display.

---

## Step 1: Backend - Character Configuration System

- [x] **1.1** Create character config file (`packages/api/characters.ts`)
  - Define `Character` interface with: `id`, `name`, `systemPrompt`, `emoji`
  - Create 3 characters:
    - **Cheerful Buddy** - Friendly, upbeat, uses emojis (😊)
    - **Sarcastic Wit** - Dry humor, snarky comebacks (😏)
    - **Gentle Listener** - Warm, empathetic, supportive (🥺)
  - Export characters array and `getCharacter(id)` helper

- [x] **1.2** Update `packages/api/chat.ts` to accept character ID
  - Modify `ChatRequest` to include optional `characterId` field
  - Update `messageHistory` to be dynamic based on selected character
  - Inject character system prompt at start of conversation

---

## Step 2: Backend - Structured Output with Emotion

- [x] **2.1** Define emotion types (`packages/api/emotions.ts`)
  - Create enum/type for emotions: `happy`, `sad`, `neutral`, `horny`, `angry`, `excited`, `lonely`, `flirty`, `confused`, `worried`, `surprised`, `bored`
  - Map each emotion to an emoji for frontend display

- [x] **2.2** Update `ChatResponse` interface
  - Add `emotion` field to response
  - Keep backward compatible with `response` (text) and `done` fields

- [x] **2.3** Update OpenRouter call to use structured output
  - Use OpenRouter's structured output format with JSON schema
  - Schema: `{ "type": "object", "properties": { "text": { "type": "string" }, "emotion": { "type": "string", "enum": [...] } } }`
  - Extract both `text` and `emotion` from response

---

## Step 3: Frontend - Service Updates

- [x] **3.1** Update `packages/client/src/app/services/chat.service.ts`
  - Add `characterId` to `ChatRequest`
  - Add `emotion` to `ChatResponse` interface

---

## Step 4: Frontend - UI Layout & Components

- [x] **4.1** Update main app layout (`packages/client/src/app/app.html`)
  - Split screen: 50% left (emotion portrait), 50% right (chat)
  - Use CSS grid or flexbox for layout
  - Add character selector dropdown/buttons at top

- [x] **4.2** Create Emotion Display component (`packages/client/src/app/components/emotion-display/`)
  - Show large emoji based on current emotion
  - Display character portrait/avatar area
  - Animate on emotion change

- [x] **4.3** Update ChatComponent
  - Import and integrate character selector
  - Show emotion indicator on AI messages
  - Pass selected character to chat service

---

## Step 5: API Route Updates

- [x] **5.1** Update `/api/chat` endpoint to accept `characterId`
  - Pass character ID to chat function
  - Return emotion in response

---

## Step 6: Testing & Polish

- [x] **6.1** Test character switching - verify system prompts change
- [x] **6.2** Test emotion detection - verify different emotions returned
- [x] **6.3** Verify UI layout at 50/50 split
- [x] **6.4** Test character + emotion combination works correctly
- [x] **6.5** Run typecheck/build to ensure no errors
