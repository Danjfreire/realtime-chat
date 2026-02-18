/**
 * Chat configuration - single source of truth for chat limits
 * Adjust these values to change when the chat ends
 */

/**
 * Number of user messages before the AI starts wrapping up the conversation.
 * The AI will be prompted to naturally guide the conversation towards an ending.
 */
export const WRAP_UP_THRESHOLD = 4;

/**
 * Number of user messages that triggers the final goodbye.
 * After this message, the AI will say goodbye and the chat will end.
 */
export const GOODBYE_THRESHOLD = 5;

/**
 * System prompt additions to guide the AI when wrapping up
 */
export const WRAP_UP_PROMPT =
  "The conversation has been going for a while. Start wrapping things up naturally. Don't abruptly end - just steer toward a conclusion over the next few exchanges.";

/**
 * System prompt addition for the final goodbye message
 */
export const GOODBYE_PROMPT =
  "This is the final message of our conversation. Say a warm, natural goodbye to the user. Make it feel like a real ending to a nice short chat. After this, we won't be talking anymore, so make it count!";
