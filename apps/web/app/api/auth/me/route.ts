import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/authorization";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role, // Authoritatively resolved server-side
      department: user.department,
      studentId: user.studentId,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    },
  });
}
