import React from 'react'

const ShippingInfoPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-commando-green-900 mb-4">Shipping Information</h1>
      <p className="text-gray-700 mb-4">We process orders within 24 hours. UK deliveries usually arrive within 2-4 business days.</p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li>Standard UK Shipping: 2-4 business days</li>
        <li>Express Shipping: 1-2 business days</li>
        <li>International Shipping: 5-10 business days</li>
      </ul>
    </div>
  )
}

export default ShippingInfoPage
