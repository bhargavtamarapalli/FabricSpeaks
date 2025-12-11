type EventName = 
  | "view_item"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "search"
  | "login"
  | "sign_up";

interface AnalyticsEvent {
  name: EventName;
  params?: Record<string, any>;
}

class AnalyticsService {
  private initialized = false;
  private debug = process.env.NODE_ENV === "development";

  init(measurementId?: string) {
    if (this.initialized) return;
    
    if (measurementId) {
      // Initialize GA4 here
      console.log(`[Analytics] Initialized with ID: ${measurementId}`);
    }
    
    this.initialized = true;
  }

  logEvent({ name, params }: AnalyticsEvent) {
    if (this.debug) {
      console.log(`[Analytics] ${name}:`, params);
    }

    // Send to GA4 if initialized
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, params);
    }
  }

  viewItem(product: any) {
    this.logEvent({
      name: "view_item",
      params: {
        currency: "USD",
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price
        }]
      }
    });
  }

  addToCart(product: any, quantity: number) {
    this.logEvent({
      name: "add_to_cart",
      params: {
        currency: "USD",
        value: product.price * quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          quantity
        }]
      }
    });
  }
}

export const analytics = new AnalyticsService();
