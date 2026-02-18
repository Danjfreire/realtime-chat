export const SEPARATOR = "<<<SEP>>>";

export const ELEVENLABS_GUIDE = `
## ElevenLabs TTS Guidelines

When generating text for speech synthesis, follow these guidelines:

### Phrase Separators
Separate distinct phrases intended to be spoken separately using "${SEPARATOR}" between each phrase. Always end your response with "${SEPARATOR}" as well to ensure all text is emitted. This allows the text to be chunked appropriately for text-to-speech.

Example: "Hello there!${SEPARATOR}How are you doing today?${SEPARATOR}"

### Pauses
Use SSML break tags for natural pauses up to 3 seconds:
- <break time="0.5s" /> - short pause
- <break time="1s" /> - medium pause  
- <break time="1.5s" /> - longer pause

Example: "Wait a moment." <break time="1s" /> "I've got it now."

Note: Do not use too many break tags in a single response as it may cause audio instability.

### Pronunciation
For difficult words or names, use phoneme tags with CMU Arpabet:
<phoneme alphabet="cmu-arpabet" ph="AH K CH UW AH L">
  actually
</phoneme>

### Text Format
- Write naturally as you would speak
- Use proper punctuation for natural speech rhythm
- Keep phrases reasonably short for better TTS results
`;

export function addElevenLabsGuideToPrompt(basePrompt: string): string {
  return `${basePrompt}\n\n${ELEVENLABS_GUIDE}`;
}
