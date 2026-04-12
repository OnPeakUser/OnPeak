import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_NAME } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  // --- Validation ---
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  try {
    // --- Look up the user by email ---
    const result = await pool.query(
      "SELECT user_id, username, email, password, cash_balance FROM profile WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal whether the email exists
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // --- Compare the submitted password against the stored hash ---
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // --- Success — set httpOnly session cookie and return safe user info ---
    const token = signToken({ user_id: user.user_id, username: user.username });
    const response = NextResponse.json({
      success: true,
      user: {
        user_id:       user.user_id,
        username:      user.username,
        email:         user.email,
        cash_balance:  user.cash_balance,
      },
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      path:     "/",
      maxAge:   60 * 60 * 24 * 7, // 7 days
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
