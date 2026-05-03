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

  // Helper to decode JWT payload in edge runtime
  const getRoleFromToken = (tokenStr: string) => {
    try {
      const payloadBase64 = tokenStr.split('.')[1];
      if (!payloadBase64) return null;
      const decodedPayload = atob(payloadBase64);
      const payloadObj = JSON.parse(decodedPayload);
      return payloadObj.role;
    } catch (e) {
      return null;
    }
  };

  const role = token ? getRoleFromToken(token) : null;

  // If we have a token and trying to access auth pages, redirect to appropriate page based on role
  if (token && isAuthPage) {
    if (role === 'user') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/savings-report', request.url));
  }

  // If we don't have a token and trying to access protected pages, redirect to login
  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based access control for "user" role
  if (token && role === 'user' && isProtectedPage) {
    const allowedForUser = ['/dashboard', '/room-availability', '/lighting-ac', '/profile'];
    const isAllowed = allowedForUser.some(route => pathname.startsWith(route));
    
    if (!isAllowed) {
      // Redirect users away from admin-only pages
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
