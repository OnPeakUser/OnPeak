"use client";

import { useEffect, useState } from "react";

type User = {
  user_id: string;
  username: string;
  cash_balance: number;
};

type Position = {
  market_id: string;
  name: string;
  threshold: number;
  direction: string;
  yes_qty: number;
  no_qty: number;
  model_prob: number | null;
  yes_cost: number | null;
  no_cost: number | null;
  yes_last_price: number | null;
  no_last_price: number | null;
  cost: number | null;
  last_price: number | null;
};

type SellTransaction = {
  id: string;
  market_id: string;
  name: string;
  threshold: number;
  direction: string;
  contract_type: "yes" | "no";
  quantity: number;
  price: number;
  payout: number;
  cost_basis: number;
  created_at: string;
};

type SettledPosition = {
  market_id: string;
  name: string;
  threshold: number;
  resolution_date: string;
  settlement_value: number;
  yes_wins: boolean;
  yes_qty: number;
  no_qty: number;
  payout: number;
  cost: number;
};

const S = {
  bg: "#f6f8fa",
  surface: "#ffffff",
  elevated: "#f0f3f6",
  border: "#d0d7de",
  text: "#1f2328",
  muted: "#656d76",
  faint: "#8c959f",
  blue: "#0969da",
  green: "#1a7f37",
  red: "#cf222e",
};

function fmtCents(price: number) {
  return `${(price * 100).toFixed(1)}¢`;
}

