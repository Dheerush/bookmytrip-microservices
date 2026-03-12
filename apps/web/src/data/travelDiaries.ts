export interface TravelDiary {
  id: string;
  title: string;
  city: string;
  country: string;
  category: "india" | "abroad";
  image: string;
  excerpt: string;
  author: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  slug: string;
}

export const travelDiaries: TravelDiary[] = [
  // ── India ──────────────────────────────────────────
  {
    id: "diary-001",
    title: "Delhi Through the Lanes of Chandni Chowk",
    city: "Delhi",
    country: "India",
    category: "india",
    image: "/travel-diaries/india/delhi1.jpg",
    excerpt:
      "Lose yourself in the chaotic beauty of Old Delhi — spice markets, Mughal architecture, and street food that tells centuries of stories.",
    author: "Priya Sharma",
    authorAvatar: "",
    date: "2024-11-15",
    readTime: "6 min read",
    slug: "delhi-chandni-chowk",
  },
  {
    id: "diary-002",
    title: "Sunrise at Tiger Hill, Darjeeling",
    city: "Darjeeling",
    country: "India",
    category: "india",
    image: "/travel-diaries/india/darjeeling1.jpg",
    excerpt:
      "Waking up at 3 AM was worth every second when the first golden rays kissed the Kanchenjunga peaks. A memory frozen in time.",
    author: "Arjun Mehta",
    authorAvatar: "",
    date: "2024-10-22",
    readTime: "5 min read",
    slug: "darjeeling-tiger-hill",
  },
  {
    id: "diary-003",
    title: "Houseboat Nights in Alleppey",
    city: "Alleppey",
    country: "India",
    category: "india",
    image: "/travel-diaries/india/kerela1.jpeg",
    excerpt:
      "Drifting through the backwaters under a starlit sky, with nothing but the gentle lapping of water and the scent of jasmine in the air.",
    author: "Neha Iyer",
    authorAvatar: "",
    date: "2024-09-08",
    readTime: "7 min read",
    slug: "alleppey-houseboat",
  },
  {
    id: "diary-004",
    title: "The Blue City — Walking Through Jodhpur",
    city: "Jodhpur",
    country: "India",
    category: "india",
    image: "/travel-diaries/india/jodhpur1.jpg",
    excerpt:
      "Every narrow lane painted in indigo, every haveli whispering tales of Rajput valour. Jodhpur is a photographer's dream come alive.",
    author: "Kabir Das",
    authorAvatar: "",
    date: "2024-08-30",
    readTime: "5 min read",
    slug: "jodhpur-blue-city",
  },
  {
    id: "diary-005",
    title: "Camping Under Stars in Spiti Valley",
    city: "Spiti",
    country: "India",
    category: "india",
    image: "/travel-diaries/india/spiti1.jpg",
    excerpt:
      "At 14,000 feet, the Milky Way feels close enough to touch. Spiti strips away the noise and leaves you with raw, unfiltered beauty.",
    author: "Rohan Kapoor",
    authorAvatar: "",
    date: "2024-07-12",
    readTime: "8 min read",
    slug: "spiti-valley-camping",
  },

  // ── Abroad ─────────────────────────────────────────
  {
    id: "diary-006",
    title: "Lost in the Souks of Marrakech",
    city: "Marrakech",
    country: "Morocco",
    category: "abroad",
    image: "/travel-diaries/abroad/morocco1.jpg",
    excerpt:
      "The labyrinthine medinas, the vibrant colours of hand-woven rugs, and the aroma of tagine — Marrakech is a feast for every sense.",
    author: "Aanya Roy",
    authorAvatar: "",
    date: "2024-11-02",
    readTime: "6 min read",
    slug: "marrakech-souks",
  },
  {
    id: "diary-007",
    title: "Kyoto in Autumn — Temples & Maple Leaves",
    city: "Kyoto",
    country: "Japan",
    category: "abroad",
    image: "/travel-diaries/abroad/kyoto1.jpg",
    excerpt:
      "Walking through Fushimi Inari's thousand torii gates while crimson maple leaves drifted down like nature's confetti.",
    author: "Ishaan Desai",
    authorAvatar: "",
    date: "2024-10-18",
    readTime: "7 min read",
    slug: "kyoto-autumn",
  },
  {
    id: "diary-008",
    title: "Road-Tripping Iceland's Golden Circle",
    city: "Reykjavik",
    country: "Iceland",
    category: "abroad",
    image: "/travel-diaries/abroad/iceland1.jpg",
    excerpt:
      "Geysers erupting beside you, waterfalls thundering into moss-covered ravines, and the Northern Lights as your nightly backdrop.",
    author: "Meera Joshi",
    authorAvatar: "",
    date: "2024-09-25",
    readTime: "8 min read",
    slug: "iceland-golden-circle",
  },
  {
    id: "diary-009",
    title: "Santorini Sunsets & Greek Island Hopping",
    city: "Santorini",
    country: "Greece",
    category: "abroad",
    image: "/travel-diaries/abroad/greece1.jpg",
    excerpt:
      "White-washed walls, cobalt blue domes, and the most breathtaking sunset you'll ever witness — Santorini delivers on every promise.",
    author: "Vikram Singh",
    authorAvatar: "",
    date: "2024-08-15",
    readTime: "6 min read",
    slug: "santorini-sunsets",
  },
  {
    id: "diary-010",
    title: "Patagonia — Edge of the World",
    city: "El Calafate",
    country: "Argentina",
    category: "abroad",
    image: "/travel-diaries/abroad/patagonia1.jpg",
    excerpt:
      "Watching the Perito Moreno glacier calve into turquoise waters while condors soar overhead — nature's ultimate spectacle.",
    author: "Ananya Verma",
    authorAvatar: "",
    date: "2024-07-28",
    readTime: "9 min read",
    slug: "patagonia-argentina",
  },
];
