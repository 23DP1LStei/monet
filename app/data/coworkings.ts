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
    priceHour: 6, priceDay: 29, priceMonth: 299,
    rating: 4.97, reviewCount: 184, badge: "Top Pick", isInstantBook: true,
    description: "A converted 19th-century waterfront warehouse turned into one of Riga's most sought-after creative workspaces. Exposed brick walls, 5-metre ceilings, and floor-to-ceiling windows overlooking the Daugava river create an atmosphere that balances heritage character with modern productivity. Perfect for freelancers, remote teams, and creative professionals who refuse to settle for a generic desk.",
    amenities: ["1 Gbps fiber Wi-Fi","Standing desks","Herman Miller chairs","4K monitors (upon request)","Meeting rooms","Specialty coffee bar","Roof terrace","Bike parking","24h access","Printing & scanning","Phone booths","Lockers"],
    highlights: [
      { icon: "wifi",   title: "1 Gbps dual-redundant fiber",  desc: "Tested every Monday. Zero jitter on video calls and deploys." },
      { icon: "key",    title: "Instant digital key",          desc: "Book, get your code, walk in - under 60 seconds from confirmation." },
      { icon: "coffee", title: "Specialty coffee included",    desc: "Flat whites and filter coffee from local roastery Rocket Bean, on the house." },
      { icon: "shield", title: "Verified by Monet",            desc: "Passed our full 4-point quality inspection for space, connectivity, ergonomics, and service." },
    ],
    rules: ["No smoking anywhere on the premises","Quiet zone on the 2nd floor after 14:00","Guests must be registered at reception","Pets welcome on the ground floor"],
    reviews: [
      { id: "r1", author: "Marta K.", avatar: "https://i.pravatar.cc/48?img=47", rating: 5, date: "September 2026", text: "Hands down the best workspace I have used in the Baltics. The light is incredible in the morning, the coffee is genuinely good, and the internet never dropped once in three weeks." },
      { id: "r2", author: "Tomas V.", avatar: "https://i.pravatar.cc/48?img=12", rating: 5, date: "August 2026",    text: "Booked a day pass on a whim and ended up extending to the whole week. The standing desks are proper quality, Herman Miller chairs are the real deal. Will be my Riga HQ from now on." },
      { id: "r3", author: "Elina R.", avatar: "https://i.pravatar.cc/48?img=32", rating: 5, date: "July 2026",      text: "The rooftop is the best-kept secret in Riga. Worked from there the whole afternoon and got more done than in a week at my home office." },
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
    ],
    priceHour: 5, priceDay: 22, priceMonth: 249,
    rating: 4.92, reviewCount: 97, badge: "Trending", isInstantBook: true,
    description: "Skanste is Riga's fastest-growing tech district, and this workspace sits right at its heart. Glass walls, modular furniture, and a buzzing community of startups make it ideal for focused work and spontaneous collaboration.",
    amenities: ["1 Gbps Wi-Fi","Dedicated desks","Meeting pods","Coffee & tea","Parking","24h access","Lockers","Printing"],
    highlights: [
      { icon: "wifi",   title: "Reliable 1 Gbps fiber",    desc: "Symmetrical upload and download. SLA-backed uptime." },
      { icon: "key",    title: "Keycard access 24/7",      desc: "Work on your schedule - not ours." },
      { icon: "coffee", title: "Coffee & tea station",     desc: "Stocked daily. Because good work needs good fuel." },
      { icon: "shield", title: "Monet Verified",           desc: "Quality-checked for connectivity, ergonomics, and cleanliness." },
    ],
    rules: ["No loud calls in open-plan areas","Booking required for meeting rooms","No food at standing desks"],
    reviews: [
      { id: "r1", author: "Andris P.", avatar: "https://i.pravatar.cc/48?img=5",  rating: 5, date: "September 2026", text: "Perfect spot for a remote team sprint. We booked 4 desks for a week and the team loved it." },
      { id: "r2", author: "Julia M.",  avatar: "https://i.pravatar.cc/48?img=25", rating: 4, date: "August 2026",    text: "Love the vibe here. Gets a bit full on Thursdays but the team is always quick to find you a spot." },
    ],
  },
  {
    id: "monet-tallinn-telliskivi",
    name: "Telliskivi Creative Loft",
    city: "Tallinn",
    district: "Telliskivi",
    address: "Telliskivi 60a, Tallinn, 10412",
    images: [
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 7, priceDay: 32, priceMonth: 320,
    rating: 4.98, reviewCount: 211, badge: "Superhost", isInstantBook: false,
    description: "Nested inside Telliskivi Creative City, this loft-style workspace blends industrial character with creative energy. Exposed ducts, brick walls, art installations, and a rooftop garden make it the workspace Tallinn creative pros call home.",
    amenities: ["Gigabit Wi-Fi","Standing desks","Rooftop garden","Specialty coffee","Art installations","Meeting room","24h access","Bike storage"],
    highlights: [
      { icon: "wifi",   title: "Gigabit fiber",          desc: "Redundant connection. Works when it matters most." },
      { icon: "key",    title: "24/7 access",            desc: "Your code, your schedule." },
      { icon: "coffee", title: "Specialty coffee bar",   desc: "Sourced from Tallinn's best roasters. Included in your pass." },
      { icon: "shield", title: "Superhost verified",     desc: "Top 1% of Monet spaces by guest satisfaction." },
    ],
    rules: ["Photography allowed with prior notice","Dog-friendly (please notify in advance)","Quiet hours: 22:00-08:00"],
    reviews: [
      { id: "r1", author: "Kertu L.",  avatar: "https://i.pravatar.cc/48?img=9",  rating: 5, date: "September 2026", text: "The rooftop garden alone is worth the price. I've worked from here twice this month and both times felt genuinely inspired." },
      { id: "r2", author: "Mihkel T.", avatar: "https://i.pravatar.cc/48?img=17", rating: 5, date: "August 2026",    text: "Best coworking in Tallinn by a significant margin. The community is the real value-add." },
      { id: "r3", author: "Sofia A.",  avatar: "https://i.pravatar.cc/48?img=44", rating: 5, date: "July 2026",      text: "Flew in for a week of client calls and workshops. Perfect setup, zero technical issues." },
    ],
  },
  {
    id: "monet-vilnius-tech",
    name: "Paupys Riverside Space",
    city: "Vilnius",
    district: "Paupys",
    address: "Paupys g. 14, Vilnius, LT-01138",
    images: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 5, priceDay: 19, priceMonth: 220,
    rating: 4.89, reviewCount: 73, badge: undefined, isInstantBook: true,
    description: "A calm riverside workspace in the Paupys district. Floor-to-ceiling windows face the Vilnia river, giving you a meditative view. Consistently the quietest and most affordable option in Vilnius.",
    amenities: ["1 Gbps Wi-Fi","Ergonomic chairs","River view","Tea station","Printing","Lockers"],
    highlights: [
      { icon: "wifi",   title: "1 Gbps fiber",        desc: "No throttling, no shared bandwidth problems." },
      { icon: "key",    title: "Instant booking",     desc: "Confirmed in seconds. No back-and-forth." },
      { icon: "coffee", title: "Tea & coffee bar",    desc: "Curated selection from Lithuanian specialty roasters." },
      { icon: "shield", title: "Monet Verified",      desc: "Meets our full quality standard across all categories." },
    ],
    rules: ["Silent work zone - calls in designated booths only","Clean desk policy enforced","No outside food on the main floor"],
    reviews: [
      { id: "r1", author: "Dovile K.", avatar: "https://i.pravatar.cc/48?img=21", rating: 5, date: "September 2026", text: "The river view is genuinely calming. I get so much more done here than anywhere else in Vilnius." },
      { id: "r2", author: "Rimas P.",  avatar: "https://i.pravatar.cc/48?img=33", rating: 4, date: "August 2026",    text: "Great value. The Wi-Fi held steady through three 4K video uploads without a hiccup." },
    ],
  },
  {
    id: "monet-berlin-mitte",
    name: "Mitte Design Atelier",
    city: "Berlin",
    district: "Mitte",
    address: "Torstrasse 85, 10119 Berlin",
    images: [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
    ],
    priceHour: 9, priceDay: 38, priceMonth: 420,
    rating: 4.95, reviewCount: 312, badge: "New", isInstantBook: true,
    description: "A meticulously designed workspace in the heart of Mitte, Berlin's design district. Curated furniture, gallery-white walls, and long communal tables attract architects, designers, and creative directors. The most premium space in the Monet network.",
    amenities: ["10 Gbps fiber","Architect desks","Private phone booths","Specialty coffee","Rooftop terrace","Bike storage","Showers","24h access","Lockers","Printing & binding"],
    highlights: [
      { icon: "wifi",   title: "10 Gbps enterprise fiber",  desc: "Dual-provider redundancy. Built for heavy uploaders and video teams." },
      { icon: "key",    title: "App-based access",          desc: "Digital key on your phone. No fobs, no queues." },
      { icon: "coffee", title: "Third-wave coffee lab",     desc: "Full espresso bar with rotating guest roasters from across Europe." },
      { icon: "shield", title: "Monet Premium Verified",    desc: "Highest certification tier. Top 0.5% of all listed spaces globally." },
    ],
    rules: ["Photography for portfolio use permitted","No phone calls at open desks","Guests require host registration"],
    reviews: [
      { id: "r1", author: "Lukas H.", avatar: "https://i.pravatar.cc/48?img=53", rating: 5, date: "October 2026",   text: "I've been to coworkings across 14 countries. This is genuinely top-tier. The espresso bar alone justifies the price." },
      { id: "r2", author: "Anna K.",  avatar: "https://i.pravatar.cc/48?img=41", rating: 5, date: "September 2026", text: "Flew in for a shoot and used this as our base. The light is stunning and the team is incredibly professional." },
      { id: "r3", author: "Marc D.",  avatar: "https://i.pravatar.cc/48?img=7",  rating: 5, date: "August 2026",    text: "The rooftop terrace is worth coming for alone. Working from there on a clear Berlin evening is something else entirely." },
    ],
  },
];