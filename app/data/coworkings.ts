export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
}

export interface CoworkingSpace {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  images: string[];
  priceHour: number;
  priceDay: number;
  priceMonth: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  isInstantBook: boolean;
  description: string;
  amenities: string[];
  highlights: { icon: string; title: string; desc: string }[];
  rules: string[];
  reviews: Review[];
}

export const COWORKING_SPACES: CoworkingSpace[] = [
  {
    id: "monet-riga-andrejsala",
    name: "Andrejsala Workspace",
    city: "Riga",
    district: "Andrejsala",
    address: "Andrejostas iela 19, Riga, LV-1045",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 6,
    priceDay: 29,
    priceMonth: 299,
    rating: 4.97,
    reviewCount: 184,
    badge: "Top Pick",
    isInstantBook: true,
    description:
      "A converted 19th-century waterfront warehouse turned into one of Riga's most sought-after creative workspaces. Exposed brick walls, 5-metre ceilings, and floor-to-ceiling windows overlooking the Daugava river create an atmosphere that balances heritage character with modern productivity. Perfect for freelancers, remote teams, and creative professionals who refuse to settle for a generic desk.",
    amenities: [
      "1 Gbps fiber Wi-Fi",
      "Standing desks",
      "Herman Miller chairs",
      "4K monitors (upon request)",
      "Meeting rooms",
      "Specialty coffee bar",
      "Roof terrace",
      "Bike parking",
      "24h access",
      "Printing & scanning",
      "Phone booths",
      "Lockers",
    ],
    highlights: [
      { icon: "wifi", title: "1 Gbps dual-redundant fiber", desc: "Tested every Monday. Zero jitter on video calls and deploys." },
      { icon: "key", title: "Instant digital key", desc: "Book, get your code, walk in — under 60 seconds from confirmation." },
      { icon: "coffee", title: "Specialty coffee included", desc: "Flat whites and filter coffee from local roastery Rocket Bean, on the house." },
      { icon: "shield", title: "Verified by Monet", desc: "Passed our full 4-point quality inspection for space, connectivity, ergonomics, and service." },
    ],
    rules: [
      "No smoking anywhere on the premises",
      "Quiet zone on the 2nd floor after 14:00",
      "Guests must be registered at reception",
      "Pets welcome on the ground floor",
    ],
    reviews: [
      {
        id: "r1",
        author: "Marta K.",
        avatar: "https://i.pravatar.cc/48?img=47",
        rating: 5,
        date: "September 2026",
        text: "Hands down the best workspace I've used in the Baltics. The light is incredible in the morning, the coffee is genuinely good, and the internet never dropped once in three weeks.",
      },
      {
        id: "r2",
        author: "Tomas V.",
        avatar: "https://i.pravatar.cc/48?img=12",
        rating: 5,
        date: "August 2026",
        text: "Booked a day pass on a whim and ended up extending to the whole week. The standing desks are proper quality, Herman Miller chairs are the real deal. Will be my Riga HQ from now on.",
      },
      {
        id: "r3",
        author: "Elina R.",
        avatar: "https://i.pravatar.cc/48?img=32",
        rating: 5,
        date: "August 2026",
        text: "The rooftop terrace is a hidden gem. Took my calls up there with a view of the river. The space has a soul — you can tell it's designed by people who actually work.",
      },
      {
        id: "r4",
        author: "Janis B.",
        avatar: "https://i.pravatar.cc/48?img=53",
        rating: 4,
        date: "July 2026",
        text: "Excellent space overall. The only minor thing is parking can be tricky during peak hours, but bike parking is great. Everything else is flawless.",
      },
    ],
  },
  {
    id: "monet-riga-skanste",
    name: "Skanste Tech Hub",
    city: "Riga",
    district: "Skanste",
    address: "Skanstes iela 7, Riga, LV-1013",
    images: [
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 5,
    priceDay: 22,
    priceMonth: 249,
    rating: 4.92,
    reviewCount: 97,
    badge: "Trending",
    isInstantBook: true,
    description:
      "Riga's emerging Skanste tech district is home to this sleek, purpose-built coworking hub. Surrounded by the city's fastest-growing startup cluster, it's the ideal base for tech founders, developers, and product teams. Floor-to-ceiling glazing, an open atrium, and modular furniture that reconfigures for team sprints or solo deep work.",
    amenities: [
      "1 Gbps fiber Wi-Fi",
      "Adjustable standing desks",
      "Ergonomic seating",
      "3 meeting rooms",
      "Video conferencing setup",
      "Coffee & tea station",
      "Underground parking",
      "24h access",
      "Secure storage",
      "Printing",
    ],
    highlights: [
      { icon: "wifi", title: "Gigabit internet", desc: "Primary and backup fiber lines, 99.9% uptime SLA." },
      { icon: "key", title: "Instant access", desc: "Digital key delivered immediately on booking confirmation." },
      { icon: "coffee", title: "Coffee & snacks", desc: "Stocked kitchen with specialty coffee, teas, and light snacks throughout the day." },
      { icon: "shield", title: "Monet Verified", desc: "Full quality inspection passed — space, ergonomics, connectivity, and service." },
    ],
    rules: [
      "No smoking on premises",
      "Quiet zone in the north wing",
      "Visitor registration required",
    ],
    reviews: [
      {
        id: "r1",
        author: "Kristine L.",
        avatar: "https://i.pravatar.cc/48?img=21",
        rating: 5,
        date: "September 2026",
        text: "The perfect spot for our product sprint. Booked three desks for a week, the team loved the modular setup. Internet is rock solid.",
      },
      {
        id: "r2",
        author: "Andris M.",
        avatar: "https://i.pravatar.cc/48?img=8",
        rating: 5,
        date: "August 2026",
        text: "My go-to when I'm in Riga. Underground parking is a huge bonus. The coffee station is better than most cafés.",
      },
    ],
  },
  {
    id: "monet-tallinn-telliskivi",
    name: "Telliskivi Creative Desk",
    city: "Tallinn",
    district: "Telliskivi",
    address: "Telliskivi 60A, Tallinn, 10412",
    images: [
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 7,
    priceDay: 32,
    priceMonth: 320,
    rating: 4.98,
    reviewCount: 231,
    badge: "Superhost",
    isInstantBook: false,
    description:
      "Inside Tallinn's most vibrant creative quarter, this award-winning workspace occupies a beautifully restored Soviet-era factory building. The eclectic mix of exposed concrete, curated art installations, and warm Edison lighting attracts designers, writers, and digital nomads from across Europe. Surrounded by independent studios, galleries, and Tallinn's best coffee shops.",
    amenities: [
      "1 Gbps Wi-Fi",
      "Sit-stand desks",
      "Specialty coffee",
      "Art installations",
      "Courtyard garden",
      "Event space",
      "Lockers",
      "Printing",
      "Shower rooms",
      "Bike storage",
    ],
    highlights: [
      { icon: "wifi", title: "Fast & reliable internet", desc: "1 Gbps fiber, tested weekly." },
      { icon: "key", title: "Request-based booking", desc: "Host reviews each booking — usually approved within 2 hours." },
      { icon: "coffee", title: "Best coffee in Telliskivi", desc: "In-house espresso bar with beans from Nordic roasters." },
      { icon: "shield", title: "Superhost status", desc: "Top-rated space with 231 verified reviews and 4.98 average." },
    ],
    rules: [
      "No smoking",
      "Bring your own headphones for the open space",
      "Event bookings require 48h notice",
      "Dogs allowed in the courtyard only",
    ],
    reviews: [
      {
        id: "r1",
        author: "Laura S.",
        avatar: "https://i.pravatar.cc/48?img=44",
        rating: 5,
        date: "September 2026",
        text: "This place has the best atmosphere I've ever worked in. The art on the walls changes every month, the coffee is exceptional, and the courtyard is a dream in summer.",
      },
      {
        id: "r2",
        author: "Henrik J.",
        avatar: "https://i.pravatar.cc/48?img=15",
        rating: 5,
        date: "August 2026",
        text: "Flew to Tallinn for a client project and worked here for 10 days. Worth every cent. The shower room is a lifesaver after cycling in.",
      },
    ],
  },
  {
    id: "monet-vilnius-tech",
    name: "Vilnius Tech Park",
    city: "Vilnius",
    district: "Antakalnis",
    address: "Antakalnio g. 17, Vilnius, LT-10312",
    images: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 5,
    priceDay: 19,
    priceMonth: 220,
    rating: 4.89,
    reviewCount: 63,
    badge: undefined,
    isInstantBook: true,
    description:
      "Vilnius's most affordable premium coworking option, situated in the leafy Antakalnis district with easy access to the city centre. A calm, distraction-free environment designed for deep work — no trendy gimmicks, just excellent ergonomics, fast internet, and great coffee. Ideal for long-term remote workers and local startups looking for a serious work environment.",
    amenities: [
      "1 Gbps fiber",
      "Ergonomic chairs",
      "Standing desks (select zones)",
      "Coffee & tea",
      "Meeting room",
      "24h access",
      "Parking",
      "Lockers",
    ],
    highlights: [
      { icon: "wifi", title: "Gigabit fiber", desc: "Redundant connection, no throttling, unlimited bandwidth." },
      { icon: "key", title: "Book instantly", desc: "Access code sent within minutes of booking." },
      { icon: "coffee", title: "Great value", desc: "Premium workspace at the best price in the Baltics." },
      { icon: "shield", title: "Monet Verified", desc: "All quality checks passed." },
    ],
    rules: [
      "No smoking",
      "Quiet hours 09:00–12:00",
    ],
    reviews: [
      {
        id: "r1",
        author: "Rasa P.",
        avatar: "https://i.pravatar.cc/48?img=56",
        rating: 5,
        date: "August 2026",
        text: "Best value in Vilnius, no contest. Clean, quiet, fast internet. What else do you need?",
      },
    ],
  },
  {
    id: "monet-berlin-mitte",
    name: "Mitte Co-Studio",
    city: "Berlin",
    district: "Mitte",
    address: "Rosenthaler Str. 40, 10178 Berlin",
    images: [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 9,
    priceDay: 38,
    priceMonth: 420,
    rating: 4.95,
    reviewCount: 42,
    badge: "New",
    isInstantBook: true,
    description:
      "Newly opened in the heart of Berlin Mitte, steps from Hackescher Markt. This minimalist co-studio was designed by a Berlin architecture studio specialising in productive environments. White oak surfaces, Muuto pendant lighting, and a curation of live plants create a calm, premium atmosphere rarely found in the city's coworking scene. The rooftop is opening in October 2026.",
    amenities: [
      "1 Gbps symmetric fiber",
      "Muuto / Vitra furniture",
      "Standing desks",
      "3 phone booths",
      "2 meeting pods",
      "Nespresso + filter coffee",
      "Rooftop (opening Oct 2026)",
      "24h access",
      "Locker storage",
      "Near U-Bahn Weinmeisterstr.",
    ],
    highlights: [
      { icon: "wifi", title: "Symmetric gigabit fiber", desc: "1 Gbps up and down. Perfect for large file uploads and 4K video calls." },
      { icon: "key", title: "Instant Book", desc: "Access code sent the moment your booking is confirmed." },
      { icon: "coffee", title: "Nespresso & filter coffee", desc: "Unlimited coffee included in every booking." },
      { icon: "shield", title: "Designer-curated space", desc: "Designed by a Berlin architecture studio — verified by Monet." },
    ],
    rules: [
      "No smoking",
      "External guests by appointment",
      "Shared kitchen — please clean up",
    ],
    reviews: [
      {
        id: "r1",
        author: "Felix M.",
        avatar: "https://i.pravatar.cc/48?img=33",
        rating: 5,
        date: "September 2026",
        text: "Best new space in Mitte by a mile. The furniture quality is insane for the price. Already booked next month.",
      },
      {
        id: "r2",
        author: "Sophie W.",
        avatar: "https://i.pravatar.cc/48?img=29",
        rating: 5,
        date: "September 2026",
        text: "The phone booths are properly soundproofed. Internet is blazing fast. Can't wait for the rooftop to open.",
      },
    ],
  },
];
