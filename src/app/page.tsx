import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const jar = await cookies();
  const authed = jar.get("sts_auth")?.value === "1";
  redirect(authed ? "/dashboard" : "/login");
}
