const S = {
  bg:      "#f6f8fa",
  surface: "#ffffff",
  border:  "#d0d7de",
  text:    "#1f2328",
  muted:   "#656d76",
  blue:    "#0969da",
};

export default function HowItWorksPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "40px", background: S.bg, color: S.text }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Page title */}
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "32px" }}>How It Works</h1>

        {/* Section: How Do Power Markets Work? */}
        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}>How Do Power Markets Work?</h2>
          <div
            style={{
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: "8px",
              padding: "20px 24px",
              fontSize: "14px",
              lineHeight: "1.7",
              color: S.text,
            }}
          >
            <p style={{ margin: "0 0 12px" }}>
              Electricity prices are set every 5 minutes at thousands of locations across the US. Grid operators called
              ISOs calculate these prices based on how much power is needed and what it costs to produce. Prices vary by
              location — when transmission lines are overloaded, some areas pay much more than others.
            </p>
            <p style={{ margin: 0 }}>
              OnPeak currently covers three nodes: <strong>New York City</strong>, <strong>Boston</strong>, and{" "}
              <strong>Northern California</strong>, each in a different ISO.
            </p>
          </div>
        </section>

        {/* Section: Day-Ahead Market */}
        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}>What Is the Day-Ahead Market (DAM)?</h2>
          <div
            style={{
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: "8px",
              padding: "20px 24px",
              fontSize: "14px",
              lineHeight: "1.7",
              color: S.text,
            }}
          >
            <p style={{ margin: 0 }}>
              Every day, the ISO publishes 24 hourly prices for the next day — one price per hour, per node. These are
              set the day before through a bidding process between generators and utilities. Think of DAM prices as the
              market's best expectation of what power will cost tomorrow.
            </p>
          </div>
        </section>

        {/* Section: Real-Time Prices */}
        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}>What Are Real-Time (RT) Prices?</h2>
          <div
            style={{
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: "8px",
              padding: "20px 24px",
              fontSize: "14px",
              lineHeight: "1.7",
              color: S.text,
            }}
          >
            <p style={{ margin: 0 }}>
              RT prices are what power actually costs, updated every 5 minutes as conditions change on the grid.
              Weather shifts, generator outages, or demand surprises can push RT prices far above or below what the DAM
              expected.
            </p>
          </div>
        </section>

        {/* Section: How Do Contracts Work? */}
        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}>How Do Contracts Work?</h2>
          <div
            style={{
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: "8px",
              padding: "20px 24px",
              fontSize: "14px",
              lineHeight: "1.7",
              color: S.text,
            }}
          >
            <p style={{ margin: "0 0 12px" }}>
              When DAM prices are released, contracts go live for each node. Each contract asks one question:
            </p>
            <p
              style={{
                margin: "0 0 16px",
                padding: "12px 16px",
                background: S.bg,
                border: `1px solid ${S.border}`,
                borderRadius: "6px",
                fontWeight: 600,
                color: S.text,
              }}
            >
              Will the average RT price for the day beat the DAM price?
            </p>
            <p style={{ margin: "0 0 12px" }}>
              The DAM price is the "line." At the end of the day, we average all 288 five-minute RT prices. If the RT
              average is higher than the DAM line, the contract settles <strong>Yes</strong>. If lower,{" "}
              <strong>No</strong>.
            </p>
            <p style={{ margin: "0 0 8px", fontWeight: 600 }}>DAM release times (when contracts go live):</p>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li>NYC &amp; Boston: 11:00 AM ET</li>
              <li>Northern California: 4:00 PM ET</li>
            </ul>
            <p style={{ margin: "12px 0 0", color: S.muted }}>
              You can trade on the market pages or from the live map.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>FAQ</h2>

        {[
          {
            q: "What is an ISO?",
            a: (
              <>
                An Independent System Operator — a nonprofit that runs the electric grid and market for a region. They
                don't own power plants; they coordinate who generates, how much, and at what price. The US has seven:{" "}
                <strong>NYISO, ISO-NE, PJM, MISO, SPP, ERCOT, and CAISO</strong>.
              </>
            ),
          },
          {
            q: "Why do prices go negative?",
            a: (
              <>
                When there's more power being generated than anyone needs — usually from solar or wind that can't easily
                shut off — generators actually pay the market to take their output. It's cheaper than turning off and
                restarting.
              </>
            ),
          },
          {
            q: "What causes price spikes?",
            a: (
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                <li style={{ marginBottom: "8px" }}>
                  <strong>NYC:</strong> Transmission congestion. The city sits behind constrained power lines, so when
                  demand surges (summer AC), expensive local generators set the price.
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Boston:</strong> Winter gas shortages. Limited pipeline capacity means heating and power plants
                  compete for the same gas, driving prices up during cold snaps.
                </li>
                <li>
                  <strong>NorCal:</strong> The solar rollercoaster. Midday solar floods the grid (sometimes pushing
                  prices negative), then drops off in the evening right as demand peaks, forcing expensive gas plants
                  online fast.
                </li>
              </ul>
            ),
          },
        ].map(({ q, a }) => (
          <section key={q} style={{ marginBottom: "16px" }}>
            <div
              style={{
                background: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: "8px",
                padding: "20px 24px",
                fontSize: "14px",
                lineHeight: "1.7",
                color: S.text,
              }}
            >
              <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "15px" }}>{q}</p>
              <div>{a}</div>
            </div>
          </section>
        ))}

        {/* Feedback */}
        <section style={{ marginTop: "40px", marginBottom: "8px" }}>
          <div
            style={{
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: "8px",
              padding: "20px 24px",
              fontSize: "14px",
              lineHeight: "1.7",
              color: S.text,
            }}
          >
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "15px" }}>This is early</p>
            <p style={{ margin: 0, color: S.muted }}>
              OnPeak is still early and there&apos;s a lot left to build. If you have feedback, a feature idea
              you think would be cool, or a market you&apos;d like to see added, feel free to email us at{" "}
              <a href="mailto:onpeakmarket@protonmail.com" style={{ color: S.blue }}>
                onpeakmarket@protonmail.com
              </a>
              . We read and respond to everything.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
