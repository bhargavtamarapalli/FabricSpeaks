import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { CartValidationError, CartValidationWarning } from "@server/types/cartValidation";

interface CartValidationBannerProps {
  errors?: CartValidationError[];
  warnings?: CartValidationWarning[];
  isLoading?: boolean;
  isValid?: boolean;
  onDismiss?: () => void;
}

/**
 * CartValidationBanner Component
 * Displays validation errors and warnings in an accessible banner
 * Shows stock issues, price changes, and adjustment recommendations
 */
export const CartValidationBanner: React.FC<CartValidationBannerProps> = ({
  errors = [],
  warnings = [],
  isLoading = false,
  isValid = true,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  // Filter out low_stock warnings - these are shown per-item now
  const criticalWarnings = warnings.filter(w => w.type !== 'low_stock');

  if (dismissed || (isValid && criticalWarnings.length === 0 && errors.length === 0)) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const errorCount = errors.length;
  const hasErrors = errorCount > 0;
  const hasWarnings = criticalWarnings.length > 0;

  return (
    <div
      className={`rounded-lg border p-4 mb-4 ${hasErrors
        ? "border-red-200 bg-red-50"
        : hasWarnings
          ? "border-yellow-200 bg-yellow-50"
          : "border-green-200 bg-green-50"
        }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : hasErrors ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : hasWarnings ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold ${hasErrors
              ? "text-red-900"
              : hasWarnings
                ? "text-yellow-900"
                : "text-green-900"
              }`}
          >
            {isLoading
              ? "Validating cart..."
              : hasErrors
                ? `Cart has ${errorCount} issue${errorCount > 1 ? "s" : ""}`
                : hasWarnings
                  ? "Warnings with your cart"
                  : "Cart is valid"}
          </h3>

          {/* Error Messages */}
          {hasErrors && (
            <ul className="mt-2 space-y-2">
              {errors.map((error, idx) => (
                <li key={idx} className="text-sm text-red-800">
                  <div className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <div>
                      <p className="font-medium">{getErrorTitle(error)}</p>
                      <p className="text-red-700">{error.message}</p>
                      {error.type === "quantity_exceeded" && (
                        <p className="text-xs text-red-600 mt-1">
                          Available: {error.available_quantity} | Requested:{" "}
                          {error.requested_quantity}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Warning Messages - Only critical warnings */}
          {hasWarnings && (
            <ul className="mt-2 space-y-2">
              {criticalWarnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-yellow-800">
                  <div className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <div>
                      <p className="font-medium">{getWarningTitle(warning)}</p>
                      <p className="text-yellow-700">{warning.message}</p>
                      {warning.type === "price_changed" && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Previous: ${Number(warning.previous_value || 0).toFixed(2)} |
                          Current: ${Number(warning.current_value || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Info Message */}
          {hasErrors && !hasWarnings && (
            <p className="mt-2 text-sm text-red-700">
              Please adjust your cart before proceeding to checkout.
            </p>
          )}

          {!hasErrors && hasWarnings && (
            <p className="mt-2 text-sm text-yellow-700">
              Your items are available, but you should review these warnings.
            </p>
          )}
        </div>

        {/* Dismiss Button */}
        {!isLoading && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <span className="sr-only">Dismiss</span>
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

interface CartItemStockStatusProps {
  itemId: string;
  productId: string;
  quantity: number;
  availableQuantity: number;
  unitPrice: number;
  isValidating?: boolean;
  onQuantityChange?: (newQuantity: number) => void;
}

/**
 * CartItemStockStatus Component
 * Displays stock status badge for individual cart items
 * Shows warnings and adjustment buttons
 */
export const CartItemStockStatus: React.FC<CartItemStockStatusProps> = ({
  itemId,
  productId,
  quantity,
  availableQuantity,
  unitPrice,
  isValidating = false,
  onQuantityChange,
}) => {
  const isOutOfStock = availableQuantity === 0;
  const isOverstock = quantity > availableQuantity;
  const isLowStock =
    availableQuantity > 0 &&
    availableQuantity <= 5 &&
    !isOutOfStock &&
    !isOverstock;

  const handleAdjustQuantity = () => {
    if (onQuantityChange && !isOutOfStock) {
      onQuantityChange(Math.min(quantity + 1, availableQuantity));
    }
  };

  const handleReduceQuantity = () => {
    if (onQuantityChange && quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleSetToMax = () => {
    if (onQuantityChange && availableQuantity > 0) {
      onQuantityChange(availableQuantity);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isValidating && (
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-xs text-blue-600">Checking stock...</span>
        </div>
      )}

      {isOutOfStock && !isValidating && (
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-xs font-medium text-red-600">Out of Stock</span>
        </div>
      )}

      {isOverstock && !isValidating && (
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-50 border border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-600">
              Only {availableQuantity} available
            </span>
          </div>
          <button
            onClick={handleSetToMax}
            className="px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100 rounded transition-colors"
            aria-label={`Adjust quantity to ${availableQuantity}`}
          >
            Adjust
          </button>
        </div>
      )}

      {isLowStock && !isValidating && (
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-200">
          <span className="text-amber-600">🔥</span>
          <span className="text-xs font-medium text-amber-700">
            Hurry! Only {availableQuantity} left
          </span>
        </div>
      )}

      {!isOutOfStock &&
        !isOverstock &&
        !isLowStock &&
        !isValidating &&
        availableQuantity > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-50 border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700">In Stock</span>
          </div>
        )}
    </div>
  );
};

interface StockStatusBadgeProps {
  status: "in_stock" | "low_stock" | "out_of_stock";
  quantity?: number;
  compact?: boolean;
}

/**
 * StockStatusBadge Component
 * Simple badge showing product stock status
 */
export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({
  status,
  quantity,
  compact = false,
}) => {
  const baseClasses = compact
    ? "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
    : "inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg border";

  const statusConfig = {
    in_stock: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      icon: <CheckCircle className="h-4 w-4" />,
      label: "In Stock",
    },
    low_stock: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      icon: <span>🔥</span>,
      label: quantity ? `Hurry! Only ${quantity} left` : "Limited Stock",
    },
    out_of_stock: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Out of Stock",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`${baseClasses} ${config.bg} ${compact ? "" : config.border} ${config.text}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

/**
 * Utility functions for formatting error and warning messages
 */
function getErrorTitle(error: CartValidationError): string {
  switch (error.type) {
    case "out_of_stock":
      return "Product Out of Stock";
    case "quantity_exceeded":
      return "Not Enough Stock";
    case "product_deleted":
      return "Product No Longer Available";
    default:
      return "Cart Error";
  }
}

function getWarningTitle(warning: CartValidationWarning): string {
  switch (warning.type) {
    case "low_stock":
      return "Limited Stock";
    case "price_changed":
      return "Price Changed";
    default:
      return "Cart Warning";
  }
}

export default {
  CartValidationBanner,
  CartItemStockStatus,
  StockStatusBadge,
};
