import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Assuming token might be stored in a cookie for server-side auth, 
  // but since we specified localStorage in the requirements, 
  // Next.js middleware cannot read localStorage directly.
  // However, we can check for a cookie if it exists.
  // We'll protect /dashboard and all its subpaths.
  
  // NOTE: If using only localStorage, actual redirection happens client-side or we must sync localStorage to a cookie.
  // For a basic check in middleware without cookie sync, we usually let client-side handle it via useAuth hook,
  // or we set a cookie during login to let this middleware work. 
  // Let's implement a basic cookie check if available, or just let client-side handles it.
  
  const token = request.cookies.get('token')?.value;
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password');
                     
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/ruangan') ||
                          request.nextUrl.pathname.startsWith('/zona') ||
                          request.nextUrl.pathname.startsWith('/kontrol') ||
                          request.nextUrl.pathname.startsWith('/monitoring') ||
                          request.nextUrl.pathname.startsWith('/zona-konfigurasi');

  // If we have a token and trying to access auth pages, redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If we don't have a token and trying to access dashboard pages, redirect to login
  if (!token && isDashboardPage) {
    // Note: since we're using localStorage in this setup primarily, 
    // this middleware might not trigger if no token cookie is set. 
    // We will set the cookie in the login function as well so this middleware works.
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/dashboard/:path*',
    '/ruangan/:path*',
    '/zona/:path*',
    '/kontrol/:path*',
    '/monitoring/:path*',
    '/zona-konfigurasi/:path*'
  ],
};
