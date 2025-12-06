# Migration from NextAuth to BetterAuth

This document describes the migration from NextAuth to BetterAuth that was completed for this project.

## What Changed

### Dependencies
- **Removed**: `next-auth@beta`
- **Added**: `better-auth@latest`

### File Structure Changes
- **Removed**:
  - `/auth.ts` (root-level NextAuth config)
  - `/app/api/auth/[...nextauth]/route.ts`
  - `/app/api/auth/index.ts`

- **Added**:
  - `/lib/auth.ts` (BetterAuth server configuration)
  - `/lib/auth-client.ts` (BetterAuth client configuration)
  - `/app/api/auth/[...all]/route.ts` (BetterAuth API route)

### Configuration Changes

#### Environment Variables
Updated `.env.example` with new variables:

```env
# Old (removed)
NEXTAUTH_URL=http://localhost:3000

# New (added)
KEYCLOAK_SECRET=your-keycloak-client-secret
BETTER_AUTH_SECRET=your-random-secret-key-at-least-32-chars
```

The `KEYCLOAK_ID` and `KEYCLOAK_ISSUER` variables remain the same.

### Code Changes

#### Server-Side (`/lib/auth.ts`)
BetterAuth server configuration uses the Generic OAuth plugin for Keycloak:

```typescript
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.SECRET,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "keycloak",
          clientId: process.env.KEYCLOAK_ID || "",
          clientSecret: process.env.KEYCLOAK_SECRET || "",
          discoveryUrl: `${process.env.KEYCLOAK_ISSUER}/.well-known/openid-configuration`,
          scopes: ["openid", "profile", "email"],
        },
      ],
    }),
  ],
});
```

#### Client-Side (`/lib/auth-client.ts`)
BetterAuth client exports the auth client and React hooks:

```typescript
import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  plugins: [genericOAuthClient()],
});

export const { useSession } = authClient;
```

#### React Components (`/app/page.tsx`)
Updated to use BetterAuth React hooks:

**Before:**
```typescript
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

const { data: session, status } = useSession();

// Sign in
signIn("keycloak");

// Sign out
signOut();

// Wrap with provider
<SessionProvider>
  <Component />
</SessionProvider>
```

**After:**
```typescript
import { authClient, useSession } from "../lib/auth-client";

const { data: session, isPending } = useSession();

// Sign in
await authClient.signIn.social({ 
  provider: "keycloak",
  callbackURL: window.location.origin,
});

// Sign out
await authClient.signOut();

// No provider wrapper needed
<Component />
```

#### API Routes (`/app/api/upload/route.ts`)
Updated server-side session retrieval:

**Before:**
```typescript
import { auth } from "../../../auth";

export async function POST(request: Request) {
  const session = await auth();
  // ...
}
```

**After:**
```typescript
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  // ...
}
```

## Key Differences

### Sessions
- **NextAuth**: Status-based (`"loading"`, `"authenticated"`, `"unauthenticated"`)
- **BetterAuth**: State-based with `isPending` boolean

### Authentication Flow
- **NextAuth**: Uses `signIn()` function with provider name
- **BetterAuth**: Uses `authClient.signIn.social()` with provider object

### Session Management
- **BetterAuth** supports stateless JWT sessions via cookie cache, eliminating the need for a database for basic authentication
- Session expiry and updates are configured similarly to NextAuth

### No Provider Wrapper
- BetterAuth doesn't require wrapping the app in a `SessionProvider`
- Session state is managed internally by the auth client

## Benefits of Migration

1. **Type Safety**: BetterAuth provides better TypeScript support
2. **Framework Agnostic**: Can be used with other frameworks beyond Next.js
3. **Simpler Setup**: No database required for basic authentication
4. **Modern API**: Cleaner and more intuitive API design
5. **Plugin System**: Extensible with plugins for additional features
6. **Better Performance**: Stateless sessions reduce server load

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values:
   ```bash
   cp .env.example .env.local
   ```

3. Set the required environment variables:
   - `KEYCLOAK_ID`: Your Keycloak client ID
   - `KEYCLOAK_SECRET`: Your Keycloak client secret (get this from Keycloak admin console)
   - `KEYCLOAK_ISSUER`: Your Keycloak realm URL
   - `BETTER_AUTH_SECRET`: A random secret key (at least 32 characters)
   - `NEXT_PUBLIC_BASE_URL`: Your app's base URL

4. In Keycloak, ensure the callback URL is whitelisted:
   - Callback URL: `{NEXT_PUBLIC_BASE_URL}/api/auth/callback/keycloak`

5. Run the development server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Session not persisting
- Ensure `BETTER_AUTH_SECRET` is set and consistent across deployments
- Check that cookies are enabled in the browser
- Verify the `baseURL` is correct for your environment

### Authentication callback fails
- Verify the callback URL is whitelisted in Keycloak
- Check that `KEYCLOAK_ISSUER` ends with the realm name
- Ensure `KEYCLOAK_SECRET` is correct

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Clear Next.js cache: `rm -rf .next`

## References

- [BetterAuth Documentation](https://www.better-auth.com/)
- [BetterAuth NextAuth Migration Guide](https://www.better-auth.com/docs/guides/next-auth-migration-guide)
- [BetterAuth Generic OAuth Plugin](https://www.better-auth.com/docs/plugins/generic-oauth)
- [BetterAuth Next.js Integration](https://www.better-auth.com/docs/integrations/next)
