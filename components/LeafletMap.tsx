"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Zone, Market } from "@/app/map/page";

// Map zone IDs → market node identifiers (as stored in the markets table)
const ZONE_NODE: Record<string, string> = {
  "NYISO_N.Y.C.":            "N.Y.C.",
  "ISONE_.Z.NEMASSBOST":     ".Z.NEMASSBOST",
  "CAISO_TH_NP15_GEN-APND": "TH_NP15_GEN-APND",
};

function FitBounds() {
  const map = useMap();
  useEffect(() => { map.setView([44, -90], 4); }, [map]);
  return null;
}

// "Today" / "Tomorrow" / "Mar 25" label for an operating day
function dayLabel(iso: string): string {
  const fmtET = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
  const today    = fmtET(new Date());
  const tomorrow = fmtET(new Date(Date.now() + 86_400_000));
  const mktDay   = fmtET(new Date(iso + "T12:00:00"));
  if (mktDay === today)    return "Today";
  if (mktDay === tomorrow) return "Tomorrow";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Mini market popup ──────────────────────────────────────────────────────────

function MarketPanel({
  zone, fill, zoneMarkets, userId,
}: {
  zone:        Zone;
  fill:        string;
  zoneMarkets: Market[];
  userId:      string | null;
}) {
  // Sort so today's market always appears first, tomorrow's second
  const sorted = [...zoneMarkets].sort((a, b) =>
    a.resolution_date.localeCompare(b.resolution_date)
  );

  const [tabIdx, setTabIdx]       = useState(0);
  const [qtyStr, setQtyStr]       = useState("1");
  const qty = Math.max(1, parseInt(qtyStr) || 1);
  const [side, setSide]           = useState<"yes" | "no" | null>(null);
  const [hoverYes, setHoverYes]   = useState(false);
  const [hoverNo, setHoverNo]     = useState(false);
  const [busy, setBusy]           = useState(false);
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);

  // Reset tab + side when available markets change
  useEffect(() => { setTabIdx(0); setMsg(null); setSide(null); }, [sorted.length]);

  const market = sorted[tabIdx] ?? null;

  const diff = market ? zone.price - market.threshold : null;
  const pct  = diff != null && market && market.threshold !== 0
    ? (diff / Math.abs(market.threshold)) * 100 : null;

  async function placeOrder(side: "yes" | "no") {
    if (!userId || !market) return;
    setBusy(true);
    setMsg(null);
    try {
      const res  = await fetch("/api/bet", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          user_id:       userId,
          market_id:     market.market_id,
          contract_type: side,
          quantity:      qty,
        }),
      });
      const data = await res.json();
      setMsg({ ok: res.ok, text: res.ok ? `Filled! ${qty} ${side.toUpperCase()} at ${Math.round((data.price ?? 0.5) * 100)}¢` : (data.error ?? "Error placing order.") });
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  const yesCents = market != null ? (market.model_prob != null ? Math.round(market.model_prob * 100) : 50) : null;
  const noCents  = market != null ? (market.model_prob != null ? 100 - Math.round(market.model_prob * 100) : 50) : null;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", width: "256px" }}>

      {/* Zone name */}
      <div style={{ fontWeight: 700, fontSize: "14px", color: "#1f2328", marginBottom: "10px" }}>
        {zone.name}
      </div>

      {/* No markets at all */}
      {sorted.length === 0 && (
        <div style={{ fontSize: "12px", color: "#8c959f", textAlign: "center", padding: "14px 0" }}>
          No active markets yet
        </div>
      )}

      {sorted.length > 0 && (
        <>
          {/* Operating-day tabs — only shown when 2 markets are open simultaneously */}
          {sorted.length > 1 && (
            <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
              {sorted.map((m, i) => (
                <button
                  key={m.market_id}
                  onClick={() => { setTabIdx(i); setMsg(null); setSide(null); }}
                  style={{
                    flex: 1, padding: "5px 0",
                    fontSize: "11px", fontWeight: tabIdx === i ? 700 : 400,
                    border:     `1px solid ${tabIdx === i ? "#0969da" : "#d0d7de"}`,
                    borderRadius: "4px",
                    background: tabIdx === i ? "#ddf4ff" : "#ffffff",
                    color:      tabIdx === i ? "#0969da" : "#656d76",
                    cursor: "pointer",
                  }}
                >
                  {dayLabel(m.resolution_date)}
                  <div style={{ fontSize: "10px", fontWeight: 400, marginTop: "1px", color: tabIdx === i ? "#0969da" : "#8c959f" }}>
                    {new Date(m.resolution_date + "T12:00:00")
                      .toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Threshold price block */}
          {market && (
            <div style={{ background: "#f6f8fa", borderRadius: "6px", padding: "8px 10px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#656d76" }}>DAM Threshold</span>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#656d76" }}>
                  ${market.threshold.toFixed(2)}<span style={{ fontSize: "10px", color: "#8c959f" }}>/MWh</span>
                </span>
              </div>
            </div>
          )}

          {/* Trade section */}
          {market && (
            <div style={{ borderTop: "1px solid #d0d7de", paddingTop: "10px" }}>

              {/* Question explainer */}
              <div style={{ fontSize: "11px", color: "#656d76", marginBottom: "14px", lineHeight: "1.4" }}>
                Will the average price in <strong>{zone.name}</strong> be Higher than <strong>${market.threshold.toFixed(2)}</strong>?
              </div>

              {/* YES / NO selector — always visible */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                <button
                  onClick={() => { setSide(side === "yes" ? null : "yes"); setMsg(null); }}
                  onMouseEnter={() => setHoverYes(true)}
                  onMouseLeave={() => setHoverYes(false)}
                  style={{ flex: 1, padding: "10px 0", background: "#1a7f37", color: "#fff", border: `2px solid ${hoverYes ? "#0d4720" : side === "yes" ? "#0d4720" : "#1a7f37"}`, borderRadius: "5px", fontWeight: 700, fontSize: "13px", cursor: "pointer", opacity: side && side !== "yes" ? 0.55 : 1, transition: "border-color 0.1s, opacity 0.1s" }}
                >
                  YES · {yesCents}¢
                </button>
                <button
                  onClick={() => { setSide(side === "no" ? null : "no"); setMsg(null); }}
                  onMouseEnter={() => setHoverNo(true)}
                  onMouseLeave={() => setHoverNo(false)}
                  style={{ flex: 1, padding: "10px 0", background: "#cf222e", color: "#fff", border: `2px solid ${hoverNo ? "#7a0a0f" : side === "no" ? "#7a0a0f" : "#cf222e"}`, borderRadius: "5px", fontWeight: 700, fontSize: "13px", cursor: "pointer", opacity: side && side !== "no" ? 0.55 : 1, transition: "border-color 0.1s, opacity 0.1s" }}
                >
                  NO · {noCents}¢
                </button>
              </div>

              {/* Contracts input — always visible */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <label style={{ fontSize: "12px", color: "#656d76" }}>Contracts</label>
                <input
                  type="number"
                  min={1}
                  value={qtyStr}
                  onChange={e => setQtyStr(e.target.value)}
                  onBlur={() => setQtyStr(String(Math.max(1, parseInt(qtyStr) || 1)))}
                  style={{ width: "60px", padding: "4px 6px", border: "1px solid #d0d7de", borderRadius: "4px", fontSize: "12px", textAlign: "center" }}
                />
              </div>

              {/* Payout summary — always visible when a side is selected */}
              {side && (
                <>
                  {(() => {
                    const betProb = market.model_prob ?? 0.5;
                    const betPrice = side === "yes" ? betProb : 1 - betProb;
                    return (
                      <div style={{ background: "#f6f8fa", borderRadius: "5px", padding: "8px 10px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#656d76", marginBottom: "4px" }}>
                          <span>Cost</span>
                          <strong style={{ color: "#1f2328" }}>${(betPrice * qty).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#656d76" }}>
                          <span>Payout if correct</span>
                          <strong style={{ color: side === "yes" ? "#1a7f37" : "#cf222e" }}>${qty.toFixed(2)}</strong>
                        </div>
                      </div>
                    );
                  })()}

                  {userId ? (
                    <button
                      onClick={() => placeOrder(side)}
                      disabled={busy}
                      style={{ width: "100%", padding: "9px 0", background: side === "yes" ? "#1a7f37" : "#cf222e", color: "#fff", border: "none", borderRadius: "5px", fontWeight: 700, fontSize: "13px", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 }}
                    >
                      {busy ? "Placing…" : `Execute Order · ${side.toUpperCase()}`}
                    </button>
                  ) : (
                    <>
                      <a
                        href="/login"
                        style={{ display: "block", textAlign: "center", padding: "9px 0", background: "#0969da", color: "#fff", borderRadius: "5px", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}
                      >
                        Sign in to trade
                      </a>
                      <p style={{ textAlign: "center", fontSize: "11px", color: "#656d76", margin: "6px 0 0" }}>
                        No account? <a href="/register" style={{ color: "#0969da" }}>Register</a>
                      </p>
                    </>
                  )}
                </>
              )}

              {/* Order result message */}
              {msg && (
                <div style={{ marginTop: "7px", padding: "6px 8px", borderRadius: "4px", fontSize: "11px", textAlign: "center", background: msg.ok ? "#dafbe1" : "#ffebe9", color: msg.ok ? "#1a7f37" : "#cf222e" }}>
                  {msg.text}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Map component ──────────────────────────────────────────────────────────────

interface Props {
  zones:      Zone[];
  priceColor: (price: number) => string;
  markets:    Market[];
  userId:     string | null;
}

export default function LeafletMap({ zones, priceColor, markets, userId }: Props) {
  // Track which zone's popup is open so we can suppress all tooltips
  const [openZoneId, setOpenZoneId] = useState<string | null>(null);

  return (
    <MapContainer
      center={[44, -90]}
      zoom={4}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
      zoomControl
      attributionControl={false}
    >
      {/* CartoDB Voyager — light terrain style with city/state labels, free, no API key */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <FitBounds />

      {zones.map((zone) => {
        const fill        = priceColor(zone.price);
        const node        = ZONE_NODE[zone.id] ?? "";
        const zoneMarkets = markets.filter(m => m.node === node && m.status === "open");

        return (
          <CircleMarker
            key={zone.id}
            center={[zone.lat, zone.lon]}
            radius={15}
            pathOptions={{ fillColor: fill, fillOpacity: 1, color: "#ffffff", weight: 3 }}
            eventHandlers={{
              popupopen:  () => setOpenZoneId(zone.id),
              popupclose: () => setOpenZoneId(null),
            }}
          >
            {/* Tooltip suppressed while any popup is open */}
            {openZoneId === null && (
              <Tooltip sticky>
                <div style={{ fontFamily: "system-ui, sans-serif", minWidth: "130px" }}>
                  <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "13px", color: "#1f2328" }}>{zone.name}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: fill, marginBottom: "4px" }}>
                    ${zone.price.toFixed(2)}<span style={{ fontSize: "11px", fontWeight: 400, color: "#656d76" }}>/MWh</span>
                  </div>
                  {zone.timestamp && (
                    <div style={{ fontSize: "10px", color: "#8c959f" }}>
                      {(() => {
                        try {
                          return new Date(zone.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York" }) + " ET";
                        } catch { return zone.timestamp; }
                      })()}
                    </div>
                  )}
                </div>
              </Tooltip>
            )}

            {/* Click to open mini market — closes on map click or second dot click */}
            <Popup minWidth={260} maxWidth={300} closeButton>
              <MarketPanel zone={zone} fill={fill} zoneMarkets={zoneMarkets} userId={userId} />
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
