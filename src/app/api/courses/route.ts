import { NextResponse } from "next/server";
import { getSessionCookies } from "@/lib/auth";
import { upstreamFetch } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/courses
 *
 * The upstream `fetchcoursesforcomplaints` payload includes the student's
 * portal PIN alongside the course rows. That payload is only ever used here to
 * build <option>s, so this route returns just the fields the UI needs and keeps
 * the PIN on the server.
 */
export async function GET() {
  const cookies = await getSessionCookies();
  if (!cookies.sts_session) {
    return NextResponse.json({ unauthenticated: true }, { status: 401 });
  }

  let res: Response;
  try {
    res = await upstreamFetch("/fetchcoursesforcomplaints", { cookies });
  } catch {
    return NextResponse.json({ message: "Could not reach STS" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ message: "STS request failed" }, { status: 502 });
  }

  const data = (await res.json().catch(() => null)) as {
    data?: Record<string, unknown>[];
  } | null;

  const courses = (data?.data ?? [])
    .filter((row) => row.course_code)
    .map((row) => ({
      course_code: String(row.course_code),
      course_title: String(row.course_title ?? ""),
    }));

  return NextResponse.json({ data: courses });
}
