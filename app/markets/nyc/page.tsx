export default function NYCMarket() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      
      {/* Header */}
      <a href="/" className="text-gray-500 text-sm mb-6 block hover:text-white">← Back</a>
      <h1 className="text-3xl font-bold mb-1">NYC ISO — HIGHER</h1>
      <p className="text-gray-400 text-sm mb-6">Will tomorrow's average DALMP be higher than <span className="text-white font-bold">$50.00</span>?</p>

      {/* Betting Line */}
      <div className="border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-xs text-gray-500 mb-1">Tomorrow's Betting Line (Day-Ahead Average)</p>
        <p className="text-2xl font-bold">$50.00 / MWh</p>
      </div>

      {/* YES / NO Prices */}
      <div className="flex gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 flex-1 text-center">
          <p className="text-xs text-gray-500 mb-1">YES — Lowest Ask</p>
          <p className="text-green-400 font-bold text-2xl">$0.60</p>
          <p className="text-gray-500 text-xs">10 contracts available</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 flex-1 text-center">
          <p className="text-xs text-gray-500 mb-1">NO — Lowest Ask</p>
          <p className="text-red-400 font-bold text-2xl">$0.40</p>
          <p className="text-gray-500 text-xs">100 contracts available</p>
        </div>
      </div>

      {/* Order Entry */}
      <div className="border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Place Order</h2>
        <div className="flex gap-2 mb-4">
          <button className="bg-green-700 text-white px-4 py-2 rounded font-semibold flex-1">BUY YES</button>
          <button className="bg-red-700 text-white px-4 py-2 rounded font-semibold flex-1">BUY NO</button>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Price ($)</p>
            <input className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" placeholder="0.60" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Size (contracts)</p>
            <input className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" placeholder="10" />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-800 text-white px-4 py-2 rounded text-sm flex-1">Limit Order</button>
          <button className="bg-gray-700 text-white px-4 py-2 rounded text-sm flex-1">Market Order</button>
        </div>
      </div>

      {/* Orderbook */}
      <div className="border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Order Book</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left pb-2">Direction</th>
              <th className="text-left pb-2">Position</th>
              <th className="text-left pb-2">Price</th>
              <th className="text-left pb-2">Size</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-900 py-2">
              <td className="py-2 text-green-400">BUY</td>
              <td className="py-2">YES</td>
              <td className="py-2">$0.55</td>
              <td className="py-2">20</td>
            </tr>
            <tr className="border-b border-gray-900 py-2">
              <td className="py-2 text-green-400">BUY</td>
              <td className="py-2">YES</td>
              <td className="py-2">$0.50</td>
              <td className="py-2">10</td>
            </tr>
            <tr className="border-b border-gray-900 py-2">
              <td className="py-2 text-red-400">SELL</td>
              <td className="py-2">YES</td>
              <td className="py-2">$0.60</td>
              <td className="py-2">10</td>
            </tr>
            <tr className="border-b border-gray-900 py-2">
              <td className="py-2 text-red-400">SELL</td>
              <td className="py-2">YES</td>
              <td className="py-2">$0.61</td>
              <td className="py-2">10</td>
            </tr>
            <tr className="border-b border-gray-900 py-2">
              <td className="py-2 text-green-400">BUY</td>
              <td className="py-2">NO</td>
              <td className="py-2">$0.30</td>
              <td className="py-2">100</td>
            </tr>
            <tr className="border-b border-gray-900 py-2">
              <td className="py-2 text-green-400">BUY</td>
              <td className="py-2">NO</td>
              <td className="py-2">$0.20</td>
              <td className="py-2">100</td>
            </tr>
          </tbody>
        </table>
      </div>

    </main>
  )
}