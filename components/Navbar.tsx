"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const S = {
  bg: "#f6f8fa",
  surface: "#ffffff",
  border: "#d0d7de",
  text: "#1f2328",
  muted: "#656d76",
  blue: "#0969da",
};

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUsername(JSON.parse(stored).username);
  }, []);

  async function handleSignOut() {
    await fetch("/api/logout", { method: "POST" });
    localStorage.removeItem("user");
    setUsername(null);
    router.push("/");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      style={{ background: S.surface, borderBottom: `1px solid ${S.border}` }}
      className="px-8 py-4 flex items-center justify-between"
    >
      <span className="font-bold text-[1.375rem] tracking-tight" style={{ color: "#000000" }}>
        OnPeak
      </span>

      <div className="flex gap-6 items-center">
        {[
          { href: "/how-it-works",  label: "How It Works" },
          { href: "/markets",       label: "Markets", match: "/markets" },
          { href: "/map",           label: "Live Map" },
          { href: "/portfolio",     label: "Portfolio" },
        ].map(({ href, label, match }) => {
          const active = isActive(match ?? href);
          return (
            <Link
              key={href}
              href={href}
              className="text-sm transition-colors duration-150"
              style={{ color: active ? S.blue : S.muted, fontWeight: active ? 600 : 400 }}
            >
              {label}
            </Link>
          );
        })}

        <div style={{ width: "1px", height: "18px", background: S.border }} />

        {username ? (
          <>
            <span className="text-sm" style={{ color: S.muted }}>{username}</span>
            <button
              onClick={handleSignOut}
              className="text-sm transition-colors"
              style={{ color: S.muted }}
              onMouseEnter={e => (e.currentTarget.style.color = S.text)}
              onMouseLeave={e => (e.currentTarget.style.color = S.muted)}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm" style={{ color: isActive("/login") ? S.blue : S.muted }}>
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-3 py-1.5 rounded transition-colors"
              style={{ background: S.blue, color: "#ffffff" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0757ba")}
              onMouseLeave={e => (e.currentTarget.style.background = S.blue)}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
