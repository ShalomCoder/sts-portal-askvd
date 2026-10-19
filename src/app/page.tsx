import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isSessionPresent } from "@/lib/session";

export default async function Home() {
  const jar = await cookies();
  // Requires BOTH the auth marker and the upstream session cookie, so a stale
  // marker can't bounce a signed-out visitor to /dashboard.
  redirect(isSessionPresent(jar) ? "/dashboard" : "/login");
}
