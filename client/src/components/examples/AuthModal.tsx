import { useState } from 'react'
import AuthModal from '../AuthModal'
import { Button } from '@/components/ui/button'

export default function AuthModalExample() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Auth Modal</Button>
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onLogin={(email, password) => console.log('Login:', email, password)}
        onRegister={(email, password, name) => console.log('Register:', email, password, name)}
      />
    </div>
  )
}
