import React from 'react'

const FAQPage: React.FC = () => {
  const faqs = [
    { q: 'Are your products authentic?', a: 'Yes. We only sell 100% authentic products sourced from trusted suppliers.' },
    { q: 'What is your shipping time within the UK?', a: 'Orders are processed within 24 hours and typically delivered in 2-4 business days.' },
    { q: 'Do you ship internationally?', a: 'Yes, we ship to select countries. Shipping time and cost vary by destination.' },
    { q: 'What payment methods are accepted?', a: 'We accept major cards and secure online payments in GBP.' },
  ]
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-rose-600 mb-6">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((f, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-rose-50 border border-rose-100">
            <h3 className="font-bold text-rose-700">{f.q}</h3>
            <p className="text-gray-700 mt-1 text-sm">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FAQPage
