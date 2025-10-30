import ProductGrid from '../ProductGrid'
import coat from '@assets/generated_images/Black_cashmere_wool_coat_bdc7199b.png'
import blouse from '@assets/generated_images/Beige_silk_blouse_aba3fb75.png'
import trousers from '@assets/generated_images/Navy_tailored_trousers_2971ff9f.png'
import bag from '@assets/generated_images/White_leather_handbag_a51b7fc1.png'
import sweater from '@assets/generated_images/Cream_knit_sweater_ea49eca8.png'
import boots from '@assets/generated_images/Black_leather_ankle_boots_5c2dfe3d.png'
import blazer from '@assets/generated_images/Grey_wool_blazer_cbc57447.png'

export default function ProductGridExample() {
  const products = [
    { id: '1', brand: 'ATELIER', name: 'Cashmere Wool Coat', price: 890, salePrice: 670, imageUrl: coat },
    { id: '2', brand: 'MAISON', name: 'Silk Blouse', price: 420, imageUrl: blouse, isNew: true },
    { id: '3', brand: 'ATELIER', name: 'Tailored Trousers', price: 350, imageUrl: trousers },
    { id: '4', brand: 'MAISON', name: 'Leather Handbag', price: 1200, imageUrl: bag, isNew: true },
    { id: '5', brand: 'ATELIER', name: 'Knit Sweater', price: 280, imageUrl: sweater },
    { id: '6', brand: 'MAISON', name: 'Leather Ankle Boots', price: 550, salePrice: 385, imageUrl: boots },
    { id: '7', brand: 'ATELIER', name: 'Wool Blazer', price: 780, imageUrl: blazer },
    { id: '8', brand: 'MAISON', name: 'Cashmere Coat', price: 950, imageUrl: coat },
  ]

  return <ProductGrid products={products} title="New Arrivals" />
}
