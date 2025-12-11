/**
 * Sales By Region Component
 * 
 * Widget to display sales distribution by geography.
 * Features:
 * - List of top regions
 * - Percentage bars
 * - Sales volume
 * 
 * @example
 * <SalesByRegion data={data} />
 */

import { cn, formatCurrency } from '@/lib/admin/utils';

export interface RegionData {
  region: string;
  sales: number;
  percentage: number;
}

export interface SalesByRegionProps {
  /** Regional data */
  data: RegionData[];
  
  /** Additional CSS classes */
  className?: string;
}

export function SalesByRegion({ data, className }: SalesByRegionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {data.map((item, index) => (
        <div key={item.region} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-white">{item.region}</span>
            <span className="text-slate-400">{formatCurrency(item.sales)}</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={cn(
                "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
                index === 0 ? "bg-indigo-500" :
                index === 1 ? "bg-pink-500" :
                index === 2 ? "bg-purple-500" :
                "bg-slate-600"
              )}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
          <div className="text-right text-xs text-slate-500">
            {item.percentage}% of total sales
          </div>
        </div>
      ))}
    </div>
  );
}
