import { User } from "../auth.ts";

const kv = await Deno.openKv();

export default async function setUser(user: User) {
  await kv.atomic()
    .set(["users", "id", user.id], user)
    .set(["users", "username", user.username], user)
    .commit();
}
