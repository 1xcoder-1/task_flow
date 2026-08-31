import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/api/webhook(.*)", "/api/inngest(.*)", "/x/inngest(.*)", "/.netlify/functions/inngest(.*)", "/.redwood/functions/inngest(.*)", "/sign-in(.*)", "/sign-up(.*)", "/not-invited(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const authObj = await auth();
  const userId = authObj.userId;
  const orgId = authObj.orgId;
  const isPublic = isPublicRoute(req);
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/");

  // API routes must never receive an HTML redirect — return JSON errors only
  if (isApiRoute) {
    if (!isPublic && !userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Authenticated or public API route — pass through to the route handler
    return NextResponse.next();
  }

  // Page routes: redirect logged-in users away from public/auth pages
  if (userId && isPublic) {
    let path = "/select-org";

    if (orgId) {
      path = `/organization/${orgId}`;
    }

    const orgSelection = new URL(path, req.url);
    return NextResponse.redirect(orgSelection);
  }

  if (!userId && !isPublic) {
    return authObj.redirectToSignIn({ returnBackUrl: req.url });
  }

  if (userId && !orgId && req.nextUrl.pathname !== "/select-org") {
    const orgSelection = new URL("/select-org", req.url);
    return NextResponse.redirect(orgSelection);
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
