import type {
  LanguageModelV1CallOptions,
  LanguageModelV1Message,
  LanguageModelV1ImagePart,
  LanguageModelV1ToolResultPart,
} from '@ai-sdk/provider';
import type { Content, Part } from '@google/genai';

export interface GeminiPromptResult {
  contents: Content[];
  systemInstruction?: Content;
}

/**
 * Maps Vercel AI SDK messages to Gemini format
 */
export function mapPromptToGeminiFormat(
  options: LanguageModelV1CallOptions
): GeminiPromptResult {
  let messages = options.prompt;
  const contents: Content[] = [];
  let systemInstruction: Content | undefined;
  
  // If in object-json mode, enhance the last user message with schema information
  if (options.mode?.type === 'object-json' && options.mode.schema && messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user' && Array.isArray(lastMessage.content)) {
      const schemaPrompt = `\n\nYou must respond with a JSON object that exactly matches this schema:\n${JSON.stringify(options.mode.schema, null, 2)}\n\nIMPORTANT: Use the exact field names from the schema. Do not add extra fields.`;
      
      // Clone the messages array and modify the last message
      messages = [...messages];
      const lastContent = [...lastMessage.content];
      
      // Find the last text content and append to it
      for (let i = lastContent.length - 1; i >= 0; i--) {
        const content = lastContent[i];
        if (content.type === 'text') {
          lastContent[i] = {
            ...content,
            text: content.text + schemaPrompt
          };
          break;
        }
      }
      
      messages[messages.length - 1] = {
        ...lastMessage,
        content: lastContent
      };
    }
  }

  for (const message of messages) {
    switch (message.role) {
      case 'system':
        // Gemini uses a separate systemInstruction field
        systemInstruction = {
          role: 'user',
          parts: [{ text: message.content }],
        };
        break;

      case 'user':
        contents.push(mapUserMessage(message));
        break;

      case 'assistant':
        contents.push(mapAssistantMessage(message));
        break;

      case 'tool':
        // Tool results are typically merged with the previous assistant message
        // For now, we'll add them as a user message
        contents.push({
          role: 'user',
          parts: message.content.map((part: LanguageModelV1ToolResultPart) => mapToolResultPart(part)),
        });
        break;
    }
  }

  return { contents, systemInstruction };
}

/**
 * Maps a user message to Gemini format
 */
function mapUserMessage(message: LanguageModelV1Message & { role: 'user' }): Content {
  const parts: Part[] = [];

  for (const part of message.content) {
    switch (part.type) {
      case 'text':
        parts.push({ text: part.text });
        break;

      case 'image':
        parts.push(mapImagePart(part));
        break;
    }
  }

  return { role: 'user', parts };
}

/**
 * Maps an assistant message to Gemini format
 */
function mapAssistantMessage(message: LanguageModelV1Message & { role: 'assistant' }): Content {
  const parts: Part[] = [];

  for (const part of message.content) {
    switch (part.type) {
      case 'text':
        parts.push({ text: part.text });
        break;

      case 'tool-call':
        parts.push({
          functionCall: {
            name: part.toolName,
            args: (part.args || {}) as Record<string, unknown>,
          },
        });
        break;
    }
  }

  return { role: 'model', parts };
}

/**
 * Maps an image part to Gemini format
 */
function mapImagePart(part: LanguageModelV1ImagePart): Part {
  if (part.image instanceof URL) {
    throw new Error('URL images are not supported by Gemini CLI Core. Please provide base64-encoded image data.');
  }

  // Extract mime type and base64 data
  const mimeType = part.mimeType || 'image/jpeg';
  let base64Data: string;

  if (typeof part.image === 'string') {
    // Already base64 encoded
    base64Data = part.image;
  } else if (part.image instanceof Uint8Array) {
    // Convert Uint8Array to base64
    base64Data = Buffer.from(part.image).toString('base64');
  } else {
    throw new Error('Unsupported image format');
  }

  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}

/**
 * Maps a tool result part to Gemini format
 */
function mapToolResultPart(part: LanguageModelV1ToolResultPart): Part {
  return {
    functionResponse: {
      name: part.toolName,
      response: part.result as Record<string, unknown>,
    },
  };
}