# @google/gemini-cli-core Authentication Options

Based on my analysis of the `@google/gemini-cli-core` package, here are the supported authentication options:

## Authentication Types

The core package supports three authentication methods, defined in the `AuthType` enum:

```typescript
export enum AuthType {
  LOGIN_WITH_GOOGLE_PERSONAL = 'oauth-personal',
  USE_GEMINI = 'gemini-api-key',
  USE_VERTEX_AI = 'vertex-ai'
}
```

## 1. OAuth with Google Personal Account (`oauth-personal`)

- **Auth Type**: `AuthType.LOGIN_WITH_GOOGLE_PERSONAL`
- **How it works**: Uses OAuth2 flow with Google authentication
- **Client ID**: `681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com`
- **Scopes**: 
  - `https://www.googleapis.com/auth/cloud-platform`
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
- **Credentials cached at**: `~/.gemini/oauth_creds.json`
- **No API key required** - uses OAuth tokens instead

## 2. Gemini API Key (`gemini-api-key`)

- **Auth Type**: `AuthType.USE_GEMINI`
- **Environment Variable**: `GEMINI_API_KEY`
- **How it works**: Direct API key authentication with Gemini service
- **Used with**: `GoogleGenAI` client from `@google/genai` package

## 3. Vertex AI (`vertex-ai`)

- **Auth Type**: `AuthType.USE_VERTEX_AI`
- **Environment Variables Required**:
  - `GOOGLE_API_KEY` - The API key for authentication
  - `GOOGLE_CLOUD_PROJECT` - The GCP project ID
  - `GOOGLE_CLOUD_LOCATION` - The GCP location/region
- **How it works**: Uses Vertex AI endpoint with API key authentication
- **Used with**: `GoogleGenAI` client with `vertexai: true` flag

## Client Initialization

The `GeminiClient` is initialized with a `Config` object that includes authentication configuration:

```typescript
// Create content generator config with auth type
const contentConfig = await createContentGeneratorConfig(
  model,
  authType,
  config
);

// Initialize the client
const geminiClient = new GeminiClient(config);
await geminiClient.initialize(contentConfig);
```

## Content Generator Configuration

The `ContentGeneratorConfig` interface includes:

```typescript
export type ContentGeneratorConfig = {
  model: string;
  apiKey?: string;
  vertexai?: boolean;
  authType?: AuthType | undefined;
};
```

## Additional Configuration

- **Proxy Support**: The client supports HTTP proxy configuration via the `proxy` parameter
- **Model Selection**: The model can be specified during initialization and changed at runtime
- **Flash Fallback**: OAuth users can fallback to Flash model when hitting rate limits

## Usage Example

```typescript
import { Config, GeminiClient, AuthType } from '@google/gemini-cli-core';

// Example with Gemini API Key
const config = new Config({
  sessionId: 'unique-session-id',
  targetDir: '/path/to/project',
  cwd: process.cwd(),
  model: 'gemini-2.0-flash-exp',
  debugMode: false
});

// Initialize with specific auth type
await config.refreshAuth(AuthType.USE_GEMINI);

// Get the client
const client = config.getGeminiClient();
```

## Key Points

1. **OAuth authentication** provides a seamless experience without requiring API keys
2. **API key authentication** supports both Gemini and Vertex AI endpoints
3. **Credentials are cached** for OAuth to avoid repeated authentication
4. **The authentication type must be specified** when initializing the client
5. **Environment variables are checked** automatically based on the auth type
6. **Model selection is handled** differently for different auth types (with fallback logic for API keys)