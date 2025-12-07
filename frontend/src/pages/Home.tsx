import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  SparklesIcon, 
  EyeIcon, 
  Square3Stack3DIcon, 
  FaceSmileIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const Home = () => {
  const features = [
    {
      icon: Square3Stack3DIcon,
      title: 'Clothing Try-On',
      description: 'See how clothes fit your body with real-time pose detection',
      color: 'text-aura-teal'
    },
    {
      icon: EyeIcon,
      title: 'Glasses Try-On',
      description: 'Find the perfect frames that complement your face shape',
      color: 'text-aura-peach'
    },
    {
      icon: FaceSmileIcon,
      title: 'Makeup Try-On',
      description: 'Experiment with colors and styles using facial landmarks',
      color: 'text-aura-purple'
    }
  ]

  const benefits = [
    'Reduce returns by 70%',
    'Shop with confidence',
    'Save time and money',
    'Sustainable shopping',
    'Perfect fit guarantee'
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-animated min-h-screen flex items-center">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <SparklesIcon className="w-16 h-16 text-white mx-auto mb-6" />
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
                Transform Your
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
                  Shopping Experience
                </span>
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                Say goodbye to the uncertainty of online shopping. With Aura's AR-powered 
                virtual try-on, see exactly how clothing, glasses, and makeup look on you 
                before you buy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/try-on"
                className="btn btn-lg bg-white text-aura-teal hover:bg-white/90 border-none"
              >
                Start Trying On
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/products"
                className="btn btn-lg btn-outline text-white border-white hover:bg-white hover:text-aura-teal"
              >
                Browse Products
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-base-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gradient mb-4">
              Virtual Try-On Categories
            </h2>
            <p className="text-lg text-neutral-medium max-w-2xl mx-auto">
              Experience the future of online shopping with our three core try-on categories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-aura p-8 text-center group hover:scale-105 transition-transform duration-300"
              >
                <feature.icon className={`w-12 h-12 mx-auto mb-4 ${feature.color}`} />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-neutral-medium">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                Why Choose <span className="text-gradient">Aura</span>?
              </h2>
              <p className="text-lg text-neutral-medium mb-8">
                We understand the frustration of online shopping. That's why we built 
                Aura to give you confidence in every purchase decision.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircleIcon className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-neutral">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-aura-gradient rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center text-white">
                  <SparklesIcon className="w-24 h-24 mx-auto mb-4" />
                  <h3 className="text-2xl font-serif font-bold mb-2">
                    Try Before You Buy
                  </h3>
                  <p className="text-white/90">
                    Experience products virtually with stunning accuracy
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-base-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Ready to Transform Your Shopping?
            </h2>
            <p className="text-lg text-neutral-medium mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have discovered the joy of 
              confident online shopping with Aura.
            </p>
            <Link
              to="/try-on"
              className="btn btn-aura btn-lg"
            >
              Start Your Virtual Try-On
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
