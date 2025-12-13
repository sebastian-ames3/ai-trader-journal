import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Root middleware for authentication redirects
 *
 * - Refreshes Supabase session on every request
 * - Redirects unauthenticated users to /login
 * - Redirects authenticated users away from /login
 */
export async function middleware(request: NextRequest) {
  const { response, supabase } = await updateSession(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/offline',
    '/api/auth',
    '/share/', // Public share links
  ]

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  )

  // Static assets and API routes that should pass through
  const isStaticOrApi =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // Static files like .png, .ico, etc.

  // Allow API routes and static assets through (except protected API routes handled elsewhere)
  if (isStaticOrApi && !pathname.startsWith('/api/auth')) {
    return response
  }

  // Redirect authenticated users away from login page
  if (user && pathname === '/login') {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect unauthenticated users to login (except public routes)
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    // Preserve the intended destination
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
