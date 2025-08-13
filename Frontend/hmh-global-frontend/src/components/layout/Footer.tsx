import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight, Heart, Sparkles, Zap, Shield, Truck, Star, Globe, Award, Users, Clock } from 'lucide-react'
import logo from '../../logo.jpeg'

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-commando-green-900 via-commando-green-800 to-commando-green-700 text-white relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSI3IiBjeT0iNyIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')]" />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-baby-pink-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-baby-pink-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-baby-pink-200/30 rounded-full blur-3xl animate-float"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Enhanced Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 fade-in-up">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-baby-pink-400 to-baby-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
              <Users className="w-8 h-8 text-commando-green-900" />
            </div>
            <div className="text-3xl font-black text-baby-pink-500 mb-2 group-hover:scale-110 transition-transform duration-300">10K+</div>
            <div className="text-gray-400 text-sm uppercase tracking-wider font-bold group-hover:text-baby-pink-400 transition-colors duration-300">Happy Customers</div>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-baby-pink-400 to-baby-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
              <Award className="w-8 h-8 text-commando-green-900" />
            </div>
            <div className="text-3xl font-black text-baby-pink-500 mb-2 group-hover:scale-110 transition-transform duration-300">500+</div>
            <div className="text-gray-400 text-sm uppercase tracking-wider font-bold group-hover:text-baby-pink-400 transition-colors duration-300">Premium Products</div>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-baby-pink-400 to-baby-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
              <Globe className="w-8 h-8 text-commando-green-900" />
            </div>
            <div className="text-3xl font-black text-baby-pink-500 mb-2 group-hover:scale-110 transition-transform duration-300">50+</div>
            <div className="text-gray-400 text-sm uppercase tracking-wider font-bold group-hover:text-baby-pink-400 transition-colors duration-300">Countries Worldwide</div>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-baby-pink-400 to-baby-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
              <Clock className="w-8 h-8 text-commando-green-900" />
            </div>
            <div className="text-3xl font-black text-baby-pink-500 mb-2 group-hover:scale-110 transition-transform duration-300">24/7</div>
            <div className="text-gray-400 text-sm uppercase tracking-wider font-bold group-hover:text-baby-pink-400 transition-colors duration-300">Customer Support</div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Enhanced Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6 group">
              <div className="bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 p-3 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-premium">
                <img src={logo} alt="HMH Global" className="h-10 w-auto" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-baby-pink-400 transition-colors duration-300">HMH Global</h3>
                <p className="text-xs text-baby-pink-400 uppercase tracking-wider font-bold">Premium Lifestyle</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your trusted partner for premium quality products and exceptional service. We deliver excellence in every detail.
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center space-x-3 group">
                <Mail className="w-4 h-4 text-baby-pink-500 group-hover:scale-110 transition-transform duration-300" />
                <span className="group-hover:text-baby-pink-400 transition-colors duration-300">info@hmhglobal.com</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <Phone className="w-4 h-4 text-baby-pink-500 group-hover:scale-110 transition-transform duration-300" />
                <span className="group-hover:text-baby-pink-400 transition-colors duration-300">+1 (800) HMH-GLOBAL</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <MapPin className="w-4 h-4 text-baby-pink-500 group-hover:scale-110 transition-transform duration-300" />
                <span className="group-hover:text-baby-pink-400 transition-colors duration-300">123 Premium Ave, Luxury City, LC 12345</span>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center group">
              <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
              Quick Links
              <div className="w-8 h-0.5 bg-baby-pink-500 ml-3 group-hover:w-12 transition-all duration-300"></div>
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li>
                <Link to="/products" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/blog" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Enhanced Customer Service */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center group">
              <Shield className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Customer Service
              <div className="w-8 h-0.5 bg-baby-pink-500 ml-3 group-hover:w-12 transition-all duration-300"></div>
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li>
                <Link to="/shipping" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  Size Guide
                </Link>
              </li>
              <li>
                <Link to="/support" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  Support
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="flex items-center hover:text-baby-pink-400 transition-all duration-300 group">
                  <ArrowRight className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Enhanced Newsletter & Social */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center group">
              <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Stay Connected
              <div className="w-8 h-0.5 bg-baby-pink-500 ml-3 group-hover:w-12 transition-all duration-300"></div>
            </h3>
            <p className="text-gray-300 mb-4 text-sm">
              Subscribe to our newsletter for exclusive offers and updates.
            </p>
            <div className="mb-6">
              <div className="flex group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-commando-green-800 border border-commando-green-700 text-white placeholder-gray-400 rounded-l-full focus:outline-none focus:border-baby-pink-500 transition-all duration-300 group-hover:bg-commando-green-700"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 text-white font-bold rounded-r-full hover:from-baby-pink-600 hover:to-baby-pink-700 transition-all duration-300 transform hover:scale-105 shadow-premium">
                  Subscribe
                </button>
              </div>
            </div>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-commando-green-800 rounded-full flex items-center justify-center text-gray-400 hover:text-baby-pink-400 hover:bg-commando-green-700 transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-premium">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-commando-green-800 rounded-full flex items-center justify-center text-gray-400 hover:text-baby-pink-400 hover:bg-commando-green-700 transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-premium">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-commando-green-800 rounded-full flex items-center justify-center text-gray-400 hover:text-baby-pink-400 hover:bg-commando-green-700 transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-premium">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-commando-green-800 rounded-full flex items-center justify-center text-gray-400 hover:text-baby-pink-400 hover:bg-commando-green-700 transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-premium">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Section */}
        <div className="border-t border-commando-green-700 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-8">
              <p className="text-gray-400 text-sm">
                2025 HMH Global. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <Link to="/privacy" className="text-gray-400 hover:text-baby-pink-400 transition-colors duration-300 group">
                  <span className="group-hover:underline">Privacy Policy</span>
                </Link>
                <Link to="/terms" className="text-gray-400 hover:text-baby-pink-400 transition-colors duration-300 group">
                  <span className="group-hover:underline">Terms of Service</span>
                </Link>
                <Link to="/cookies" className="text-gray-400 hover:text-baby-pink-400 transition-colors duration-300 group">
                  <span className="group-hover:underline">Cookie Policy</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm group">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current group-hover:scale-110 group-hover:animate-pulse transition-all duration-300" />
              <span>for premium experiences</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