export default function Portfolio() {
  const [user, setUser]               = useState<User | null>(null);
  const [ready, setReady]             = useState(false);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [positions, setPositions]     = useState<Position[]>([]);
  const [settledPositions, setSettledPositions] = useState<SettledPosition[]>([]);
  const [sellTransactions, setSellTransactions] = useState<SellTransaction[]>([]);
  const [selling, setSelling]         = useState<string | null>(null);
  const [sellError, setSellError]     = useState<string | null>(null);
  const [sellOpen, setSellOpen]       = useState<string | null>(null); // key of row with open sell panel
  const [sellQty, setSellQty]         = useState<Record<string, string>>({});
  const [tab, setTab]                 = useState<"positions" | "history">("positions");
  const [historyFilter, setHistoryFilter] = useState<"all" | "sold-early" | "settled">("all");
  const [avgTip, setAvgTip]           = useState(false);

  function loadPortfolio(u: User) {
    fetch(`/api/portfolio`)
      .then((r) => r.json())
      .then((data) => {
        setReady(true);
        if (!data.positions) return; // API error — keep existing state rather than wiping
        setCashBalance(data.cash_balance);
        setPositions(data.positions);
        setSettledPositions(data.settled_positions ?? []);
        setSellTransactions(data.sold_positions ?? []);
      })
      .catch(() => setReady(true));
  }

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { setReady(true); return; }
    const u = JSON.parse(stored) as User;
    setUser(u);
    loadPortfolio(u);
  }, []);

  if (!ready) return null;

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8" style={{ background: S.bg, color: S.text }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: S.muted }}>Sign in to view your portfolio.</p>
          <a href="/login" className="inline-block px-4 py-2 rounded text-sm font-bold" style={{ background: S.blue, color: "#ffffff" }}>
            Sign In
          </a>
        </div>
      </main>
    );
  }

  const displayBalance = cashBalance ?? user.cash_balance;

  async function sell(p: Position, contract_type: "yes" | "no", quantity: number) {
    if (!user) return;
    const key = `${p.market_id}:${contract_type}`;
    setSelling(key);
    setSellError(null);
    const res = await fetch("/api/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ market_id: p.market_id, contract_type, quantity }),
    });
    const data = await res.json();
    if (res.ok) {
      setSellQty((prev) => { const n = { ...prev }; delete n[key]; return n; });
      setSellOpen(null);
      loadPortfolio(user);
    } else {
      setSellError(data.error ?? "Failed to sell.");
    }
    setSelling(null);
  }

  const cardStyle = { background: S.surface, border: `1px solid ${S.border}` };

  return (
    <main className="min-h-screen p-8" style={{ background: S.bg, color: S.text }}>

      <h1 className="text-2xl font-bold mb-1">My Portfolio</h1>
      <p className="text-sm mb-6" style={{ color: S.muted }}>{user.username}</p>

      <div className="rounded p-5 mb-5" style={cardStyle}>
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: S.faint }}>Cash Balance</p>
        <p className="text-3xl font-bold" style={{ color: S.blue }}>
          ${Number(displayBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex mb-0 border-b" style={{ borderColor: S.border }}>
        {(["positions", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 pb-2 text-sm font-medium"
            style={{
              color: tab === t ? S.blue : S.faint,
              borderBottom: tab === t ? `2px solid ${S.blue}` : "2px solid transparent",
              marginBottom: "-1px",
              cursor: "pointer",
            }}
          >
            {t === "positions" ? "Positions" : "History"}
          </button>
        ))}
      </div>

      {/* ── Positions tab ─────────────────────────────────────────────── */}
      {tab === "positions" && (
        <div className="rounded-b rounded-tr p-5" style={cardStyle}>
          {sellError && <p className="text-sm mb-3" style={{ color: S.red }}>{sellError}</p>}
          {positions.length === 0 ? (
            <p className="text-sm" style={{ color: S.faint }}>No open positions.</p>
          ) : (
            <table className="w-full" style={{ fontSize: "15px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: S.faint, borderBottom: `1px solid ${S.border}` }}>
                  <th className="text-left pb-3 font-medium" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Market</th>
                  <th className="text-center pb-3 font-medium" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Price last paid</th>
                  <th className="text-center pb-3 font-medium" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      Avg price
                      <span style={{ position: "relative", display: "inline-flex" }}>
                        <button
                          onClick={() => setAvgTip((v) => !v)}
                          style={{
                            width: "14px", height: "14px", borderRadius: "50%",
                            border: `1px solid ${S.faint}`, background: "transparent",
                            color: S.faint, fontSize: "9px", fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center",
                            justifyContent: "center", lineHeight: 1, padding: 0,
                          }}
                        >
                          ?
                        </button>
                        {avgTip && (
                          <div
                            onClick={() => setAvgTip(false)}
                            style={{
                              position: "absolute", top: "20px", left: "50%",
                              transform: "translateX(-50%)",
                              background: S.text, color: "#fff",
                              fontSize: "12px", fontWeight: 400,
                              borderRadius: "6px", padding: "8px 12px",
                              width: "240px", lineHeight: "1.5",
                              textAlign: "left", zIndex: 10,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                              textTransform: "none", letterSpacing: "normal",
                              cursor: "default",
                            }}
                          >
                            Your average price per contract across all purchases. For example, if you bought 2 YES contracts on NYC April 12 at 60¢ and then 3 more at 40¢, your avg price is 48¢.
                          </div>
                        )}
                      </span>
                    </span>
                  </th>
                  <th className="text-center pb-3 font-medium" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contracts</th>
                  <th className="text-center pb-3 font-medium" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total cost</th>
                  <th className="text-center pb-3 font-medium" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payout if right</th>
                  <th className="text-center pb-3 font-medium" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Market value</th>
                  <th className="text-center pb-3 font-medium" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total return</th>
                  <th className="pb-3" style={{ width: "220px" }}></th>
                </tr>
              </thead>
              <tbody>
                {positions.flatMap((p) => {
                  const prob = p.model_prob != null ? Number(p.model_prob) : null;
                  const rows = [];

                  rows.push(
                    <tr key={`${p.market_id}-hdr`} style={{ borderTop: `1px solid ${S.border}` }}>
                      <td colSpan={9} style={{ paddingTop: "12px", paddingBottom: "4px" }}>
                        <p style={{ fontWeight: 600, fontSize: "14px", color: S.text }}>{p.name}</p>
                        <p style={{ fontSize: "11px", color: S.faint, marginTop: "2px" }}>
                          Line: ${Number(p.threshold).toFixed(2)}/MWh — {p.direction}
                        </p>
                      </td>
                    </tr>
                  );

                  function posRow(ct: "yes" | "no") {
                    const qty           = ct === "yes" ? Number(p.yes_qty) : Number(p.no_qty);
                    const currentPrice  = prob != null ? (ct === "yes" ? prob : 1 - prob) : null;
                    const rawLastPrice  = ct === "yes" ? p.yes_last_price : p.no_last_price;
                    const lastPrice     = rawLastPrice != null ? Number(rawLastPrice) : null;
                    const marketValue   = currentPrice != null ? currentPrice * qty : null;
                    const payoutIfRight = qty;
                    const sideCost      = ct === "yes" ? p.yes_cost : p.no_cost;
                    const effectiveCost = sideCost != null && Number(sideCost) > 0 ? Number(sideCost)
                                       : (currentPrice != null ? currentPrice * qty : null);
                    const avgPrice      = effectiveCost != null && qty > 0 ? effectiveCost / qty : null;
                    const pnl           = effectiveCost != null && marketValue != null ? marketValue - effectiveCost : null;
                    const pct           = pnl != null && effectiveCost != null && effectiveCost > 0 ? (pnl / effectiveCost) * 100 : null;
                    const key           = `${p.market_id}:${ct}`;
                    const sqStr         = sellQty[key] ?? String(qty);
                    const sq            = Math.max(1, Math.min(qty, parseInt(sqStr) || 1));
                    const sideColor     = ct === "yes" ? S.green : S.red;
                    const isOpen        = sellOpen === key;

                    return [
                      <tr key={key} style={{ borderBottom: isOpen ? "none" : `1px solid ${S.elevated}` }}>
                        <td className="py-2 font-bold" style={{ verticalAlign: "top", paddingTop: "12px", color: sideColor }}>
                          {ct.toUpperCase()}
                        </td>
                        <td className="py-2 text-center font-medium" style={{ verticalAlign: "top", paddingTop: "12px", color: S.text }}>
                          {fmtCents(lastPrice ?? avgPrice ?? 0)}
                        </td>
                        <td className="py-2 text-center" style={{ verticalAlign: "top", paddingTop: "12px", color: S.muted }}>
                          {avgPrice != null ? fmtCents(avgPrice) : "—"}
                        </td>
                        <td className="py-2 text-center" style={{ verticalAlign: "top", paddingTop: "12px" }}>{qty}</td>
                        <td className="py-2 text-center" style={{ verticalAlign: "top", paddingTop: "12px", color: S.muted }}>
                          {effectiveCost != null ? `$${effectiveCost.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 text-center" style={{ verticalAlign: "top", paddingTop: "12px" }}>
                          <span style={{ color: S.text }}>${payoutIfRight.toFixed(2)}</span>
                          {effectiveCost != null && (
                            <span style={{ color: (payoutIfRight - effectiveCost) >= 0 ? S.green : S.red }}>
                              {" "}({(payoutIfRight - effectiveCost) >= 0 ? "+" : ""}${(payoutIfRight - effectiveCost).toFixed(2)})
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-center font-medium" style={{ verticalAlign: "top", paddingTop: "12px", color: S.text }}>
                          {marketValue != null ? `$${marketValue.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 text-center font-semibold" style={{ verticalAlign: "top", paddingTop: "12px", color: pnl != null ? (pnl >= 0 ? S.green : S.red) : S.faint }}>
                          {pnl != null && pct != null
                            ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%)`
                            : "—"}
                        </td>
                        <td style={{ verticalAlign: "top", paddingTop: "2px", paddingBottom: "10px", paddingLeft: "48px", paddingRight: "32px", width: "220px" }}>
                          <button
                            onClick={() => {
                              setSellQty((prev) => ({ ...prev, [key]: String(qty) }));
                              setSellOpen(isOpen ? null : key);
                              setSellError(null);
                            }}
                            className="btn-sell"
                            style={isOpen ? { background: "#e6e9ec" } : {}}
                          >
                            Sell
                          </button>
                          {isOpen && (
                            <div style={{
                              marginTop: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <input
                                  type="number"
                                  min={1}
                                  max={qty}
                                  value={sqStr}
                                  onChange={(e) => {
                                    setSellQty((prev) => ({ ...prev, [key]: e.target.value }));
                                  }}
                                  onBlur={() => {
                                    const v = Math.max(1, Math.min(qty, parseInt(sqStr) || 1));
                                    setSellQty((prev) => ({ ...prev, [key]: String(v) }));
                                  }}
                                  style={{
                                    width: "56px", fontSize: "14px", textAlign: "center",
                                    border: `1px solid ${S.border}`, borderRadius: "5px",
                                    padding: "5px 4px", background: S.elevated, color: S.text,
                                  }}
                                />
                                <button
                                  onClick={() => setSellQty((prev) => ({ ...prev, [key]: String(qty) }))}
                                  style={{
                                    fontSize: "13px", fontWeight: 600, padding: "5px 10px",
                                    border: `1px solid ${S.border}`, borderRadius: "5px",
                                    background: S.elevated, color: S.text, cursor: "pointer",
                                  }}
                                >
                                  All
                                </button>
                              </div>
                              <button
                                onClick={() => sell(p, ct, sq)}
                                disabled={selling === key}
                                style={{
                                  fontSize: "13px", fontWeight: 700, padding: "6px 0",
                                  borderRadius: "5px", border: "none", width: "100%",
                                  background: S.red, color: "#fff", cursor: "pointer",
                                  opacity: selling === key ? 0.5 : 1,
                                }}
                              >
                                {selling === key ? "Selling…" : "Confirm sell"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>,
                    ];
                  }

                  if (Number(p.yes_qty) > 0) rows.push(...posRow("yes"));
                  if (Number(p.no_qty)  > 0) rows.push(...posRow("no"));

                  return rows;
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── History tab ───────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="rounded-b rounded-tr p-5" style={cardStyle}>

          {/* Filter buttons */}
          {(settledPositions.length > 0 || sellTransactions.length > 0) && (
            <div className="flex gap-2 mb-4">
              {(["all", "settled", "sold-early"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{
                    background: historyFilter === f ? S.text : S.elevated,
                    color:      historyFilter === f ? "#fff" : S.muted,
                    border:     `1px solid ${historyFilter === f ? S.text : S.border}`,
                    cursor: "pointer",
                  }}
                >
                  {f === "all" ? "All" : f === "settled" ? "Settled" : "Sold Early"}
                </button>
              ))}
            </div>
          )}

          {settledPositions.length === 0 && sellTransactions.length === 0 ? (
            <p className="text-sm" style={{ color: S.faint }}>No history yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: S.faint, borderBottom: `1px solid ${S.border}` }}>
                  <th className="text-left pb-2 text-xs font-medium">Market</th>
                  <th className="text-left pb-2 text-xs font-medium">Side</th>
                  <th className="text-right pb-2 text-xs font-medium">Contracts</th>
                  <th className="text-right pb-2 text-xs font-medium">Cost</th>
                  <th className="text-right pb-2 text-xs font-medium">Payout</th>
                  <th className="text-right pb-2 text-xs font-medium">Return</th>
                </tr>
              </thead>
              <tbody>
                {historyFilter !== "sold-early" && settledPositions.map((p) => {
                  const hasYes    = Number(p.yes_qty) > 0;
                  const hasNo     = Number(p.no_qty)  > 0;
                  const sides     = [...(hasYes ? ["yes" as const] : []), ...(hasNo ? ["no" as const] : [])];
                  return sides.map((side) => {
                    const qty       = side === "yes" ? Number(p.yes_qty) : Number(p.no_qty);
                    const sideWins  = side === "yes" ? p.yes_wins : !p.yes_wins;
                    const payout    = sideWins ? qty : 0;
                    const hasCost   = p.cost > 0;
                    const pnl       = payout - p.cost;
                    const pct       = hasCost ? (pnl / p.cost) * 100 : null;
                    const won       = pnl >= 0;
                    return (
                      <tr key={`settled-${p.market_id}-${side}`} style={{ borderBottom: `1px solid ${S.elevated}` }}>
                        <td className="py-2.5">
                          <p className="font-medium" style={{ color: S.text }}>{p.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: S.faint }}>
                            RT avg: ${p.settlement_value.toFixed(2)} · Line: ${p.threshold.toFixed(2)}/MWh
                          </p>
                        </td>
                        <td className="py-2.5 font-semibold" style={{ color: side === "yes" ? S.green : S.red }}>
                          {side.toUpperCase()} · {sideWins ? "Won" : "Lost"}
                        </td>
                        <td className="py-2.5 text-right" style={{ color: S.muted }}>{qty}</td>
                        <td className="py-2.5 text-right" style={{ color: S.muted }}>
                          {hasCost ? `$${p.cost.toFixed(2)}` : <span style={{ color: S.faint }}>—</span>}
                        </td>
                        <td className="py-2.5 text-right font-semibold" style={{ color: payout > 0 ? S.green : S.red }}>
                          ${payout.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-semibold" style={{ color: hasCost ? (won ? S.green : S.red) : S.faint }}>
                          {hasCost ? `${won ? "+" : ""}$${pnl.toFixed(2)} (${won ? "+" : ""}${pct!.toFixed(0)}%)` : "—"}
                        </td>
                      </tr>
                    );
                  });
                })}
                {historyFilter !== "settled" && sellTransactions.map((t) => {
                  const pnl     = t.payout - t.cost_basis;
                  const hasCost = t.cost_basis > 0;
                  const pct     = hasCost ? (pnl / t.cost_basis) * 100 : null;
                  const won     = pnl >= 0;
                  return (
                    <tr key={`sell-${t.id}`} style={{ borderBottom: `1px solid ${S.elevated}` }}>
                      <td className="py-2.5">
                        <p className="font-medium" style={{ color: S.text }}>{t.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: S.faint }}>
                          Line: ${t.threshold.toFixed(2)}/MWh · {new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-2.5 font-semibold" style={{ color: t.contract_type === "yes" ? S.green : S.red }}>
                        {t.contract_type.toUpperCase()}
                      </td>
                      <td className="py-2.5 text-right" style={{ color: S.muted }}>{t.quantity}</td>
                      <td className="py-2.5 text-right" style={{ color: S.muted }}>
                        {hasCost ? `$${t.cost_basis.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 text-right font-semibold" style={{ color: S.green }}>
                        ${t.payout.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-semibold" style={{ color: hasCost ? (won ? S.green : S.red) : S.faint }}>
                        {hasCost ? `${won ? "+" : ""}$${pnl.toFixed(2)} (${won ? "+" : ""}${pct!.toFixed(0)}%)` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

    </main>
  );
}
