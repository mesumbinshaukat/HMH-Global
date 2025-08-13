import React from 'react'

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-baby-pink-50 to-white pt-24">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-commando-green-900 mb-6">
            About <span className="bg-gradient-to-r from-baby-pink-400 to-baby-pink-600 bg-clip-text text-transparent">HMH Global</span>
          </h1>
          <p className="text-xl text-commando-green-700 leading-7 mb-6 max-w-3xl mx-auto">
            HMH Global is a premium lifestyle brand committed to bringing you authentic, high-quality products at fair prices.
            We carefully curate our catalog and focus on a delightful customer experience from discovery to delivery.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-baby-pink-50 border border-baby-pink-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="font-bold text-commando-green-700 mb-2 text-lg">Our Promise</h3>
            <p className="text-commando-green-600 text-sm">Authenticity, quality, and transparency in every order.</p>
          </div>
          <div className="p-6 rounded-2xl bg-baby-pink-50 border border-baby-pink-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="font-bold text-commando-green-700 mb-2 text-lg">Our Vision</h3>
            <p className="text-commando-green-600 text-sm">To be your trusted destination for premium products in the UK and beyond.</p>
          </div>
          <div className="p-6 rounded-2xl bg-baby-pink-50 border border-baby-pink-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="font-bold text-commando-green-700 mb-2 text-lg">Our Values</h3>
            <p className="text-commando-green-600 text-sm">Customer-first, integrity, and continuous improvement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
