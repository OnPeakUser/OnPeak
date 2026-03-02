import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Power Bet",
  description: "Predict energy prices. Trade the grid.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">

        {/* Navbar */}
        <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <a href="/" className="text-white font-bold text-lg">⚡ Power Bet</a>
          <div className="flex gap-6 text-sm">
            <a href="/markets/nyc" className="text-gray-400 hover:text-white transition">Markets</a>
            <a href="/portfolio" className="text-gray-400 hover:text-white transition">Portfolio</a>
            <a href="/login" className="text-gray-400 hover:text-white transition">Sign In</a>
            <a href="/register" className="bg-white text-black px-3 py-1 rounded font-semibold hover:bg-gray-200 transition">Register</a>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}