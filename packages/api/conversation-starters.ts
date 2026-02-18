export const CONVERSATION_STARTERS = [
  "hobbies and what you enjoy doing in your free time",
  "favorite foods and cuisines you love to eat",
  "music preferences and artists you enjoy listening to",
  "travel experiences and places you'd like to visit",
  "books you've read or want to read",
  "movies and TV shows you enjoy watching",
  "sports and outdoor activities you like",
  "pets and animals, whether you have any or want any",
  "technology and gadgets you find interesting",
  "cooking and recipes you enjoy making",
  "art and creative activities like drawing or crafting",
  "nature and the outdoors, like hiking or gardening",
  "learning new skills or hobbies you've picked up",
  "games and entertainment, video games or board games",
  "fitness and wellness activities you practice",
  "photography and capturing memorable moments",
  "history and interesting facts about the past",
  "science and fascinating discoveries",
  "fashion and personal style preferences",
  "dreams and goals you have for the future",
] as const;

export type ConversationTopic = typeof CONVERSATION_STARTERS[number];

export function getRandomTopic(): ConversationTopic {
  const randomIndex = Math.floor(Math.random() * CONVERSATION_STARTERS.length);
  return CONVERSATION_STARTERS[randomIndex]!;
}
