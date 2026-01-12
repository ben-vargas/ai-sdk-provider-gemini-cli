import type {
  LanguageModelV3CallOptions,
  LanguageModelV3FilePart,
  LanguageModelV3Message,
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
  options: LanguageModelV3CallOptions
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
        // Tool results in v6 have typed output union
        const parts: Part[] = [];
        for (const part of message.content) {
          if (part.type === 'tool-result') {
            // Handle new ToolResultOutput union types in v6
            const output = part.output;
            let resultValue: Record<string, unknown>;

            if (output.type === 'text' || output.type === 'error-text') {
              resultValue = { result: output.value };
            } else if (output.type === 'json' || output.type === 'error-json') {
              // JSON values can be objects, arrays, strings, numbers, booleans, or null
              // Gemini expects an object, so wrap non-object values
              const jsonValue = output.value;
              if (
                jsonValue !== null &&
                typeof jsonValue === 'object' &&
                !Array.isArray(jsonValue)
              ) {
                resultValue = jsonValue as Record<string, unknown>;
              } else {
                resultValue = { result: jsonValue };
              }
            } else if (output.type === 'execution-denied') {
              resultValue = {
                result: `[Execution denied${output.reason ? `: ${output.reason}` : ''}]`,
              };
            } else if (output.type === 'content') {
              // Handle content array - extract text parts
              const textContent = output.value
                .filter(
                  (p): p is { type: 'text'; text: string } => p.type === 'text'
                )
                .map((p) => p.text)
                .join('\n');
              resultValue = { result: textContent };
            } else {
              resultValue = { result: '[Unknown output type]' };
            }

            parts.push({
              functionResponse: {
                name: part.toolName,
                response: resultValue,
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
  message: LanguageModelV3Message & { role: 'user' }
): Content {
  const parts: Part[] = [];

  for (const part of message.content) {
    switch (part.type) {
      case 'text':
        parts.push({ text: part.text });
        break;

      case 'file': {
        // Handle file parts (images, PDF, audio, video)
        const mediaType = part.mediaType || 'application/octet-stream';
        if (
          mediaType.startsWith('image/') ||
          mediaType.startsWith('audio/') ||
          mediaType.startsWith('video/') ||
          mediaType === 'application/pdf'
        ) {
          parts.push(mapFilePart(part));
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
 * Preserves thoughtSignature from providerOptions for Gemini 3 tool loop validation
 */
function mapAssistantMessage(
  message: LanguageModelV3Message & { role: 'assistant' }
): Content {
  const parts: Part[] = [];

  for (const part of message.content) {
    switch (part.type) {
      case 'text':
        parts.push({ text: part.text });
        break;

      case 'tool-call': {
        // Extract thoughtSignature from providerOptions if present
        // This is critical for Gemini 3 which requires signatures on function calls
        const providerOptions = (part as { providerOptions?: Record<string, unknown> }).providerOptions;
        const geminiCliOptions = providerOptions?.['gemini-cli'] as { thoughtSignature?: string } | undefined;
        const thoughtSignature = geminiCliOptions?.thoughtSignature;

        // Build the part with optional thoughtSignature
        const geminiPart = {
          functionCall: {
            name: part.toolName,
            args: (part.input || {}) as Record<string, unknown>,
          },
          ...(thoughtSignature ? { thoughtSignature } : {}),
        };

        parts.push(geminiPart as Part);
        break;
      }
    }
  }

  return { role: 'model', parts };
}

/**
 * Maps a file part to Gemini format
 */
function mapFilePart(part: LanguageModelV3FilePart): Part {
  if (part.data instanceof URL) {
    throw new Error(
      'URL files are not supported by Gemini CLI Core. Please provide base64-encoded data.'
    );
  }

  // Extract mime type and base64 data
  const mimeType = part.mediaType || 'application/octet-stream';
  let base64Data: string;

  if (typeof part.data === 'string') {
    // Already base64 encoded
    base64Data = part.data;
  } else if (part.data instanceof Uint8Array) {
    // Convert Uint8Array to base64
    base64Data = Buffer.from(part.data).toString('base64');
  } else {
    throw new Error('Unsupported file format');
  }

  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}
