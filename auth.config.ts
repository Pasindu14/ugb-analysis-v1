import type { NextAuthConfig } from "next-auth"

export default {
  providers: [],
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const path = nextUrl.pathname

      const publicPaths = ["/sign-in", "/login"]
      const isPublic = publicPaths.includes(path)

      // Root always redirects — authenticated users go to the app, guests go to sign-in
      if (path === "/") {
        if (isLoggedIn) return Response.redirect(new URL("/sales/map", nextUrl))
        return Response.redirect(new URL("/sign-in", nextUrl))
      }

      if (isPublic) {
        // Send authenticated users away from auth pages
        if (isLoggedIn) return Response.redirect(new URL("/sales/map", nextUrl))
        return true
      }

      // All other routes require authentication
      if (!isLoggedIn) {
        return Response.redirect(new URL("/sign-in", nextUrl))
      }

      // /sales (table/import) is admin-only; redirect regular users to the map
      const isSalesAdminRoute =
        path === "/sales" || (path.startsWith("/sales/") && !path.startsWith("/sales/map"))
      if (isSalesAdminRoute) {
        const role = auth?.user?.role
        const isAdmin = role !== "employee"
        if (!isAdmin) {
          return Response.redirect(new URL("/sales/map", nextUrl))
        }
      }

      return true
    },
      async jwt({ token, user }) {
        // On sign in, add user data to token
        if (user) {
              token.id = user.id
              token.role = user.role
              token.name = user.name
              token.email = user.email
              token.companyId = user.companyId
            }

        return token
      },
      async session({ session, token }) {
        // Ensure token data exists before assigning
        if (token) {
              session.user.id = token.id as string
              session.user.role = token.role as string
              session.user.name = (token.name as string) ?? null
              session.user.email = token.email as string
              session.user.companyId = token.companyId as number
            }
      return session
    },
  },
} satisfies NextAuthConfig