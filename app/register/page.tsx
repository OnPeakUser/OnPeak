export default function Register() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">

        <a href="/" className="text-gray-500 text-sm mb-8 block hover:text-white">← Back</a>
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-gray-400 mb-8">Start with $10,000 in paper cash</p>

        <div className="border border-gray-800 rounded-lg p-6">

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Username</p>
            <input
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="satoshi"
              type="text"
            />
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <input
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="you@example.com"
              type="email"
            />
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-1">Password</p>
            <input
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="••••••••"
              type="password"
            />
          </div>

          <button className="w-full bg-white text-black font-bold py-2 rounded hover:bg-gray-200 transition mb-4">
            Create Account
          </button>

          <p className="text-gray-500 text-xs text-center mb-4">
            You'll receive a confirmation email before your account is activated
          </p>

          <p className="text-center text-gray-500 text-sm">
            Already have an account?{" "}
            <a href="/login" className="text-white hover:underline">Sign In</a>
          </p>

        </div>
      </div>
    </main>
  )
}