import ProductDetail from '../ProductDetail'
import coat from '@assets/generated_images/Black_cashmere_wool_coat_bdc7199b.png'

export default function ProductDetailExample() {
  return (
    <ProductDetail
      brand="ATELIER"
      name="Cashmere Wool Coat"
      price={890}
      salePrice={670}
      description="Luxuriously crafted from the finest cashmere wool blend, this coat embodies timeless elegance. Featuring a classic silhouette with modern tailoring, it offers both warmth and sophistication for the contemporary wardrobe. The minimalist design ensures versatility across seasons."
      images={[coat, coat, coat, coat]}
      sizes={["XS", "S", "M", "L", "XL"]}
      onAddToCart={(size) => console.log('Added to cart with size:', size)}
    />
  )
}
