# LanguageModelV1 doGenerate Method Implementation Summary

## Overview

The `doGenerate` method is the core non-streaming generation method that all Language Model V1 providers must implement. It's responsible for taking a standardized prompt and options, calling the underlying model API, and returning a standardized result.

## Key Interfaces and Types

### 1. LanguageModelV1 Interface

The main interface that providers must implement:

```typescript
export type LanguageModelV1 = {
  readonly specificationVersion: 'v1';
  readonly provider: string;
  readonly modelId: string;
  readonly defaultObjectGenerationMode: 'json' | 'tool' | undefined;
  readonly supportsImageUrls?: boolean;
  readonly supportsStructuredOutputs?: boolean;
  
  doGenerate(options: LanguageModelV1CallOptions): PromiseLike<{
    text?: string;
    reasoning?: string | Array<...>;
    files?: Array<{ data: string | Uint8Array; mimeType: string }>;
    toolCalls?: Array<LanguageModelV1FunctionToolCall>;
    finishReason: LanguageModelV1FinishReason;
    usage: { promptTokens: number; completionTokens: number };
    rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
    rawResponse?: { headers?: Record<string, string>; body?: unknown };
    request?: { body?: string };
    response?: { id?: string; timestamp?: Date; modelId?: string };
    warnings?: LanguageModelV1CallWarning[];
    providerMetadata?: LanguageModelV1ProviderMetadata;
    sources?: LanguageModelV1Source[];
    logprobs?: LanguageModelV1LogProbs;
  }>;
  
  doStream(options: LanguageModelV1CallOptions): PromiseLike<{
    stream: ReadableStream<LanguageModelV1StreamPart>;
    // ... other properties
  }>;
};
```

### 2. LanguageModelV1CallOptions

The options passed to doGenerate:

```typescript
export type LanguageModelV1CallOptions = LanguageModelV1CallSettings & {
  inputFormat: 'messages' | 'prompt';
  mode:
    | {
        type: 'regular';
        tools?: Array<LanguageModelV1FunctionTool | LanguageModelV1ProviderDefinedTool>;
        toolChoice?: LanguageModelV1ToolChoice;
      }
    | {
        type: 'object-json';
        schema?: JSONSchema7;
        name?: string;
        description?: string;
      }
    | {
        type: 'object-tool';
        tool: LanguageModelV1FunctionTool;
      };
  prompt: LanguageModelV1Prompt;
  providerMetadata?: LanguageModelV1ProviderMetadata;
};
```

### 3. LanguageModelV1CallSettings

Common generation settings:

```typescript
export type LanguageModelV1CallSettings = {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  responseFormat?: 
    | { type: 'text' }
    | { 
        type: 'json'; 
        schema?: JSONSchema7;
        name?: string;
        description?: string;
      };
  seed?: number;
  abortSignal?: AbortSignal;
  headers?: Record<string, string | undefined>;
};
```

### 4. LanguageModelV1Prompt

The standardized prompt format:

```typescript
export type LanguageModelV1Prompt = Array<LanguageModelV1Message>;

export type LanguageModelV1Message = 
  | {
      role: 'system';
      content: string;
    }
  | {
      role: 'user';
      content: Array<
        | LanguageModelV1TextPart
        | LanguageModelV1ImagePart
        | LanguageModelV1FilePart
      >;
    }
  | {
      role: 'assistant';
      content: Array<
        | LanguageModelV1TextPart
        | LanguageModelV1FilePart
        | LanguageModelV1ReasoningPart
        | LanguageModelV1RedactedReasoningPart
        | LanguageModelV1ToolCallPart
      >;
    }
  | {
      role: 'tool';
      content: Array<LanguageModelV1ToolResultPart>;
    };
```

### 5. Content Part Types

#### Text Part
```typescript
interface LanguageModelV1TextPart {
  type: 'text';
  text: string;
  providerMetadata?: LanguageModelV1ProviderMetadata;
}
```

#### Image Part
```typescript
interface LanguageModelV1ImagePart {
  type: 'image';
  image: Uint8Array | URL;
  mimeType?: string;
  providerMetadata?: LanguageModelV1ProviderMetadata;
}
```

#### Tool Call Part
```typescript
interface LanguageModelV1ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: unknown;
  providerMetadata?: LanguageModelV1ProviderMetadata;
}
```

#### Tool Result Part
```typescript
interface LanguageModelV1ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError?: boolean;
  content?: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType?: string }>;
  providerMetadata?: LanguageModelV1ProviderMetadata;
}
```

### 6. Tool-Related Types

#### Function Tool Definition
```typescript
export type LanguageModelV1FunctionTool = {
  type: 'function';
  name: string;
  description?: string;
  parameters: JSONSchema7;
};
```

#### Tool Call Result
```typescript
export type LanguageModelV1FunctionToolCall = {
  toolCallType: 'function';
  toolCallId: string;
  toolName: string;
  args: string; // Stringified JSON
};
```

#### Tool Choice
```typescript
export type LanguageModelV1ToolChoice =
  | { type: 'auto' }
  | { type: 'none' }
  | { type: 'required' }
  | { type: 'tool'; toolName: string };
```

### 7. Result Types

#### Finish Reason
```typescript
export type LanguageModelV1FinishReason =
  | 'stop'           // model generated stop sequence
  | 'length'         // model generated maximum number of tokens
  | 'content-filter' // content filter violation stopped the model
  | 'tool-calls'     // model triggered tool calls
  | 'error'          // model stopped because of an error
  | 'other'          // model stopped for other reasons
  | 'unknown';       // the model has not transmitted a finish reason
```

#### Call Warning
```typescript
export type LanguageModelV1CallWarning = 
  | {
      type: 'unsupported-setting';
      setting: 'temperature' | 'maxTokens' | 'topP' | 'topK' | 'presencePenalty' | 'frequencyPenalty' | 'stopSequences' | 'seed';
      details?: string;
    }
  | {
      type: 'other';
      message: string;
    };
```

## Implementation Pattern

Based on the Claude Code provider example, here's the typical implementation pattern:

1. **Parse and validate options**
   - Extract settings from `LanguageModelV1CallOptions`
   - Validate model parameters
   - Generate warnings for unsupported settings

2. **Convert prompt to provider format**
   - Transform `LanguageModelV1Prompt` to provider-specific format
   - Handle different message roles and content types
   - Process multimodal content (images, files)

3. **Call the underlying API**
   - Use provider SDK/API with converted prompt
   - Handle abort signals
   - Manage authentication and errors

4. **Process the response**
   - Extract text, tool calls, and other content
   - Calculate token usage
   - Determine finish reason
   - For object-json mode, extract and validate JSON

5. **Return standardized result**
   - Include all required fields (text, usage, finishReason, rawCall)
   - Add optional fields as available (toolCalls, warnings, providerMetadata)
   - Provide debugging information (rawResponse, request)

## Key Considerations

1. **Error Handling**: Use `@ai-sdk/provider` error types like `APICallError`, `NoSuchModelError`, `LoadAPIKeyError`

2. **Abort Signal**: Properly handle `options.abortSignal` for cancellation

3. **Mode Handling**: 
   - `regular`: Standard text generation with optional tools
   - `object-json`: JSON generation mode (extract JSON from response)
   - `object-tool`: Tool-based object generation

4. **Warnings**: Generate warnings for unsupported parameters or validation issues

5. **Provider Metadata**: Pass through provider-specific data that doesn't fit standard fields

6. **Raw Data**: Include raw prompt/settings in `rawCall` for debugging and observability

This summary provides the essential types and patterns needed to implement a compliant `doGenerate` method for the Vercel AI SDK Language Model V1 interface.