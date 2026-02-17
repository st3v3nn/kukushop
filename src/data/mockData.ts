import type { Order } from '@/lib/api';

// ============= ADMIN & RIDER MOCK DATA =============


export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'rider' | 'customer';
  phone?: string;
  avatar?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'available' | 'busy' | 'offline';
  currentOrder?: string;
  completedToday: number;
  rating: number;
  avatar?: string;
}

export interface AdminOrder extends Order {
  rider?: Rider;
  customerName: string;
  customerPhone: string;
}

// ============= PROMO BANNERS =============

export const promoBanners = [
  {
    title: 'Restaurant Specials!',
    subtitle: 'Try our Choma Special & Pilau',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    link: '/menu?category=d40d8611-f118-41c5-9329-17a8b5a8e21c', // Restaurant category
  },
  {
    title: 'Fresh from the Butchery',
    subtitle: 'Quality meat cuts at great prices',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
    link: '/menu?category=4bd8b74c-db3e-481b-9523-32caec7349b9', // Butchery category
  },
  {
    title: 'Fresh Groceries',
    subtitle: 'Farm-fresh produce delivered to you',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    link: '/menu?category=83b0fc2c-77b1-42ef-84f8-9ecdb522f7c6', // Groceries category
  },
];
