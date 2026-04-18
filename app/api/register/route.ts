import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

function getIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Rate limit by IP: 5 registrations per hour.
  const ip = getIP(req);
  const byIP = checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
  if (!byIP.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(byIP.retryAfter) } }
    );
  }

  const { username, email, password } = await req.json();

  // --- Validation ---
  if (!username || !email || !password) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }
  if (username.length > 16) {
    return NextResponse.json(
      { error: "Username must be 16 characters or fewer." },
      { status: 400 }
    );
  }

  try {
    // --- Check if email is already taken ---
    const existing = await pool.query(
      "SELECT user_id FROM profile WHERE email = $1",
      [email]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    // --- Hash the password (never store plain text passwords) ---
    // bcrypt turns "mypassword" into a scrambled string like "$2b$10$..."
    const hashedPassword = await bcrypt.hash(password, 12);

    // --- Insert the new user into the profile table ---
    await pool.query(
      `INSERT INTO profile (user_id, username, email, password, cash_balance, timestamp_created)
       VALUES (gen_random_uuid(), $1, $2, $3, 10000, NOW())`,
      [username, email, hashedPassword]
    );

    await resend.emails.send({
      from: "OnPeak <hello@onpeakmarket.com>",
      replyTo: "onpeakmarket@protonmail.com",
      to: email,
      subject: "Welcome to OnPeak — we read every reply.",
      text: `Thanks for signing up.\n\nWe read and respond to every email — reply with anything on your mind, whether it's feedback, questions, or features you'd want to see.\n\nOnPeak is building the first retail venue for power market trading. Traditional power trading requires millions of dollars in capital, access to big investment banks, and regulatory licensing — effectively closed off for anyone who's not rich or working at an energy trading firm. Our goal is to change that.\n\nThe product is early. Your feedback directly shapes where it goes.\n\nOnPeak`,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
