import ProductCard from '../ProductCard'
import productImage from '@assets/generated_images/Black_cashmere_wool_coat_bdc7199b.png'

export default function ProductCardExample() {
  return (
    <div className="max-w-sm">
      <ProductCard
        id="1"
        brand="ATELIER"
        name="Cashmere Wool Coat"
        price={890}
        salePrice={670}
        imageUrl={productImage}
        isNew={false}
      />
    </div>
  )
}
