import React from 'react'

const TrackOrderPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-commando-green-900 mb-4">Track Your Order</h1>
      <p className="text-gray-700 mb-6">Enter your Order ID and email to check the latest status.</p>
      <form className="grid gap-4 bg-white p-6 rounded-2xl border border-baby-pink-100">
        <input type="text" placeholder="Order ID" className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-baby-pink-400" />
        <input type="email" placeholder="Email used at purchase" className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-baby-pink-400" />
        <button type="button" className="px-6 py-3 bg-baby-pink-600 text-white font-bold rounded-lg hover:bg-baby-pink-700">Track Order</button>
      </form>
      <div className="mt-6 text-sm text-gray-600">For any issues, please contact support@hmhglobal.com.</div>
    </div>
  )
}

export default TrackOrderPage
