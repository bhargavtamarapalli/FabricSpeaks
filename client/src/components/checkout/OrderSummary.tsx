import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Receipt, DollarSign } from "lucide-react";
import type { OrderSummary as OrderSummaryType, ShippingInfo } from "@/types/checkout";
import { formatCurrency, formatAddressForDisplay } from "@/lib/checkout-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderSummaryProps {
  orderSummary: OrderSummaryType;
  shippingInfo?: ShippingInfo;
  showPayment?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function OrderSummary({
  orderSummary,
  shippingInfo,
  showPayment = false,
  isLoading = false,
  className
}: OrderSummaryProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Separator />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orderSummary) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No order to display</h3>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items ({orderSummary.items.length})
            </h3>
            <div className="space-y-3">
              {orderSummary.items.map((item) => (
                <div key={item.id || `item-${Math.random()}`} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Size: {item.size}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Qty: {item.quantity}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(item.totalPrice)}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pricing Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-medium">{formatCurrency(orderSummary.subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Truck className="h-4 w-4" />
                Shipping
              </span>
              <span className="text-sm font-medium">{formatCurrency(orderSummary.shipping)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax</span>
              <span className="text-sm font-medium">{formatCurrency(orderSummary.tax)}</span>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-medium">
            <span className="flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              Total
            </span>
            <span>{formatCurrency(orderSummary.total)}</span>
          </div>

          {/* Shipping Information */}
          {shippingInfo && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Shipping Address
                </h3>
                <div className="text-sm bg-muted/50 p-3 rounded-lg">
                  <div className="font-medium mb-2">
                    {shippingInfo.firstName} {shippingInfo.lastName}
                  </div>
                  <div className="text-muted-foreground whitespace-pre-line">
                    {formatAddressForDisplay({
                      first_name: shippingInfo.firstName,
                      last_name: shippingInfo.lastName,
                      address_line_1: shippingInfo.addressLine1,
                      address_line_2: shippingInfo.addressLine2,
                      city: shippingInfo.city,
                      state: shippingInfo.state,
                      postal_code: shippingInfo.postalCode,
                      country: shippingInfo.country,
                      phone: shippingInfo.phone,
                    })}
                  </div>
                  {shippingInfo.email && (
                    <div className="text-muted-foreground mt-1">{shippingInfo.email}</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Payment Information */}
          {showPayment && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Method
                </h3>
                <div className="text-sm bg-muted/50 p-3 rounded-lg">
                  <div className="font-medium">Razorpay</div>
                  <div className="text-muted-foreground">Secure payment via Razorpay</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
