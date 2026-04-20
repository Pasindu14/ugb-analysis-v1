import { auth } from '@/auth'
import { UnauthorizedError } from '@/lib/errors'

/**
 * Get current authenticated user's JWT token.
 * Throws UnauthorizedError if not authenticated.
 * 
 * @example
 * const token = await getAuthToken()

/**
 * Get current authenticated user with company info.
 * Throws UnauthorizedError if not authenticated.
 * 
 * @example
 * const { userId, companyId, role } = await getAuthUser()
 */
export async function getAuthUser() {
  const session = await auth()
  
  if (!session?.user) {
    throw new UnauthorizedError('Not authenticated')
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    companyId: session.user.companyId,
  }
}

/**
 * Get current authenticated user, returns null if not authenticated.
 * Use when auth is optional.
 * 
 * @example
 * const auth = await getAuthUserOrNull()
 * if (auth) {
 *   // User is logged in
 * }
 */
export async function getAuthUserOrNull() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  return {
    userId: session.user.id,
    role: session.user.role,
  }
}
