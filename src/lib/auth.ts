import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET || 'technext-super-secret-key-2026';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export async function createSession(userId: string, role: string, name: string, email?: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await new SignJWT({ userId, role, name, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export function isTestSession(session: any): boolean {
  if (!session) return false;
  const email = (session.email || "").toString().toLowerCase().trim();
  const name = (session.name || "").toString().toLowerCase().trim();
  const userId = (session.userId || "").toString().trim();
  return (
    email === "test@technext" ||
    email.startsWith("test@technext") ||
    name === "test" ||
    userId === "cmw2z6xpa0001y5xm4g9lp30w"
  );
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
