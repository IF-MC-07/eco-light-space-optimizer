import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || 
                     pathname.startsWith('/register') ||
                     pathname.startsWith('/forgot-password') ||
                     pathname.startsWith('/reset-password');
                     
  const isProtectedPage = pathname.startsWith('/admin') ||
                          pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/energy-monitor') ||
                          pathname.startsWith('/lighting-ac') ||
                          pathname.startsWith('/savings-report') ||
                          pathname.startsWith('/automation') ||
                          pathname.startsWith('/device-automation') ||
                          pathname.startsWith('/room-availability') ||
                          pathname.startsWith('/zone-configuration') ||
                          pathname.startsWith('/profile');

  // If we have a token and trying to access auth pages, redirect to admin
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/admin/savings-report', request.url));
  }

  // If we don't have a token and trying to access protected pages, redirect to login
  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
