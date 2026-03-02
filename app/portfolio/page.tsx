export default function Portfolio() {
  return (
    <main className="min-h-screen bg-black text-white p-8">

      <a href="/" className="text-gray-500 text-sm mb-6 block hover:text-white">← Back</a>
      <h1 className="text-3xl font-bold mb-1">My Portfolio</h1>
      <p className="text-gray-400 text-sm mb-6">Your positions and cash balance</p>

      {/* Cash Balance */}
      <div className="border border-gray-800 rounded-lg p-6 mb-6">
        <p className="text-xs text-gray-500 mb-1">Cash Balance</p>
        <p className="text-3xl font-bold text-green-400">$10,000.00</p>
      </div>

      {/* Current Positions */}
      <div className="border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Positions</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left pb-2">Market</th>
              <th className="text-left pb-2">Direction</th>
              <th className="text-left pb-2">Position</th>
              <th className="text-left pb-2">Price</th>
              <th className="text-left pb-2">Size</th>
              <th className="text-left pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-900">
              <td className="py-2">NYC_ISO_20260228</td>
              <td className="py-2">BUY</td>
              <td className="py-2 text-green-400">YES</td>
              <td className="py-2">$0.50</td>
              <td className="py-2">10</td>
              <td className="py-2 text-yellow-400">RESTING</td>
            </tr>
            <tr className="border-b border-gray-900">
              <td className="py-2">NYC_ISO_20260228</td>
              <td className="py-2">BUY</td>
              <td className="py-2 text-green-400">YES</td>
              <td className="py-2">$0.55</td>
              <td className="py-2">20</td>
              <td className="py-2 text-yellow-400">RESTING</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pending Orders */}
      <div className="border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Pending Orders</h2>
        <p className="text-gray-500 text-sm">No pending orders</p>
      </div>

    </main>
  )
}