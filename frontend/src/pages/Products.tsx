import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  HeartIcon,
  EyeIcon,
  Square3Stack3DIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface Product {
  id: string
  name: string
  brand: string
  price: number
  image: string
  category: 'clothing' | 'glasses' | 'makeup'
  colors?: string[]
  liked?: boolean
}

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())

  // Mock product data
  const products: Product[] = [
    {
      id: '1',
      name: 'Classic White Shirt',
      brand: 'Aura Essentials',
      price: 89.99,
      image: '/api/placeholder/300/400',
      category: 'clothing',
      colors: ['#FFFFFF', '#F8F9FA', '#E9ECEF']
    },
    {
      id: '2',
      name: 'Aviator Sunglasses',
      brand: 'Aura Vision',
      price: 159.99,
      image: '/api/placeholder/300/300',
      category: 'glasses'
    },
    {
      id: '3',
      name: 'Coral Lipstick',
      brand: 'Aura Beauty',
      price: 24.99,
      image: '/api/placeholder/300/300',
      category: 'makeup',
      colors: ['#E6A08F', '#E8A89A', '#FF6B6B']
    },
    {
      id: '4',
      name: 'Denim Jacket',
      brand: 'Aura Denim',
      price: 129.99,
      image: '/api/placeholder/300/400',
      category: 'clothing',
      colors: ['#4A90E2', '#2C3E50', '#34495E']
    },
    {
      id: '5',
      name: 'Round Frame Glasses',
      brand: 'Aura Vision',
      price: 139.99,
      image: '/api/placeholder/300/300',
      category: 'glasses'
    },
    {
      id: '6',
      name: 'Matte Foundation',
      brand: 'Aura Beauty',
      price: 39.99,
      image: '/api/placeholder/300/300',
      category: 'makeup',
      colors: ['#F5DEB3', '#DEB887', '#D2B48C', '#CD853F']
    }
  ]

  const categories = [
    { id: 'all', name: 'All Products', icon: null },
    { id: 'clothing', name: 'Clothing', icon: Square3Stack3DIcon },
    { id: 'glasses', name: 'Glasses', icon: EyeIcon },
    { id: 'makeup', name: 'Makeup', icon: FaceSmileIcon }
  ]

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleLike = (productId: string) => {
    const newLiked = new Set(likedProducts)
    if (newLiked.has(productId)) {
      newLiked.delete(productId)
    } else {
      newLiked.add(productId)
    }
    setLikedProducts(newLiked)
  }

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gradient mb-4">
            Product Catalog
          </h1>
          <p className="text-lg text-neutral-medium max-w-2xl mx-auto">
            Discover our curated collection of clothing, glasses, and makeup products
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-medium" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2 bg-base-200 p-2 rounded-xl">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-neutral hover:bg-base-300'
                }`}
              >
                {category.icon && <category.icon className="w-4 h-4" />}
                <span className="font-medium text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="product-grid">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-aura group"
            >
              {/* Product Image */}
              <div className="relative overflow-hidden rounded-t-2xl aspect-square bg-base-200">
                <div className="w-full h-full bg-gradient-to-br from-aura-teal/20 to-aura-peach/20 flex items-center justify-center">
                  <div className="text-center">
                    {product.category === 'clothing' && <Square3Stack3DIcon className="w-16 h-16 text-aura-teal mx-auto mb-2" />}
                    {product.category === 'glasses' && <EyeIcon className="w-16 h-16 text-aura-peach mx-auto mb-2" />}
                    {product.category === 'makeup' && <FaceSmileIcon className="w-16 h-16 text-aura-purple mx-auto mb-2" />}
                    <p className="text-sm text-neutral-medium">Product Image</p>
                  </div>
                </div>
                
                {/* Like Button */}
                <button
                  onClick={() => toggleLike(product.id)}
                  className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  {likedProducts.has(product.id) ? (
                    <HeartSolidIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-neutral" />
                  )}
                </button>

                {/* Try On Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button className="btn btn-primary btn-sm">
                    Try On
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-neutral-medium">{product.brand}</p>
                </div>

                {/* Colors */}
                {product.colors && (
                  <div className="flex space-x-2 mb-3">
                    {product.colors.slice(0, 4).map((color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="w-6 h-6 rounded-full border-2 border-base-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    {product.colors.length > 4 && (
                      <div className="w-6 h-6 rounded-full border-2 border-base-300 bg-base-200 flex items-center justify-center">
                        <span className="text-xs text-neutral-medium">+{product.colors.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    ${product.price}
                  </span>
                  <div className="flex space-x-2">
                    <button className="btn btn-outline btn-sm">
                      View
                    </button>
                    <button className="btn btn-primary btn-sm">
                      Try On
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <MagnifyingGlassIcon className="w-16 h-16 text-neutral-medium mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-neutral-medium">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Load More */}
        {filteredProducts.length > 0 && (
          <div className="text-center mt-12">
            <button className="btn btn-outline btn-lg">
              Load More Products
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
