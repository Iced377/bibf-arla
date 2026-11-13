// Password gate for the course site (Vercel Routing Middleware).
// Participants sign in with SITE_USER / SITE_PASSWORD and see everything except /instructor/.
// The instructor signs in with INSTRUCTOR_USER / INSTRUCTOR_PASSWORD, which opens every page.
// All four come from the Vercel project's environment variables. Returning nothing lets the request through.

export const config = { matcher: "/:path*" };

function credentials(request) {
  const [scheme, encoded] = (request.headers.get("authorization") || "").split(" ");
  if (scheme !== "Basic" || !encoded) return null;
  const decoded = atob(encoded);
  const i = decoded.indexOf(":");
  return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
}

export default function middleware(request) {
  const siteUser = process.env.SITE_USER || "student";
  const sitePass = process.env.SITE_PASSWORD;
  const instrUser = process.env.INSTRUCTOR_USER || "abed";
  const instrPass = process.env.INSTRUCTOR_PASSWORD;
  if (!sitePass) return new Response("Site password is not configured.", { status: 503 });

  const path = new URL(request.url).pathname;
  const instructorArea = path === "/instructor" || path.startsWith("/instructor/");
  if (instructorArea && !instrPass) return new Response("Instructor password is not configured.", { status: 503 });

  const c = credentials(request);
  const isInstructor = !!(c && instrPass && c.user === instrUser && c.pass === instrPass);
  const isParticipant = !!(c && c.user === siteUser && c.pass === sitePass);

  if (isInstructor || (isParticipant && !instructorArea)) {
    if (path === "/instructor") return Response.redirect(new URL("/instructor/", request.url), 308);
    return;
  }
  return new Response(instructorArea ? "Please sign in with the instructor login." : "Please sign in to the course.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI Prompt Engineering", charset="UTF-8"' },
  });
}
