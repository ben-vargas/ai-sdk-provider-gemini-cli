import type {
  LanguageModelV2CallOptions,
  LanguageModelV2FilePart,
  LanguageModelV2Message,
} from '@ai-sdk/provider';
import type { Content, Part } from '@google/genai';

export interface GeminiPromptResult {
  contents: Content[];
  systemInstruction?: Content;
}

/**
 * Maps Vercel AI SDK messages to Gemini format
 *
 * Note: Schema is now passed directly via responseJsonSchema in the generation config,
 * so we no longer inject schema instructions into the prompt.
 */
export function mapPromptToGeminiFormat(
  options: LanguageModelV2CallOptions
): GeminiPromptResult {
  const messages = options.prompt;
  const contents: Content[] = [];
  let systemInstruction: Content | undefined;

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

      case 'tool': {
        // Tool results in v5 are part of tool messages
        const parts: Part[] = [];
        for (const part of message.content) {
          if (part.type === 'tool-result') {
            parts.push({
              functionResponse: {
                name: part.toolName,
                response: (typeof part.output === 'string'
                  ? { result: part.output }
                  : part.output) as Record<string, unknown>,
              },
            });
          }
        }
        contents.push({
          role: 'user',
          parts,
        });
        break;
      }
    }
  }

  return { contents, systemInstruction };
}

/**
 * Maps a user message to Gemini format
 */
function mapUserMessage(
  message: LanguageModelV2Message & { role: 'user' }
): Content {
  const parts: Part[] = [];

  for (const part of message.content) {
    switch (part.type) {
      case 'text':
        parts.push({ text: part.text });
        break;

      case 'file': {
        // Handle file parts (images, etc.)
        const mediaType = part.mediaType || 'application/octet-stream';
        if (mediaType.startsWith('image/')) {
          parts.push(mapImagePart(part));
        } else {
          throw new Error(`Unsupported file type: ${mediaType}`);
        }
        break;
      }
    }
  }

  return { role: 'user', parts };
}

/**
 * Maps an assistant message to Gemini format
 */
function mapAssistantMessage(
  message: LanguageModelV2Message & { role: 'assistant' }
): Content {
  const parts: Part[] = [];

  for (const part of message.content) {
    switch (part.type) {
      case 'text':
        parts.push({ text: part.text });
        break;

      case 'tool-call':
        // In v5, tool calls have input as an object already
        parts.push({
          functionCall: {
            name: part.toolName,
            args: (part.input || {}) as Record<string, unknown>,
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
function mapImagePart(part: LanguageModelV2FilePart): Part {
  if (part.data instanceof URL) {
    throw new Error(
      'URL images are not supported by Gemini CLI Core. Please provide base64-encoded image data.'
    );
  }

  // Extract mime type and base64 data
  const mimeType = part.mediaType || 'image/jpeg';
  let base64Data: string;

  if (typeof part.data === 'string') {
    // Already base64 encoded
    base64Data = part.data;
  } else if (part.data instanceof Uint8Array) {
    // Convert Uint8Array to base64
    base64Data = Buffer.from(part.data).toString('base64');
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
