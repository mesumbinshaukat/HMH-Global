import React from 'react'

const SupportPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-commando-green-900 mb-4">Support</h1>
      <p className="text-gray-700 mb-6">Need help with an order or product? Our team is here 24/7.</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-baby-pink-50 border border-baby-pink-100">
          <h3 className="font-bold text-commando-green-700 mb-2">Email Support</h3>
          <p className="text-gray-700 text-sm">support@hmhglobal.com</p>
        </div>
        <div className="p-6 rounded-2xl bg-baby-pink-50 border border-baby-pink-100">
          <h3 className="font-bold text-commando-green-700 mb-2">Live Chat</h3>
          <p className="text-gray-700 text-sm">Available 9am–9pm UK time, Mon–Sat.</p>
        </div>
      </div>
    </div>
  )
}

export default SupportPage
