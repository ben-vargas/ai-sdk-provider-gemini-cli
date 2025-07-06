# @google/gemini-cli-core Authentication Options

Based on my analysis of the `@google/gemini-cli-core` package, here are the supported authentication options:

## Authentication Types

The core package supports three authentication methods, defined in the `AuthType` enum:

```typescript
export enum AuthType {
  LOGIN_WITH_GOOGLE = 'oauth-personal',
  USE_GEMINI = 'gemini-api-key',
  USE_VERTEX_AI = 'vertex-ai'
}
```

## 1. OAuth with Google Personal Account (`oauth-personal`)

- **Auth Type**: `AuthType.LOGIN_WITH_GOOGLE`
- **How it works**: Uses OAuth2 flow with Google authentication
- **Client ID**: `681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com`
- **Scopes**: 
  - `https://www.googleapis.com/auth/cloud-platform`
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
- **Credentials cached at**: `~/.gemini/oauth_creds.json`
- **No API key required** - uses OAuth tokens instead

## 2. API Key Authentication

This provider supports both AI SDK standard and Gemini-specific auth types:

### AI SDK Standard (`api-key`) - Recommended
- **Auth Type**: `'api-key'` (AI SDK compliant)
- **Environment Variable**: `GEMINI_API_KEY`
- **How it works**: Direct API key authentication with Gemini service
- **Used with**: `GoogleGenAI` client from `@google/genai` package
- **Maps to**: `AuthType.USE_GEMINI`

### Gemini-Specific (`gemini-api-key`) - Alternative
- **Auth Type**: `'gemini-api-key'` (Gemini-specific)
- **Environment Variable**: `GEMINI_API_KEY`
- **How it works**: Same as above, alternative naming
- **Maps to**: `AuthType.USE_GEMINI`

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

## Authentication Setup

### For OAuth Authentication
```bash
# Initial setup - run and follow interactive prompts
gemini

# Or change auth method inside CLI
/auth
```

### For API Key Authentication
```bash
# Get your API key from Google AI Studio
export GEMINI_API_KEY="your-api-key-here"

# Or set in .gemini/.env file
mkdir -p .gemini
echo 'GEMINI_API_KEY="your-api-key"' >> .gemini/.env
```

### For Vertex AI Authentication
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GOOGLE_GENAI_USE_VERTEXAI=true
export GEMINI_API_KEY="your-api-key"
```

## Key Points

1. **OAuth authentication** provides a seamless experience without requiring API keys
2. **API key authentication** supports both AI SDK standard (`'api-key'`) and Gemini-specific (`'gemini-api-key'`) auth types
3. **Credentials are cached** for OAuth to avoid repeated authentication
4. **The authentication type must be specified** when initializing the client
5. **Environment variables are checked** automatically based on the auth type
6. **Model selection is handled** differently for different auth types (with fallback logic for API keys)
7. **No "gemini auth login" command exists** - use `gemini` for interactive setup or `/auth` inside CLI