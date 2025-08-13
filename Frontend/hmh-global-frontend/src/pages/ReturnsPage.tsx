import React from 'react'

const ReturnsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-rose-600 mb-4">Returns & Exchanges</h1>
      <p className="text-gray-700 mb-4">Shop with confidence. If something isn’t right, we’re here to help.</p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li>Returns accepted within 14 days of delivery.</li>
        <li>Items must be unopened and in original condition.</li>
        <li>Refunds are processed within 3-5 business days after inspection.</li>
        <li>Contact support before sending any return.</li>
      </ul>
    </div>
  )
}

export default ReturnsPage
