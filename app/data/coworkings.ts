export interface CoworkingSpace {
  id: string;
  name: string;
  city: string;
  district: string;
  images: string[];
  priceHour: number;
  priceDay: number;
  priceMonth: number;
  rating: number;
  badge?: string;
  isInstantBook: boolean;
}

export const COWORKING_SPACES: CoworkingSpace[] = [
  {
    id: "monet-riga-andrejsala",
    name: "Andrejsala Workspace",
    city: "Riga",
    district: "Andrejsala",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 6,
    priceDay: 29,
    priceMonth: 299,
    rating: 4.97,
    badge: "Top Pick",
    isInstantBook: true,
  },
  {
    id: "monet-riga-skanste",
    name: "Skanste Tech Hub",
    city: "Riga",
    district: "Skanste",
    images: [
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 5,
    priceDay: 22,
    priceMonth: 249,
    rating: 4.92,
    badge: "Trending",
    isInstantBook: true,
  },
  {
    id: "monet-tallinn-telliskivi",
    name: "Telliskivi Creative Desk",
    city: "Tallinn",
    district: "Telliskivi",
    images: [
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 7,
    priceDay: 32,
    priceMonth: 320,
    rating: 4.98,
    badge: "Superhost",
    isInstantBook: false,
  },
  {
    id: "monet-vilnius-tech",
    name: "Vilnius Tech Park",
    city: "Vilnius",
    district: "Antakalnis",
    images: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 5,
    priceDay: 19,
    priceMonth: 220,
    rating: 4.89,
    isInstantBook: true,
  },
  {
    id: "monet-berlin-mitte",
    name: "Mitte Co-Studio",
    city: "Berlin",
    district: "Mitte",
    images: [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 9,
    priceDay: 38,
    priceMonth: 420,
    rating: 4.95,
    badge: "New",
    isInstantBook: true,
  },
];
