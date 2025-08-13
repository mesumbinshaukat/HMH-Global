import React from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import contactService from '../services/contact'
import { toast } from 'sonner'
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Heart, Sparkles, ArrowRight } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

const ContactPage: React.FC = () => {
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    priority: 'medium' as const,
    category: 'general' as const
  })
  
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [focusedField, setFocusedField] = React.useState<string | null>(null)

  // Scroll-triggered animations
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = document.querySelectorAll('.fade-in-up')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await contactService.createContact({ ...formData })
      toast.success('🎉 Your message has been sent successfully! We\'ll get back to you soon.')
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general'  
      })
    } catch (error) {
      toast.error('❌ Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Contact Us - HMH Global | Get in Touch</title>
        <meta name="description" content="Contact HMH Global for premium products, customer support, and business inquiries. We're here to help you with all your needs." />
      </Helmet>
      
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background with Animated Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-hmh-gold-50">
          {/* Animated background elements */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-hmh-gold-200/20 rounded-full blur-3xl animate-pulse-gold"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-hmh-gold-300/15 rounded-full blur-3xl animate-pulse-gold" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hmh-gold-100/10 rounded-full blur-3xl animate-float"></div>
          
          {/* Geometric elements */}
          <div className="absolute top-1/4 right-1/4 w-24 h-24 border border-hmh-gold-400/30 rotate-45 animate-float-nike"></div>
          <div className="absolute bottom-1/3 left-1/4 w-16 h-16 border border-hmh-gold-500/40 rotate-12 animate-float-nike" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 pt-32 pb-16 text-center fade-in-up">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex justify-center animate-fade-in">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-hmh-gold-400 to-hmh-gold-600 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 p-4 rounded-full shadow-premium-xl transform group-hover:scale-110 transition-all duration-500">
                  <MessageSquare className="h-12 w-12 text-hmh-gold-600" />
                </div>
              </div>
            </div>
            
            <h1 className="text-responsive-lg font-black text-hmh-black-900 mb-6 tracking-tight leading-none">
              <span className="block text-reveal">GET IN</span>
              <span className="block bg-gradient-to-r from-hmh-gold-500 via-hmh-gold-600 to-hmh-gold-700 bg-clip-text text-transparent animate-pulse-gold">
                TOUCH
              </span>
            </h1>
            
            <p className="text-xl text-hmh-black-600 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
            
            <div className="flex items-center justify-center space-x-8 text-hmh-gold-500">
              <div className="flex items-center space-x-2 group">
                <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                <span className="text-sm font-bold uppercase tracking-wider group-hover:text-hmh-gold-400 transition-colors duration-300">Premium Support</span>
              </div>
              <div className="flex items-center space-x-2 group">
                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm font-bold uppercase tracking-wider group-hover:text-hmh-gold-400 transition-colors duration-300">Customer Care</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Contact Form Section */}
        <section className="relative z-10 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Contact Form */}
              <div className="lg:col-span-2 fade-in-up">
                <Card className="product-card group overflow-hidden shadow-premium-xl hover:shadow-premium-2xl transition-all duration-500">
                  <CardContent className="p-8 lg:p-12">
                    <div className="mb-8">
                      <h2 className="text-3xl font-black text-hmh-black-900 mb-4">
                        Send us a <span className="text-gradient">Message</span>
                      </h2>
                      <p className="text-hmh-black-600">Fill out the form below and we'll get back to you within 24 hours.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                          <Input 
                            name="firstName" 
                            value={formData.firstName} 
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('firstName')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="First Name" 
                            required
                            className={`transition-all duration-300 ${focusedField === 'firstName' ? 'ring-2 ring-hmh-gold-500 border-hmh-gold-500' : ''}`}
                          />
                        </div>
                        <div className="relative">
                          <Input 
                            name="lastName" 
                            value={formData.lastName} 
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('lastName')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Last Name" 
                            required
                            className={`transition-all duration-300 ${focusedField === 'lastName' ? 'ring-2 ring-hmh-gold-500 border-hmh-gold-500' : ''}`}
                          />
                        </div>
                      </div>
                      
                      {/* Contact Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                          <Input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Email Address" 
                            required
                            className={`transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-hmh-gold-500 border-hmh-gold-500' : ''}`}
                          />
                        </div>
                        <div className="relative">
                          <Input 
                            type="tel" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Phone Number (Optional)"
                            className={`transition-all duration-300 ${focusedField === 'phone' ? 'ring-2 ring-hmh-gold-500 border-hmh-gold-500' : ''}`}
                          />
                        </div>
                      </div>
                      
                      {/* Category and Priority */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                          <select 
                            name="category" 
                            value={formData.category} 
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-hmh-gold-500 focus:border-hmh-gold-500 transition-all duration-300 bg-white"
                          >
                            <option value="general">General Inquiry</option>
                            <option value="support">Customer Support</option>
                            <option value="sales">Sales</option>
                            <option value="complaint">Complaint</option>
                            <option value="partnership">Business Partnership</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="relative">
                          <select 
                            name="priority" 
                            value={formData.priority} 
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-hmh-gold-500 focus:border-hmh-gold-500 transition-all duration-300 bg-white"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Subject */}
                      <div className="relative">
                        <Input 
                          name="subject" 
                          value={formData.subject} 
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField('subject')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Subject" 
                          required
                          className={`transition-all duration-300 ${focusedField === 'subject' ? 'ring-2 ring-hmh-gold-500 border-hmh-gold-500' : ''}`}
                        />
                      </div>
                      
                      {/* Message */}
                      <div className="relative">
                        <Textarea 
                          name="message" 
                          value={formData.message} 
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField('message')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Your Message" 
                          rows={6} 
                          required
                          className={`transition-all duration-300 ${focusedField === 'message' ? 'ring-2 ring-hmh-gold-500 border-hmh-gold-500' : ''}`}
                        />
                      </div>
                      
                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-hmh-gold-500 to-hmh-gold-600 hover:from-hmh-gold-600 hover:to-hmh-gold-700 text-hmh-black-900 font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-premium hover:shadow-premium-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-hmh-black-900 mr-3"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              
              {/* Contact Information Cards */}
              <div className="space-y-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
                {/* Email Card */}
                <Card className="product-card group overflow-hidden hover:shadow-premium-xl transition-all duration-500">
                  <CardContent className="p-8 text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="relative group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-hmh-gold-400 to-hmh-gold-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 p-4 rounded-2xl">
                          <Mail className="h-8 w-8 text-hmh-gold-600" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-hmh-black-900 mb-2 group-hover:text-hmh-gold-600 transition-colors duration-300">Email Us</h3>
                    <p className="text-hmh-black-600 mb-4">Get in touch via email</p>
                    <a href="mailto:contact@hmhglobal.co.uk" className="text-hmh-gold-600 hover:text-hmh-gold-700 font-bold group-hover:underline transition-all duration-300">
                      contact@hmhglobal.co.uk
                    </a>
                  </CardContent>
                </Card>
                
                {/* Phone Card */}
                <Card className="product-card group overflow-hidden hover:shadow-premium-xl transition-all duration-500">
                  <CardContent className="p-8 text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="relative group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-hmh-gold-400 to-hmh-gold-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 p-4 rounded-2xl">
                          <Phone className="h-8 w-8 text-hmh-gold-600" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-hmh-black-900 mb-2 group-hover:text-hmh-gold-600 transition-colors duration-300">Call Us</h3>
                    <p className="text-hmh-black-600 mb-4">Speak directly with our team</p>
                    <a href="tel:+1-800-HMH-GLOBAL" className="text-hmh-gold-600 hover:text-hmh-gold-700 font-bold group-hover:underline transition-all duration-300">
                      1-800-HMH-GLOBAL
                    </a>
                  </CardContent>
                </Card>
                
                {/* Address Card */}
                <Card className="product-card group overflow-hidden hover:shadow-premium-xl transition-all duration-500">
                  <CardContent className="p-8 text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="relative group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-hmh-gold-400 to-hmh-gold-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 p-4 rounded-2xl">
                          <MapPin className="h-8 w-8 text-hmh-gold-600" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-hmh-black-900 mb-2 group-hover:text-hmh-gold-600 transition-colors duration-300">Visit Us</h3>
                    <p className="text-hmh-black-600 mb-4">Our headquarters</p>
                    <p className="text-hmh-gold-600 font-bold">
                      London, United Kingdom
                    </p>
                  </CardContent>
                </Card>
                
                {/* Hours Card */}
                <Card className="product-card group overflow-hidden hover:shadow-premium-xl transition-all duration-500">
                  <CardContent className="p-8 text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="relative group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-hmh-gold-400 to-hmh-gold-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 p-4 rounded-2xl">
                          <Clock className="h-8 w-8 text-hmh-gold-600" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-hmh-black-900 mb-2 group-hover:text-hmh-gold-600 transition-colors duration-300">Business Hours</h3>
                    <p className="text-hmh-black-600 mb-4">We're here to help</p>
                    <div className="text-hmh-gold-600 font-bold space-y-1">
                      <p>Mon - Fri: 9AM - 6PM</p>
                      <p>Sat: 10AM - 4PM</p>
                      <p>Sun: Closed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action Section */}
        <section className="relative z-10 py-16 fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Card className="product-card group overflow-hidden bg-gradient-to-br from-hmh-gold-50 to-hmh-gold-100 border-hmh-gold-200 hover:shadow-premium-xl transition-all duration-500">
              <CardContent className="p-12">
                <h2 className="text-3xl font-black text-hmh-black-900 mb-4">
                  Ready to Get <span className="text-gradient">Started?</span>
                </h2>
                <p className="text-xl text-hmh-black-600 mb-8 max-w-2xl mx-auto">
                  Explore our premium products and experience the HMH Global difference.
                </p>
                <Button 
                  className="bg-gradient-to-r from-hmh-gold-500 to-hmh-gold-600 hover:from-hmh-gold-600 hover:to-hmh-gold-700 text-hmh-black-900 font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-premium hover:shadow-premium-lg group"
                  onClick={() => window.location.href = '/products'}
                >
                  Shop Now
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  )
}

export default ContactPage

