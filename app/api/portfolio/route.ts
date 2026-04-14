import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/portfolio?user_id=...
// Returns the user's fresh cash balance, current positions, and open orders.

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const user_id = session.user_id;

  try {
    // One-time migrations
    await pool.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS cost            NUMERIC DEFAULT 0`).catch(() => {});
    await pool.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS last_price      NUMERIC`).catch(() => {});
    await pool.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS yes_cost        NUMERIC DEFAULT 0`).catch(() => {});
    await pool.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS no_cost         NUMERIC DEFAULT 0`).catch(() => {});
    await pool.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS yes_last_price  NUMERIC`).catch(() => {});
    await pool.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS no_last_price   NUMERIC`).catch(() => {});
    await pool.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS sold_qty        INT     DEFAULT 0`).catch(() => {});
    await pool.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS sold_cost       NUMERIC DEFAULT 0`).catch(() => {});
    await pool.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS sold_payout     NUMERIC DEFAULT 0`).catch(() => {});

    // Fresh cash balance (localStorage goes stale after trades)
    const profileResult = await pool.query(
      "SELECT cash_balance FROM profile WHERE user_id = $1",
      [user_id]
    );
    if (profileResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const cash_balance = Number(profileResult.rows[0].cash_balance);

    // Open positions (markets not yet settled)
    const positionsResult = await pool.query(
      `SELECT p.yes_qty, p.no_qty, p.cost, p.last_price, p.yes_cost, p.no_cost, p.yes_last_price, p.no_last_price, m.market_id, m.name, m.threshold, m.direction, m.status, m.model_prob
       FROM positions p
       JOIN markets m ON m.market_id = p.market_id
       WHERE p.user_id = $1
         AND (p.yes_qty > 0 OR p.no_qty > 0)
         AND m.status = 'open'
       ORDER BY m.resolution_date DESC`,
      [user_id]
    );

    // Settled positions (historical)
    const settledResult = await pool.query(
      `SELECT p.yes_qty, p.no_qty, p.cost, m.market_id, m.name, m.threshold, m.direction,
              m.resolution_date, m.settlement_value
       FROM positions p
       JOIN markets m ON m.market_id = p.market_id
       WHERE p.user_id = $1
         AND (p.yes_qty > 0 OR p.no_qty > 0)
         AND m.status = 'settled'
       ORDER BY m.resolution_date DESC`,
      [user_id]
    );

    const settledPositions = settledResult.rows.map((r) => {
      const yes_wins = Number(r.settlement_value) > Number(r.threshold);
      const payout   = yes_wins ? Number(r.yes_qty) : Number(r.no_qty);
      const cost     = Number(r.cost ?? 0);
      return {
        ...r,
        threshold:        Number(r.threshold),
        settlement_value: Number(r.settlement_value),
        yes_wins,
        payout,
        cost,
      };
    });

    // Individual early-sell transactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sell_transactions (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL,
        market_id     UUID NOT NULL,
        contract_type TEXT NOT NULL,
        quantity      INT NOT NULL,
        price         NUMERIC NOT NULL,
        payout        NUMERIC NOT NULL,
        cost_basis    NUMERIC NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(() => {});

    const soldResult = await pool.query(
      `SELECT st.id, st.contract_type, st.quantity, st.price, st.payout, st.cost_basis, st.created_at,
              m.market_id, m.name, m.threshold, m.direction
       FROM sell_transactions st
       JOIN markets m ON m.market_id = st.market_id
       WHERE st.user_id = $1
       ORDER BY st.created_at DESC`,
      [user_id]
    );

    const soldPositions = soldResult.rows.map((r) => ({
      ...r,
      threshold:  Number(r.threshold),
      quantity:   Number(r.quantity),
      price:      Number(r.price),
      payout:     Number(r.payout),
      cost_basis: Number(r.cost_basis),
    }));

    return NextResponse.json({ cash_balance, positions: positionsResult.rows, settled_positions: settledPositions, sold_positions: soldPositions });
  } catch (err) {
    console.error("GET /api/portfolio error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
