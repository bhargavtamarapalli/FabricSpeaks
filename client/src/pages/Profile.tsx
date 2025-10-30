import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import AuthModal from "@/components/AuthModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, CreditCard, History } from "lucide-react";

export default function Profile() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cartItems] = useState<any[]>([]);

  const transactions = [
    { id: 'TXN-001', date: 'March 25, 2025', amount: 550, status: 'completed', method: 'Visa •••• 4242' },
    { id: 'TXN-002', date: 'March 20, 2025', amount: 780, status: 'completed', method: 'Mastercard •••• 5555' },
    { id: 'TXN-003', date: 'March 15, 2025', amount: 1090, status: 'completed', method: 'Visa •••• 4242' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 data-testid="text-profile-title" className="text-3xl font-light mb-8">
            My Account
          </h1>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="profile" className="transition-all duration-200">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="addresses" className="transition-all duration-200">
                <MapPin className="h-4 w-4 mr-2" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="payments" className="transition-all duration-200">
                <CreditCard className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="history" className="transition-all duration-200">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6 animate-in fade-in duration-300">
              <Card className="p-6">
                <h2 className="text-xl font-medium mb-6">Personal Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="uppercase text-xs tracking-wider">First Name</Label>
                      <Input id="firstName" defaultValue="John" data-testid="input-first-name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="uppercase text-xs tracking-wider">Last Name</Label>
                      <Input id="lastName" defaultValue="Doe" data-testid="input-last-name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="uppercase text-xs tracking-wider">Email</Label>
                    <Input id="email" type="email" defaultValue="john.doe@example.com" data-testid="input-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="uppercase text-xs tracking-wider">Phone</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" data-testid="input-phone" />
                  </div>
                  <Button className="w-full md:w-auto transition-all duration-200" data-testid="button-save-profile">
                    Save Changes
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="addresses" className="space-y-6 animate-in fade-in duration-300">
              <Card className="p-6 hover-elevate transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium mb-2">Home Address</h3>
                    <p className="text-sm text-muted-foreground">123 Fashion Street</p>
                    <p className="text-sm text-muted-foreground">New York, NY 10001</p>
                    <p className="text-sm text-muted-foreground">United States</p>
                  </div>
                  <Button variant="outline" size="sm" className="transition-all duration-200">Edit</Button>
                </div>
              </Card>
              <Button variant="outline" className="w-full transition-all duration-200" data-testid="button-add-address">
                + Add New Address
              </Button>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6 animate-in fade-in duration-300">
              <Card className="p-6 hover-elevate transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium mb-2">Visa ending in 4242</h3>
                    <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                  </div>
                  <Button variant="outline" size="sm" className="transition-all duration-200">Edit</Button>
                </div>
              </Card>
              <Button variant="outline" className="w-full transition-all duration-200" data-testid="button-add-payment">
                + Add Payment Method
              </Button>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 animate-in fade-in duration-300">
              {transactions.map((txn, index) => (
                <Card
                  key={txn.id}
                  className="p-6 hover-elevate transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`card-transaction-${txn.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-medium mb-1">{txn.id}</h3>
                      <p className="text-sm text-muted-foreground">{txn.date}</p>
                      <p className="text-sm text-muted-foreground mt-1">{txn.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-medium">${txn.amount}</p>
                      <p className="text-sm text-green-600 capitalize">{txn.status}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={() => {}}
        onRemoveItem={() => {}}
        onCheckout={() => console.log('Checkout clicked')}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={() => setIsAuthOpen(false)}
        onRegister={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
