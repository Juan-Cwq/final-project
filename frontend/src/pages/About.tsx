import { motion } from 'framer-motion'
import { 
  SparklesIcon,
  UserGroupIcon,
  LightBulbIcon,
  HeartIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const About = () => {
  const values = [
    {
      icon: SparklesIcon,
      title: 'Innovation',
      description: 'Pushing the boundaries of AR technology to create magical shopping experiences'
    },
    {
      icon: HeartIcon,
      title: 'Empathy',
      description: 'Understanding and solving real problems that modern shoppers face every day'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Trust',
      description: 'Building reliable technology that users can depend on for confident decisions'
    },
    {
      icon: GlobeAltIcon,
      title: 'Sustainability',
      description: 'Reducing returns and waste to create a more sustainable fashion industry'
    }
  ]

  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-founder',
      bio: 'Former fashion buyer turned tech entrepreneur, passionate about solving online shopping frustrations.',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'CTO & Co-founder',
      bio: 'Computer vision expert with 10+ years in AR/VR development at leading tech companies.',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Emily Watson',
      role: 'Head of Design',
      bio: 'Award-winning UX designer focused on creating intuitive and delightful user experiences.',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'David Kim',
      role: 'Lead Engineer',
      bio: 'Full-stack developer specializing in real-time computer vision and machine learning.',
      image: '/api/placeholder/150/150'
    }
  ]

  const stats = [
    { number: '10M+', label: 'Try-ons processed' },
    { number: '70%', label: 'Reduction in returns' },
    { number: '500+', label: 'Brand partners' },
    { number: '99.9%', label: 'Uptime reliability' }
  ]

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-aura-teal/10 to-aura-purple/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <SparklesIcon className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gradient mb-6">
                About Aura
              </h1>
              <p className="text-xl text-neutral-medium max-w-3xl mx-auto leading-relaxed">
                We're on a mission to transform online shopping by eliminating uncertainty 
                and empowering confident purchase decisions through cutting-edge AR technology.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-lg text-neutral-medium">
                <p>
                  Aura was born from a simple frustration: the endless cycle of ordering, 
                  trying, and returning clothes that never quite fit right. Our founder, 
                  Sarah, experienced this firsthand as a fashion buyer who understood both 
                  sides of the problem.
                </p>
                <p>
                  After countless conversations with friends who shared the same struggles, 
                  we realized this wasn't just a personal problem—it was a universal pain 
                  point affecting millions of online shoppers worldwide.
                </p>
                <p>
                  That's when we decided to build Aura: a platform that uses advanced 
                  computer vision and AR technology to let you see exactly how products 
                  look on you before you buy them.
                </p>
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
                  <LightBulbIcon className="w-24 h-24 mx-auto mb-4" />
                  <h3 className="text-2xl font-serif font-bold mb-2">
                    The Idea
                  </h3>
                  <p className="text-white/90">
                    What if you could try before you buy, from anywhere?
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gradient mb-4">
              Our Values
            </h2>
            <p className="text-lg text-neutral-medium max-w-2xl mx-auto">
              The principles that guide everything we do at Aura
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-aura p-6 text-center"
              >
                <value.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-neutral-medium">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gradient mb-4">
              Impact by Numbers
            </h2>
            <p className="text-lg text-neutral-medium">
              The difference we're making in online shopping
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                  {stat.number}
                </div>
                <div className="text-neutral-medium font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gradient mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-neutral-medium">
              The passionate people behind Aura's innovation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-aura p-6 text-center"
              >
                <div className="w-24 h-24 bg-aura-gradient rounded-full mx-auto mb-4 flex items-center justify-center">
                  <UserGroupIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-sm text-neutral-medium">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Join the Future of Shopping
            </h2>
            <p className="text-lg text-neutral-medium mb-8 max-w-2xl mx-auto">
              Experience the confidence that comes with knowing exactly how products 
              will look on you before you buy them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/try-on" className="btn btn-aura btn-lg">
                Try Aura Now
              </a>
              <a href="/products" className="btn btn-outline btn-lg">
                Browse Products
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default About
