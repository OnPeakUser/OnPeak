export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Power Bet</h1>
      <p className="text-gray-400 mb-8">Predict energy prices. Trade the grid.</p>

      <a href="/markets/nyc" className="block border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition">
        <h2 className="text-xl font-semibold">NYC ISO — HIGHER</h2>
        <p className="text-gray-400 text-sm mb-4">Will tomorrow's average DALMP be higher than $50.00?</p>
        <div className="flex gap-4">
          <div className="bg-gray-900 rounded p-3 flex-1 text-center">
            <p className="text-xs text-gray-500">YES</p>
            <p className="text-green-400 font-bold text-lg">$0.60</p>
          </div>
          <div className="bg-gray-900 rounded p-3 flex-1 text-center">
            <p className="text-xs text-gray-500">NO</p>
            <p className="text-red-400 font-bold text-lg">$0.40</p>
          </div>
        </div>
      </a>
    </main>
  )
}