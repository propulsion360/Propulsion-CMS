import { cookies } from 'next/headers';
import payload from 'payload';

export async function getAuthStatus() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('payload-token')?.value;

    if (!token) {
      return { isAuthenticated: false, user: null };
    }

    const user = await payload.findByID({
      collection: 'users',
      id: token,
    });

    return {
      isAuthenticated: !!user,
      user,
    };
  } catch (error) {
    return { isAuthenticated: false, user: null };
  }
} 