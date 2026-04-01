import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ market_id: string }> }
) {
  const { market_id } = await params;
  try {
    const result = await pool.query(
      `SELECT CAST(prob AS float) AS prob, recorded_at
       FROM market_prob_history
       WHERE market_id = $1
       ORDER BY recorded_at ASC`,
      [market_id]
    );
    return NextResponse.json({ rows: result.rows });
  } catch {
    return NextResponse.json({ rows: [] });
  }
}
