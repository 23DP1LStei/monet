/**
 * Shared TypeScript types for API responses.
 * Mirrors the backend service return shapes.
 */

export interface ApiSpace {
  space_id: number;
  space_name: string;
  city: string;
  address: string;
  space_type: "hot-desk" | "dedicated" | "private-office" | "meeting-room";
  space_description?: string;
  available_spots: number;
  price_per_hour: number;
  price_per_day: number;
  price?: number;
  price_period?: string;
  is_instant_book: boolean;
  photo_path: string | null;
  average_rating: number | null;
  review_count: number;
  amenities?: string[];
  photos?: { photo_id: number; photo_path: string }[];
  creator?: { user_id: number; username: string };
  created_at?: string;
}

export interface ApiReview {
  review_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: { user_id: number; username: string; name: string };
}

export interface ApiReservation {
  reservation_id: number;
  reservation_type: "individual" | "group";
  guest_count: number;
  amount: number;
  start_time: string;
  end_time: string;
  reservation_status: "pending" | "confirmed" | "canceled";
  created_at: string;
  has_review?: boolean;
  space: {
    space_id: number;
    space_name: string;
    city: string;
    address: string;
    price_per_hour?: number;
    price_per_day?: number;
    space_type?: string;
    photo_path: string | null;
    host?: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

/** Unsplash fallback images by space type */
export const FALLBACK_IMAGES: Record<string, string[]> = {
  "hot-desk": [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
  ],
  "dedicated": [
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
  ],
  "private-office": [
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
  ],
  "meeting-room": [
    "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?auto=format&fit=crop&w=800&q=80",
  ],
};

export const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
];

/** Returns image array for a space — prefers DB photo_path, falls back by type */
export function getSpaceImages(space: ApiSpace): string[] {
  if (space.photos && space.photos.length > 0) {
    return space.photos.map(p => p.photo_path);
  }
  if (space.photo_path) return [space.photo_path];
  return FALLBACK_IMAGES[space.space_type] ?? DEFAULT_IMAGES;
}

export function getSpaceImage(space: ApiSpace): string {
  if (space.photo_path) return space.photo_path;
  return (FALLBACK_IMAGES[space.space_type] ?? DEFAULT_IMAGES)[0];
}

export const SPACE_TYPE_LABELS: Record<string, string> = {
  "hot-desk": "Hot Desk",
  "dedicated": "Dedicated Desk",
  "private-office": "Private Office",
  "meeting-room": "Meeting Room",
};

export interface AmenityDefinition {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  category: "essentials" | "productivity" | "comfort" | "facility";
}

export const AMENITIES_CATALOG: AmenityDefinition[] = [
  {
    id: "wifi",
    label: "1 Gbps Fiber Wi-Fi",
    shortLabel: "Fast Wi-Fi",
    description: "Ultra-fast dual-redundant fiber optic connection with zero jitter",
    iconName: "Wifi",
    category: "essentials",
  },
  {
    id: "coffee",
    label: "Specialty Coffee & Tea",
    shortLabel: "Artisan Coffee",
    description: "Unlimited artisan espresso, oat flat whites & organic teas",
    iconName: "Coffee",
    category: "comfort",
  },
  {
    id: "24/7",
    label: "24/7 Keyless Access",
    shortLabel: "24/7 Access",
    description: "Smart lock entry via mobile pass or personal keycode around the clock",
    iconName: "Clock",
    category: "essentials",
  },
  {
    id: "chair",
    label: "Ergonomic Chairs",
    shortLabel: "Ergonomics",
    description: "Herman Miller & Steelcase seating with active lumbar support",
    iconName: "Shield",
    category: "comfort",
  },
  {
    id: "phone_booth",
    label: "Acoustic Phone Booths",
    shortLabel: "Phone Booths",
    description: "Soundproof private calling pods for high-stakes Zoom calls",
    iconName: "PhoneCall",
    category: "productivity",
  },
  {
    id: "meeting_room",
    label: "Meeting & Conference Rooms",
    shortLabel: "Meeting Rooms",
    description: "Bookable presentation spaces with 4K screens & digital whiteboards",
    iconName: "Users",
    category: "productivity",
  },
  {
    id: "monitor",
    label: "4K External Monitors",
    shortLabel: "4K Monitors",
    description: "Dual-display setup ready with universal 90W USB-C docks",
    iconName: "Monitor",
    category: "productivity",
  },
  {
    id: "printer",
    label: "High-Speed Print & Scan",
    shortLabel: "Print & Scan",
    description: "Wireless laser color printing and high-res document scanning",
    iconName: "Printer",
    category: "productivity",
  },
  {
    id: "parking",
    label: "Dedicated Parking",
    shortLabel: "Parking",
    description: "Secure private parking with electric vehicle (EV) charging spots",
    iconName: "Car",
    category: "facility",
  },
  {
    id: "kitchen",
    label: "Fully Equipped Kitchen",
    shortLabel: "Kitchen",
    description: "Refrigerator, microwave, dishwasher, filtered water & tableware",
    iconName: "Utensils",
    category: "facility",
  },
  {
    id: "shower",
    label: "Showers & Lockers",
    shortLabel: "Showers",
    description: "Fresh towel service, private shower stalls & lockable day lockers",
    iconName: "Bath",
    category: "facility",
  },
  {
    id: "pet_friendly",
    label: "Pet Friendly",
    shortLabel: "Pet Friendly",
    description: "Well-behaved dogs and companions are warmly welcomed",
    iconName: "Dog",
    category: "comfort",
  },
  {
    id: "bike_storage",
    label: "Indoor Bike Storage",
    shortLabel: "Bike Storage",
    description: "Protected indoor bicycle racks with tools and floor tire pump",
    iconName: "Bike",
    category: "facility",
  },
  {
    id: "lounge",
    label: "Relax & Lounge Area",
    shortLabel: "Lounge",
    description: "Comfortable sofas, bean bags & casual break-out library",
    iconName: "Sparkles",
    category: "comfort",
  },
  {
    id: "projector",
    label: "4K Projector & AV",
    shortLabel: "Projector",
    description: "Cinema-grade projector with surround acoustic sound system",
    iconName: "Tv",
    category: "productivity",
  },
];

export function getAmenityInfo(id: string): AmenityDefinition {
  const normalized = id.toLowerCase().trim();
  const found = AMENITIES_CATALOG.find((a) => a.id.toLowerCase() === normalized);
  if (found) return found;

  const clean = normalized.replace(/[-_]/g, " ");
  return {
    id,
    label: clean.charAt(0).toUpperCase() + clean.slice(1),
    shortLabel: clean.charAt(0).toUpperCase() + clean.slice(1),
    description: "Included amenity verified for this location.",
    iconName: "Sparkles",
    category: "essentials",
  };
}
