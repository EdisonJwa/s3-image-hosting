import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak({})],
  secret: process.env.SECRET,
  session: {
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
});
