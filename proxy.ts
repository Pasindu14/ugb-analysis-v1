import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // `geo` holds public static assets (e.g. district GeoJSON) — must bypass auth
  // so it is served directly, not redirected to /sign-in.
  matcher: ["/((?!api|geo|_next/static|_next/image|favicon.ico).*)"],
};
