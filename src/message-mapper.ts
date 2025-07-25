import type {
  LanguageModelV2CallOptions,
  LanguageModelV2Message,
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
  options: LanguageModelV2CallOptions
): GeminiPromptResult {
  let messages = options.prompt;
  const contents: Content[] = [];
  let systemInstruction: Content | undefined;

  // If in json response format, enhance the last user message with schema information
  if (
    options.responseFormat?.type === 'json' &&
    options.responseFormat.schema &&
    messages.length > 0
  ) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user' && Array.isArray(lastMessage.content)) {
      const schemaPrompt = `\n\nYou must respond with a JSON object that exactly matches this schema:\n${JSON.stringify(options.responseFormat.schema, null, 2)}\n\nIMPORTANT: Use the exact field names from the schema. Do not add extra fields.`;

      // Clone the messages array and modify the last message
      messages = [...messages];
      const lastContent = [...lastMessage.content];

      // Find the last text content and append to it
      for (let i = lastContent.length - 1; i >= 0; i--) {
        const content = lastContent[i];
        if (content.type === 'text') {
          lastContent[i] = {
            ...content,
            text: content.text + schemaPrompt,
          };
          break;
        }
      }

      messages[messages.length - 1] = {
        ...lastMessage,
        content: lastContent,
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
        const filePart = part as {
          contentType?: string;
          data: string | URL | Uint8Array;
        };
        const contentType = filePart.contentType || 'application/octet-stream';
        if (contentType.startsWith('image/')) {
          parts.push(mapImagePart(filePart));
        } else {
          throw new Error(`Unsupported file type: ${contentType}`);
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
function mapImagePart(part: {
  contentType?: string;
  data: string | URL | Uint8Array;
}): Part {
  if (part.data instanceof URL) {
    throw new Error(
      'URL images are not supported by Gemini CLI Core. Please provide base64-encoded image data.'
    );
  }

  // Extract mime type and base64 data
  const mimeType = part.contentType || 'image/jpeg';
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
