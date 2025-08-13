import React from 'react'

const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-rose-600 mb-4">Contact Us</h1>
      <p className="text-gray-700 mb-6">We'd love to hear from you. Send us a message and our team will get back to you within 24 hours.</p>
      <form className="grid gap-4 bg-white p-6 rounded-2xl border border-rose-100">
        <input type="text" placeholder="Your Name" className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400" />
        <input type="email" placeholder="Your Email" className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400" />
        <input type="text" placeholder="Subject" className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400" />
        <textarea placeholder="Your Message" rows={6} className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400" />
        <button type="button" className="px-6 py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700">Send Message</button>
      </form>
      <div className="mt-8 text-sm text-gray-600">
        <p>Email: support@hmhglobal.com</p>
        <p>Phone: +44 20 1234 5678</p>
      </div>
    </div>
  )
}

export default ContactPage
