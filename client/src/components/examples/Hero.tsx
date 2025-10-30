import Hero from '../Hero'
import heroImage from '@assets/generated_images/Fashion_editorial_hero_image_ab08c975.png'

export default function HeroExample() {
  return (
    <Hero
      title="Spring Collection 2025"
      subtitle="Discover timeless elegance with our curated selection"
      imageUrl={heroImage}
      ctaText="Explore Collection"
      ctaLink="/shop"
    />
  )
}
