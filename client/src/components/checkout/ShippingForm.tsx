import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import type { ShippingInfo, AddressData, SavedAddress } from "@/types/checkout";
import { AlertCircle } from "lucide-react";

// Country options (simplified for demo)
const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "IN", label: "India" },
];

interface ShippingFormProps {
  form: UseFormReturn<ShippingInfo>;
  savedAddresses?: SavedAddress[];
  onSubmit: (data: ShippingInfo) => void;
  isSubmitting?: boolean;
  errors?: string[];
}

export function ShippingForm({
  form,
  savedAddresses = [],
  onSubmit,
  isSubmitting = false,
  errors = []
}: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors: formErrors, isValid },
    setValue,
    watch
  } = form;

  const sameAsBilling = watch("sameAsBilling");

  const handleSavedAddressSelect = (address: AddressData) => {
    setValue("firstName", address.firstName);
    setValue("lastName", address.lastName);
    setValue("email", address.email);
    setValue("phone", address.phone || "");
    setValue("addressLine1", address.addressLine1);
    setValue("addressLine2", address.addressLine2 || "");
    setValue("city", address.city);
    setValue("state", address.state);
    setValue("postalCode", address.postalCode);
    setValue("country", address.country);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select saved shipping address</Label>
            <div className="grid gap-2">
              {savedAddresses.map((address) => (
                <Button
                  key={address.id || Math.random()}
                  variant="outline"
                  className="justify-start text-left h-auto p-3"
                  onClick={() => handleSavedAddressSelect(address)}
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      {address.firstName} {address.lastName}
                    </div>
                    <div className="text-muted-foreground">
                      {address.addressLine1}, {address.city}, {address.state} {address.postalCode}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">or enter new address below</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  {...register("firstName")}
                  id="firstName"
                  placeholder="John"
                  className={formErrors.firstName ? "border-red-500" : ""}
                />
                {formErrors.firstName && (
                  <p className="text-sm text-red-600">{formErrors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  {...register("lastName")}
                  id="lastName"
                  placeholder="Doe"
                  className={formErrors.lastName ? "border-red-500" : ""}
                />
                {formErrors.lastName && (
                  <p className="text-sm text-red-600">{formErrors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="john@example.com"
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-red-600">{formErrors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                {...register("phone")}
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                className={formErrors.phone ? "border-red-500" : ""}
              />
              {formErrors.phone && (
                <p className="text-sm text-red-600">{formErrors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping Address</h3>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Street Address *</Label>
              <Input
                {...register("addressLine1")}
                id="addressLine1"
                placeholder="123 Main Street"
                className={formErrors.addressLine1 ? "border-red-500" : ""}
              />
              {formErrors.addressLine1 && (
                <p className="text-sm text-red-600">{formErrors.addressLine1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Apartment, suite, etc. (optional)</Label>
              <Input
                {...register("addressLine2")}
                id="addressLine2"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  {...register("city")}
                  id="city"
                  placeholder="New York"
                  className={formErrors.city ? "border-red-500" : ""}
                />
                {formErrors.city && (
                  <p className="text-sm text-red-600">{formErrors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  {...register("state")}
                  id="state"
                  placeholder="NY"
                  className={formErrors.state ? "border-red-500" : ""}
                />
                {formErrors.state && (
                  <p className="text-sm text-red-600">{formErrors.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">ZIP/Postal Code *</Label>
                <Input
                  {...register("postalCode")}
                  id="postalCode"
                  placeholder="10001"
                  className={formErrors.postalCode ? "border-red-500" : ""}
                />
                {formErrors.postalCode && (
                  <p className="text-sm text-red-600">{formErrors.postalCode.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className={formErrors.country ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {formErrors.country && (
                <p className="text-sm text-red-600">{formErrors.country.message}</p>
              )}
            </div>
          </div>

          {/* Billing Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="sameAsBilling"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="sameAsBilling"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="sameAsBilling"
                className="text-sm font-normal cursor-pointer"
              >
                Use this address for billing
              </Label>
            </div>
          </div>

          {/* General errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Continue to Payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
