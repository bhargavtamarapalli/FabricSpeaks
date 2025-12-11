import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface BannerContent {
  title: string;
  description: string;
  mediaUrl: string;
  mobileMediaUrl?: string;
  mediaType: 'image' | 'video';
  ctaText?: string;
  ctaLink?: string;
  align?: 'left' | 'center' | 'right';
  textColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

export interface Banner {
  id: string;
  type: string;
  content: BannerContent;
  display_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export function useBanners() {
  return useQuery({
    queryKey: ['banners', 'active'],
    queryFn: async () => {
      // Fetch active banners from the public API
      // The backend already handles priority sorting (display_order ASC) and start/end date filtering
      const banners = await api.get<Banner[]>('/api/banners/active');
      return banners || [];
    },
    // Cache for 1 minute to allow relatively quick updates while avoiding spamming the server
    staleTime: 60 * 1000, 
    refetchOnWindowFocus: false,
  });
}
