import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isSessionPresent } from "@/lib/session";

export default async function Home() {
  const jar = await cookies();
  redirect(isSessionPresent(jar) ? "/dashboard" : "/login");
}
