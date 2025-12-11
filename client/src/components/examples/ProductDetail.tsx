import ProductDetail from '../ProductDetail'
import coat from '@assets/generated_images/Black_cashmere_wool_coat_bdc7199b.png'

export default function ProductDetailExample() {
  return (
    <ProductDetail
      product={{
        id: "1",
        slug: "cashmere-wool-coat",
        name: "Cashmere Wool Coat",
        sku: "ATELIER-CWC-001",
        description: "Luxuriously crafted from the finest cashmere wool blend, this coat embodies timeless elegance. Featuring a classic silhouette with modern tailoring, it offers both warmth and sophistication for the contemporary wardrobe. The minimalist design ensures versatility across seasons.",
        category_id: null,
        brand: "ATELIER",
        size: null,
        colour: "Black",
        fabric_quality: "Premium Cashmere Wool",
        premium_segment: true,
        wash_care: "Dry clean only",
        imported_from: "Italy",
        cost_price: "450.00",
        price: "890.00",
        sale_price: "670.00",
        is_on_sale: true,
        stock_quantity: 10,
        low_stock_threshold: 5,
        images: [coat, coat, coat, coat],
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
      }}
      onAddToCart={(size) => console.log('Added to cart with size:', size)}
    />
  )
}
