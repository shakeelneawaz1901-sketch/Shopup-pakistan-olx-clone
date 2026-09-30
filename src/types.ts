import type { Session } from '@supabase/supabase-js';

export type Ad = {
  id: string;
  title: string;
  price: number;
  city: string;
  category: string;
  subcategory: string | null;
  phone: string;
  description: string;
  image_url: string | null;
  images: string[] | null;
  latitude: number | null;
  longitude: number | null;
  user_id: string | null;
  created_at: string;
};

export type AdForm = {
  title: string;
  price: string;
  phone: string;
  city: string;
  category: string;
  subcategory: string;
  description: string;
};

export type Coords = { lat: number; lng: number };

export type Tab = 'home' | 'search' | 'chat' | 'myads' | 'account';

export type SortBy = 'newest' | 'low' | 'high' | 'near';

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  show_phone: boolean;
  created_at?: string;
};

export type Favourite = {
  id: string;
  user_id: string;
  ad_id: string;
  created_at: string;
};

export const CITIES = ['All Cities', 'Muridke', 'Lahore', 'Karachi', 'Islamabad', 'Gujranwala', 'Faisalabad'];

export const CATEGORIES = [
  'All Categories',
  'Mobiles', 'Vehicles', 'Property For Sale', 'Property For Rent',
  'Electronics', 'Bikes', 'Business Agriculture', 'Services',
  'Jobs', 'Animals', 'Furniture', 'Fashion', 'Books Sports',
  'Kids', 'Grocery Food',
];

export const SUBCATEGORIES: Record<string, string[]> = {
  'Mobiles': ['Smartphones', 'Tablets', 'Accessories', 'Smart Watches', 'Mobile Parts'],
  'Vehicles': ['Cars', 'Trucks', 'Buses', 'Tractors', 'Spare Parts', 'Boats'],
  'Property For Sale': ['Houses', 'Apartments', 'Plots', 'Commercial', 'Shops'],
  'Property For Rent': ['Houses', 'Apartments', 'Rooms', 'Shops', 'Offices'],
  'Electronics': ['TVs', 'Refrigerators', 'ACs', 'Washing Machines', 'Generators'],
  'Bikes': ['Motorcycles', 'Spare Parts', 'Bicycles', 'Scooters'],
  'Business Agriculture': ['Machinery', 'Livestock', 'Seeds', 'Fertilizer', 'Industrial'],
  'Services': ['Education', 'Travel', 'Health', 'Home Repair', 'Event Planning', 'Other Services'],
  'Jobs': ['Data Entry', 'Sales', 'Teacher', 'Driver', 'IT', 'Marketing', 'Other Jobs'],
  'Animals': ['Dogs', 'Cats', 'Birds', 'Fish', 'Horses', 'Livestock'],
  'Furniture': ['Sofas', 'Beds', 'Tables', 'Chairs', 'Cabinets', 'Office Furniture'],
  'Fashion': ['Clothes', 'Shoes', 'Watches', 'Bags', 'Jewelry', 'Cosmetics'],
  'Books Sports': ['Books', 'Sports Equipment', 'Musical Instruments', 'Games'],
  'Kids': ['Toys', 'Baby Gear', 'Kids Clothes', 'School Supplies'],
  'Grocery Food': ['Fresh Produce', 'Pantry', 'Beverages', 'Frozen Food', 'Bakery'],
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  ad_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export type Conversation = {
  other_user_id: string;
  ad_id: string;
  last_message: string;
  last_time: string;
  unread: number;
};

export const emptyForm: AdForm = {
  title: '', price: '', phone: '', city: 'Muridke', category: 'Mobiles', subcategory: '', description: '',
};

export const MAX_IMAGES = 5;

export type { Session };
