import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

    // If they try to access an /admin route but their role is not 'admin'
    if (isAdminRoute && token?.role !== 'admin') {
      // Kick them back to the home page!
      return NextResponse.redirect(new URL('/', req.url))
    }
  },
  {
    callbacks: {
      // This requires the user to have a valid token to even trigger the middleware function above
      authorized: ({ token }) => !!token 
    }
  }
)

// This tells Next.js EXACTLY which routes to protect
export const config = {
  matcher: ["/admin/:path*"]
}