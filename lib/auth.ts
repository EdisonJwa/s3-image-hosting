import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

const keycloakIssuer = process.env.KEYCLOAK_ISSUER;
if (!keycloakIssuer) {
  throw new Error("KEYCLOAK_ISSUER environment variable is required");
}

const keycloakId = process.env.KEYCLOAK_ID;
if (!keycloakId) {
  throw new Error("KEYCLOAK_ID environment variable is required");
}

const keycloakSecret = process.env.KEYCLOAK_SECRET;
if (!keycloakSecret) {
  throw new Error("KEYCLOAK_SECRET environment variable is required");
}

const secret = process.env.BETTER_AUTH_SECRET || process.env.SECRET;
if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long");
}

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
if (!baseURL) {
  throw new Error("NEXT_PUBLIC_BASE_URL environment variable is required");
}

export const auth = betterAuth({
  secret,
  baseURL,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (matching NextAuth config)
    updateAge: 60 * 60 * 24, // 24 hours (matching NextAuth config)
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
          clientId: keycloakId,
          clientSecret: keycloakSecret,
          discoveryUrl: `${keycloakIssuer}/.well-known/openid-configuration`,
          scopes: ["openid", "profile", "email"],
        },
      ],
    }),
  ],
});
