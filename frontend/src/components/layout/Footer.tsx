import { SparklesIcon } from '@heroicons/react/24/outline'

const Footer = () => {
  return (
    <footer className="bg-base-200 border-t border-base-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-aura-gradient rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-serif font-bold text-gradient">
                Aura
              </span>
            </div>
            <p className="text-gray-600 max-w-md">
              Transform online shopping with AR-powered virtual try-on for clothing, 
              glasses, and makeup. Shop with confidence, reduce returns, and discover 
              your perfect style.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-base-content mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/try-on" className="text-gray-600 hover:text-primary transition-colors">
                  Virtual Try-On
                </a>
              </li>
              <li>
                <a href="/products" className="text-gray-600 hover:text-primary transition-colors">
                  Products
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-600 hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-base-content mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-neutral-medium hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-medium hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-medium hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-base-300 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © 2025 Aura. All rights reserved.
          </p>
          <p className="text-gray-600 text-sm mt-2 md:mt-0">
            Built with ❤️ for the modern shopper
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
