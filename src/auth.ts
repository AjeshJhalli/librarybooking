import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "npm:@oslojs/encoding";
import { sha256 } from "npm:@oslojs/crypto/sha2";
import { encodeHex } from "jsr:@std/encoding/hex";
import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";

const kv = await Deno.openKv();

console.log(await Array.fromAsync(kv.list({ prefix: [] })));

// const userRecord = await kv.get<User>(["users", "username", "ajeshadmin"]);

// if (userRecord.versionstamp) {
// 	await kv.atomic()
// 		.set(["users", "id", userRecord.value.id], {
// 			...userRecord.value,
// 			isAdmin: true,
// 		})
// 		.set(["users", "username", userRecord.value.username], {
// 			...userRecord.value,
// 			isAdmin: true,
// 		})
// 		.commit();
// }

// (await Array.fromAsync(kv.list({ prefix: [] }))).forEach(async (record) => {
// 	await kv.delete(record.key);
// });

export async function createUser(
	username: string,
	password: string,
): Promise<User> {
	const data = new TextEncoder().encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const passwordHash = encodeHex(hashBuffer);

	const user: User = {
		id: nanoid(),
		username,
		passwordHash,
		isAdmin: false
	};

	await kv.atomic()
		.set(["users", "id", user.id], user)
		.set(["users", "username", user.username], user)
		.commit();

	return user;
}

export async function userExists(username: string): Promise<boolean> {
	const userRecord = await kv.get<User>(["users", "username", username]);
	return Boolean(userRecord.versionstamp);
}

export async function getUser(username: string): Promise<User | null> {
	const userRecord = await kv.get<User>(["users", "username", username]);
	return userRecord.value;
}

export async function getAllUsers() {
	return (await Array.fromAsync(kv.list({ prefix: ["users", "username"] }))).map(user => user.value);
}

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(
	token: string,
	userId: string,
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session: Session = {
		id: sessionId,
		userId: userId,
		expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
	};

	await kv.set(["sessions", session.id], session);

	return session;
}

export async function validateSessionToken(
	token: string,
): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	console.log(sessionId);

	const sessionRecord = await kv.get<Session>(["sessions", sessionId]);

	if (!sessionRecord.versionstamp) {
		console.log("No timestamp");
		return { session: null, user: null };
	}

	const session = sessionRecord.value;

	if (Date.now() >= session.expiresAt) {
		console.log("Token expired");

		await kv.delete(["sessions", session.id]);
		return { session: null, user: null };
	}

	const userRecord = await kv.get<User>(["users", "id", session.userId]);

	if (!userRecord.versionstamp) {
		console.log("User not found");
		return { session: null, user: null };
	}

	const user: User = userRecord.value;

	if (Date.now() >= session.expiresAt - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
		await kv.set(["sessions", session.id], session);
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string) {
	await kv.delete(["sessions", sessionId]);
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };

export interface Session {
	id: string;
	userId: string;
	expiresAt: number;
}

export interface User {
	id: string;
	username: string;
	passwordHash: string;
	isAdmin: boolean | undefined;
}
