import { useState } from 'react'
import ShoppingCart from '../ShoppingCart'
import coat from '@assets/generated_images/Black_cashmere_wool_coat_bdc7199b.png'
import blouse from '@assets/generated_images/Beige_silk_blouse_aba3fb75.png'
import { Button } from '@/components/ui/button'

export default function ShoppingCartExample() {
  const [isOpen, setIsOpen] = useState(true)
  const [items, setItems] = useState([
    { id: '1', name: 'Cashmere Wool Coat', brand: 'ATELIER', price: 670, quantity: 1, size: 'M', imageUrl: coat },
    { id: '2', name: 'Silk Blouse', brand: 'MAISON', price: 420, quantity: 2, size: 'S', imageUrl: blouse },
  ])

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setItems(items.map(item => item.id === id ? { ...item, quantity } : item))
    console.log('Updated quantity:', id, quantity)
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    console.log('Removed item:', id)
  }

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Cart</Button>
      <ShoppingCart
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => console.log('Checkout clicked')}
      />
    </div>
  )
}
