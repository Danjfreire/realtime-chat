export type Emotion =
  | 'happy'
  | 'sad'
  | 'neutral'
  | 'horny'
  | 'angry'
  | 'excited'
  | 'lonely'
  | 'flirty'
  | 'confused'
  | 'worried'
  | 'surprised'
  | 'bored';

export const EMOTION_EMOJI: Record<Emotion, string> = {
  happy: '😊',
  sad: '😢',
  neutral: '😐',
  horny: '😏',
  angry: '😠',
  excited: '🤩',
  lonely: '🥺',
  flirty: '😘',
  confused: '😕',
  worried: '😟',
  surprised: '😲',
  bored: '😴',
};

export const EMOTIONS: Emotion[] = [
  'happy',
  'sad',
  'neutral',
  'horny',
  'angry',
  'excited',
  'lonely',
  'flirty',
  'confused',
  'worried',
  'surprised',
  'bored',
];

export function isValidEmotion(value: string): value is Emotion {
  return EMOTIONS.includes(value as Emotion);
}
