import { cookies } from "next/headers";

const COOKIE = "crm_session";
const VALUE = "demo-user";

export async function loginCookie() {
  (await cookies()).set(COOKIE, VALUE, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function logoutCookie() {
  (await cookies()).delete(COOKIE);
}

export async function isAuthed() {
  return (await cookies()).get(COOKIE)?.value === VALUE;
}
