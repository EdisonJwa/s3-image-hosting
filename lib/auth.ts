import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

const keycloakIssuer = process.env.KEYCLOAK_ISSUER;
if (!keycloakIssuer) {
  throw new Error("KEYCLOAK_ISSUER environment variable is required");
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.SECRET,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL,
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
          clientId: process.env.KEYCLOAK_ID || "",
          clientSecret: process.env.KEYCLOAK_SECRET || "",
          discoveryUrl: `${keycloakIssuer}/.well-known/openid-configuration`,
          scopes: ["openid", "profile", "email"],
        },
      ],
    }),
  ],
});
