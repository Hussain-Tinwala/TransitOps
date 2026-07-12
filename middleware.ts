import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    const role = token.role as string;

    // RBAC Permission Matrix
    const roleAccess: Record<string, string[]> = {
      FLEET_MANAGER: ["/dashboard", "/vehicles", "/maintenance"],
      DISPATCHER: ["/dashboard", "/trips"],
      SAFETY_OFFICER: ["/dashboard", "/drivers"],
      FINANCIAL_ANALYST: ["/dashboard", "/finances", "/reports"],
    };

    // Extract the base route (e.g., /vehicles/add -> /vehicles)
    const basePath = `/${path.split("/")[1]}`;
    
    // Check if the role has access to this base path
    if (roleAccess[role] && !roleAccess[role].includes(basePath) && path !== "/dashboard") {
         return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect all these routes via the middleware
export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/vehicles/:path*", 
    "/trips/:path*", 
    "/drivers/:path*", 
    "/maintenance/:path*", 
    "/finances/:path*", 
    "/reports/:path*"
  ],
};