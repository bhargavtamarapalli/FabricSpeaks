import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import ProductPage from "@/pages/ProductPage";
import Orders from "@/pages/Orders";
import Profile from "@/pages/Profile";
import Clothing from "@/pages/Clothing";
import Accessories from "@/pages/Accessories";
import NewArrivals from "@/pages/NewArrivals";
import Sale from "@/pages/Sale";
import Checkout from "@/pages/Checkout";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/orders" component={Orders} />
      <Route path="/profile" component={Profile} />
      <Route path="/clothing" component={Clothing} />
      <Route path="/accessories" component={Accessories} />
      <Route path="/new-arrivals" component={NewArrivals} />
      <Route path="/sale" component={Sale} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
