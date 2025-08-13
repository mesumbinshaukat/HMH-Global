import React from 'react'

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-rose-600 mb-4">About HMH Global</h1>
      <p className="text-gray-700 leading-7 mb-6">
        HMH Global is a premium lifestyle brand committed to bringing you authentic, high-quality products at fair prices.
        We carefully curate our catalog and focus on a delightful customer experience from discovery to delivery.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100">
          <h3 className="font-bold text-rose-700 mb-2">Our Promise</h3>
          <p className="text-gray-700 text-sm">Authenticity, quality, and transparency in every order.</p>
        </div>
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100">
          <h3 className="font-bold text-rose-700 mb-2">Our Vision</h3>
          <p className="text-gray-700 text-sm">To be your trusted destination for premium products in the UK and beyond.</p>
        </div>
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100">
          <h3 className="font-bold text-rose-700 mb-2">Our Values</h3>
          <p className="text-gray-700 text-sm">Customer-first, integrity, and continuous improvement.</p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
