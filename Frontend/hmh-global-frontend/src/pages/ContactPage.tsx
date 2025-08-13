import React from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Mail, Phone, MapPin, Send } from 'lucide-react'

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-baby-pink-50 to-white pt-24">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-commando-green-900 mb-6">
            Contact <span className="bg-gradient-to-r from-baby-pink-400 to-baby-pink-600 bg-clip-text text-transparent">Us</span>
          </h1>
          <p className="text-xl text-commando-green-700 mb-6 max-w-2xl mx-auto">
            We'd love to hear from you. Send us a message and our team will get back to you within 24 hours.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="md:col-span-1 space-y-6">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-commando-green-900 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-baby-pink-500" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-commando-green-600">support@hmhglobal.com</p>
              </CardContent>
            </Card>
            
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-commando-green-900 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-baby-pink-500" />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-commando-green-600">+44 20 1234 5678</p>
              </CardContent>
            </Card>
            
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-commando-green-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-baby-pink-500" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-commando-green-600">123 Premium Ave, Luxury City, LC 12345, UK</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-commando-green-900">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-commando-green-700">Your Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        className="border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900 placeholder-commando-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-commando-green-700">Your Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900 placeholder-commando-green-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-commando-green-700">Subject</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="Enter subject"
                      className="border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900 placeholder-commando-green-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-commando-green-700">Your Message</Label>
                    <textarea
                      id="message"
                      rows={6}
                      placeholder="Enter your message"
                      className="w-full p-3 border border-commando-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-baby-pink-200 focus:border-baby-pink-500 text-commando-green-900 placeholder-commando-green-500 resize-none"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-white rounded-full py-3 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
