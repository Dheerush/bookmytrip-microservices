export interface HotelRoom {
  type: string;
  price: number;
  originalPrice: number;
  maxGuests: number;
  bedType: string;
  size: string;
  available: number;
}

export interface HotelOffer {
  title: string;
  description: string;
  code: string;
  discount: string;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  address: string;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stars: number;
  pricePerNight: number;
  originalPrice: number;
  amenities: string[];
  foodIncluded: "breakfast" | "all-meals" | "none";
  wifi: boolean;
  parking: boolean;
  pool: boolean;
  gym: boolean;
  spa: boolean;
  petFriendly: boolean;
  refundPolicy: "full" | "partial" | "non-refundable";
  refundDescription: string;
  checkInTime: string;
  checkOutTime: string;
  rooms: HotelRoom[];
  offers: HotelOffer[];
  description: string;
  tags: string[];
}

export const hotels: Hotel[] = [
  {
    id: "htl-001", name: "The Grand Imperial Palace", city: "New Delhi", address: "Connaught Place, Central Delhi, 110001",
    image: "/hotels/htl-001/main.jpg",
    images: ["/hotels/htl-001/main.jpg","/hotels/htl-001/room.jpg","/hotels/htl-001/bathroom.jpg","/hotels/htl-001/lobby.jpg","/hotels/htl-001/restaurant.jpg","/hotels/htl-001/pool.jpg"],
    rating: 4.8, reviewCount: 2340, stars: 5, pricePerNight: 8999, originalPrice: 12999,
    amenities: ["Free WiFi","Pool","Spa","Gym","Restaurant","Bar","Room Service","Laundry","Airport Shuttle","Concierge"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: true, gym: true, spa: true, petFriendly: false,
    refundPolicy: "full", refundDescription: "Full refund if cancelled 48 hours before check-in.", checkInTime: "14:00", checkOutTime: "12:00",
    rooms: [
      { type: "Deluxe Room", price: 8999, originalPrice: 12999, maxGuests: 2, bedType: "King", size: "35 sqm", available: 5 },
      { type: "Premium Suite", price: 14999, originalPrice: 19999, maxGuests: 3, bedType: "King + Sofa Bed", size: "55 sqm", available: 2 },
      { type: "Royal Suite", price: 24999, originalPrice: 34999, maxGuests: 4, bedType: "King + Twin", size: "85 sqm", available: 1 },
    ],
    offers: [
      { title: "Couple's Getaway", description: "20% off on Premium Suite for couples with complimentary dinner", code: "COUPLE20", discount: "20%" },
      { title: "Early Bird", description: "Book 30 days in advance and save ₹2,000", code: "EARLY2K", discount: "₹2,000 off" },
    ],
    description: "Located in the heart of Delhi's iconic Connaught Place, The Grand Imperial Palace offers world-class luxury with panoramic city views, Michelin-inspired dining, and a rooftop infinity pool.",
    tags: ["Luxury","City Center","Pool","Spa"],
  },
  {
    id: "htl-002", name: "Ocean Breeze Resort", city: "Goa", address: "Calangute Beach Road, North Goa, 403516",
    image: "/hotels/htl-002/main.jpg",
    images: ["/hotels/htl-002/main.jpg","/hotels/htl-002/room.jpg","/hotels/htl-002/bathroom.jpg","/hotels/htl-002/beach.jpg","/hotels/htl-002/restaurant.jpg","/hotels/htl-002/pool.jpg"],
    rating: 4.6, reviewCount: 1890, stars: 4, pricePerNight: 5999, originalPrice: 8499,
    amenities: ["Free WiFi","Beach Access","Pool","Restaurant","Bar","Water Sports","Spa","Parking"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: true, gym: false, spa: true, petFriendly: true,
    refundPolicy: "partial", refundDescription: "50% refund if cancelled 24 hours before check-in.", checkInTime: "15:00", checkOutTime: "11:00",
    rooms: [
      { type: "Beach View Room", price: 5999, originalPrice: 8499, maxGuests: 2, bedType: "Queen", size: "30 sqm", available: 8 },
      { type: "Sea-Facing Villa", price: 11999, originalPrice: 16999, maxGuests: 4, bedType: "King + Twin", size: "65 sqm", available: 3 },
    ],
    offers: [
      { title: "Beach Bonanza", description: "Free water sports package with 3+ night stay", code: "BEACH3", discount: "Free add-on" },
    ],
    description: "Steps from Calangute Beach, this resort combines Goan charm with modern luxury. Enjoy direct beach access, sunset dinners, and a stunning infinity pool overlooking the Arabian Sea.",
    tags: ["Beach","Resort","Pet Friendly","Water Sports"],
  },
  {
    id: "htl-003", name: "Mountain View Lodge", city: "Manali", address: "Old Manali Road, Manali, Himachal Pradesh 175131",
    image: "/hotels/htl-003/main.jpg",
    images: ["/hotels/htl-003/main.jpg","/hotels/htl-003/room.jpg","/hotels/htl-003/bathroom.jpg","/hotels/htl-003/view.jpg","/hotels/htl-003/restaurant.jpg"],
    rating: 4.5, reviewCount: 1320, stars: 3, pricePerNight: 3499, originalPrice: 4999,
    amenities: ["Free WiFi","Mountain View","Bonfire","Restaurant","Heating","Parking","Trekking Guidance"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: false, spa: false, petFriendly: true,
    refundPolicy: "full", refundDescription: "Full refund if cancelled 72 hours before check-in.", checkInTime: "13:00", checkOutTime: "11:00",
    rooms: [
      { type: "Valley View Room", price: 3499, originalPrice: 4999, maxGuests: 2, bedType: "Double", size: "25 sqm", available: 6 },
      { type: "Cottage Suite", price: 5999, originalPrice: 8499, maxGuests: 3, bedType: "King", size: "40 sqm", available: 4 },
    ],
    offers: [
      { title: "Winter Special", description: "Stay 4 nights, pay for 3 during snow season", code: "SNOW4X3", discount: "25%" },
    ],
    description: "Nestled in Old Manali with breathtaking views of the Himalayas, this cozy lodge is perfect for trekkers and nature lovers seeking tranquility amidst cedar forests.",
    tags: ["Mountain","Trekking","Budget","Pet Friendly"],
  },
  {
    id: "htl-004", name: "Royal Heritage Haveli", city: "Jaipur", address: "Amer Road, Jaipur, Rajasthan 302002",
    image: "/hotels/htl-004/main.jpg",
    images: ["/hotels/htl-004/main.jpg","/hotels/htl-004/room.jpg","/hotels/htl-004/bathroom.jpg","/hotels/htl-004/courtyard.jpg","/hotels/htl-004/restaurant.jpg","/hotels/htl-004/pool.jpg"],
    rating: 4.7, reviewCount: 1670, stars: 5, pricePerNight: 7499, originalPrice: 10999,
    amenities: ["Free WiFi","Heritage Walk","Pool","Spa","Restaurant","Cultural Shows","Parking","Concierge"],
    foodIncluded: "all-meals", wifi: true, parking: true, pool: true, gym: true, spa: true, petFriendly: false,
    refundPolicy: "full", refundDescription: "Full refund if cancelled 48 hours before check-in.", checkInTime: "14:00", checkOutTime: "12:00",
    rooms: [
      { type: "Heritage Room", price: 7499, originalPrice: 10999, maxGuests: 2, bedType: "King", size: "38 sqm", available: 4 },
      { type: "Maharaja Suite", price: 15999, originalPrice: 22999, maxGuests: 3, bedType: "King + Lounge", size: "70 sqm", available: 2 },
    ],
    offers: [
      { title: "Royal Treatment", description: "Couples get free spa session + heritage tour", code: "ROYAL2", discount: "Free add-on" },
      { title: "Festive Offer", description: "15% off during Diwali season", code: "DIWALI15", discount: "15%" },
    ],
    description: "A 200-year-old haveli transformed into a heritage hotel, offering authentic Rajasthani hospitality with handpainted frescoes, courtyard dining, and modern comforts.",
    tags: ["Heritage","Luxury","All Meals","Cultural"],
  },
  {
    id: "htl-005", name: "Lakeside Serenity Resort", city: "Udaipur", address: "Lake Pichola Road, Udaipur, Rajasthan 313001",
    image: "/hotels/htl-005/main.jpg",
    images: ["/hotels/htl-005/main.jpg","/hotels/htl-005/room.jpg","/hotels/htl-005/bathroom.jpg","/hotels/htl-005/lake.jpg","/hotels/htl-005/restaurant.jpg","/hotels/htl-005/spa.jpg"],
    rating: 4.9, reviewCount: 980, stars: 5, pricePerNight: 11999, originalPrice: 17999,
    amenities: ["Free WiFi","Lake View","Pool","Spa","Restaurant","Boat Rides","Yoga","Concierge"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: true, gym: true, spa: true, petFriendly: false,
    refundPolicy: "partial", refundDescription: "50% refund if cancelled 48 hours before check-in.", checkInTime: "14:00", checkOutTime: "12:00",
    rooms: [
      { type: "Lake View Room", price: 11999, originalPrice: 17999, maxGuests: 2, bedType: "King", size: "40 sqm", available: 3 },
      { type: "Presidential Suite", price: 29999, originalPrice: 42999, maxGuests: 4, bedType: "King + King", size: "110 sqm", available: 1 },
    ],
    offers: [
      { title: "Honeymoon Bliss", description: "Flower decoration, candlelight dinner & boat ride included", code: "HONEY", discount: "Free add-on" },
    ],
    description: "Perched on the banks of Lake Pichola with views of the City Palace, this ultra-luxury resort is Udaipur's crown jewel for romantic getaways and destination weddings.",
    tags: ["Lake View","Honeymoon","Ultra Luxury","Romantic"],
  },
  {
    id: "htl-006", name: "Backwater Bliss Houseboat", city: "Alleppey", address: "Finishing Point, Alleppey, Kerala 688013",
    image: "/hotels/htl-006/main.jpg",
    images: ["/hotels/htl-006/main.jpg","/hotels/htl-006/room.jpg","/hotels/htl-006/deck.jpg","/hotels/htl-006/kitchen.jpg","/hotels/htl-006/view.jpg"],
    rating: 4.4, reviewCount: 760, stars: 3, pricePerNight: 4999, originalPrice: 6999,
    amenities: ["Backwater Cruise","All Meals","Deck Lounge","Fishing","WiFi on Request"],
    foodIncluded: "all-meals", wifi: false, parking: false, pool: false, gym: false, spa: false, petFriendly: false,
    refundPolicy: "non-refundable", refundDescription: "Non-refundable. Rescheduling allowed 72 hours prior.", checkInTime: "12:00", checkOutTime: "09:00",
    rooms: [
      { type: "Premium Houseboat", price: 4999, originalPrice: 6999, maxGuests: 2, bedType: "Double", size: "20 sqm", available: 1 },
      { type: "Luxury Houseboat", price: 7499, originalPrice: 9999, maxGuests: 4, bedType: "Double + Twin", size: "35 sqm", available: 1 },
    ],
    offers: [],
    description: "Drift through Kerala's serene backwaters on a traditional kettuvallam. Fresh Kerala cuisine, sunset views from the deck, and the gentle rhythm of the water — pure bliss.",
    tags: ["Houseboat","Backwaters","All Meals","Unique"],
  },
  {
    id: "htl-007", name: "Summit Heights Hotel", city: "Shimla", address: "The Ridge, Mall Road, Shimla, HP 171001",
    image: "/hotels/htl-007/main.jpg",
    images: ["/hotels/htl-007/main.jpg","/hotels/htl-007/room.jpg","/hotels/htl-007/bathroom.jpg","/hotels/htl-007/view.jpg","/hotels/htl-007/lounge.jpg"],
    rating: 4.3, reviewCount: 1150, stars: 4, pricePerNight: 4499, originalPrice: 6499,
    amenities: ["Free WiFi","Mountain View","Restaurant","Bar","Heating","Room Service","Parking"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: false, spa: false, petFriendly: false,
    refundPolicy: "full", refundDescription: "Free cancellation up to 24 hours before check-in.", checkInTime: "14:00", checkOutTime: "11:00",
    rooms: [
      { type: "Mountain View Room", price: 4499, originalPrice: 6499, maxGuests: 2, bedType: "Queen", size: "28 sqm", available: 7 },
      { type: "Family Suite", price: 7999, originalPrice: 10999, maxGuests: 4, bedType: "King + Twin", size: "48 sqm", available: 3 },
    ],
    offers: [
      { title: "Mid-Week Deal", description: "20% off on Mon-Thu bookings", code: "MIDWK20", discount: "20%" },
    ],
    description: "Iconic colonial-era hotel on Shimla's famous Ridge, offering spectacular valley views, wood-panelled rooms, and the warmth of hill-station hospitality.",
    tags: ["Hill Station","Colonial","Mountain View","Family"],
  },
  {
    id: "htl-008", name: "The Coastal Pearl", city: "Mumbai", address: "Marine Drive, South Mumbai, 400020",
    image: "/hotels/htl-008/main.jpg",
    images: ["/hotels/htl-008/main.jpg","/hotels/htl-008/room.jpg","/hotels/htl-008/bathroom.jpg","/hotels/htl-008/sea.jpg","/hotels/htl-008/restaurant.jpg","/hotels/htl-008/rooftop.jpg"],
    rating: 4.6, reviewCount: 2180, stars: 5, pricePerNight: 9999, originalPrice: 14499,
    amenities: ["Free WiFi","Sea View","Pool","Spa","Gym","Rooftop Bar","Restaurant","Concierge","Airport Transfer"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: true, gym: true, spa: true, petFriendly: false,
    refundPolicy: "full", refundDescription: "Full refund if cancelled 48 hours before check-in.", checkInTime: "14:00", checkOutTime: "12:00",
    rooms: [
      { type: "Sea View Room", price: 9999, originalPrice: 14499, maxGuests: 2, bedType: "King", size: "38 sqm", available: 4 },
      { type: "Executive Suite", price: 17999, originalPrice: 24999, maxGuests: 3, bedType: "King + Lounge", size: "60 sqm", available: 2 },
      { type: "Penthouse", price: 34999, originalPrice: 49999, maxGuests: 4, bedType: "King + King", size: "120 sqm", available: 1 },
    ],
    offers: [
      { title: "Business Traveller", description: "Free airport transfer + late checkout", code: "BIZ2025", discount: "Free add-on" },
    ],
    description: "An iconic Art Deco property on Marine Drive with uninterrupted views of the Arabian Sea, rooftop dining under the stars, and Mumbai's vibrant energy at your doorstep.",
    tags: ["Sea View","Luxury","Rooftop Bar","Business"],
  },
  {
    id: "htl-009", name: "Tea Garden Retreat", city: "Darjeeling", address: "Happy Valley Road, Darjeeling, WB 734101",
    image: "/hotels/htl-009/main.jpg",
    images: ["/hotels/htl-009/main.jpg","/hotels/htl-009/room.jpg","/hotels/htl-009/bathroom.jpg","/hotels/htl-009/garden.jpg","/hotels/htl-009/view.jpg"],
    rating: 4.5, reviewCount: 890, stars: 3, pricePerNight: 3299, originalPrice: 4799,
    amenities: ["Free WiFi","Tea Garden Walk","Restaurant","Heating","Mountain View","Library"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: false, spa: false, petFriendly: true,
    refundPolicy: "full", refundDescription: "Free cancellation up to 48 hours before check-in.", checkInTime: "13:00", checkOutTime: "11:00",
    rooms: [
      { type: "Garden View Room", price: 3299, originalPrice: 4799, maxGuests: 2, bedType: "Double", size: "22 sqm", available: 8 },
      { type: "Kanchenjunga Suite", price: 5999, originalPrice: 8499, maxGuests: 3, bedType: "King", size: "38 sqm", available: 2 },
    ],
    offers: [
      { title: "Tea Lover's Package", description: "Free tea tasting tour + 1 kg Darjeeling tea", code: "TEA1KG", discount: "Free add-on" },
    ],
    description: "Surrounded by rolling tea estates with panoramic views of Kanchenjunga, this heritage retreat offers colonial charm, warm hospitality, and the finest Darjeeling tea.",
    tags: ["Tea Garden","Heritage","Mountain View","Budget"],
  },
  {
    id: "htl-010", name: "Desert Camp Luxury Tents", city: "Jaisalmer", address: "Sam Sand Dunes, Jaisalmer, Rajasthan 345001",
    image: "/hotels/htl-010/main.jpg",
    images: ["/hotels/htl-010/main.jpg","/hotels/htl-010/tent.jpg","/hotels/htl-010/bathroom.jpg","/hotels/htl-010/campfire.jpg","/hotels/htl-010/dunes.jpg"],
    rating: 4.4, reviewCount: 650, stars: 3, pricePerNight: 3999, originalPrice: 5999,
    amenities: ["Camel Safari","Cultural Dance","Bonfire","All Meals","Desert View","Star Gazing"],
    foodIncluded: "all-meals", wifi: false, parking: true, pool: false, gym: false, spa: false, petFriendly: false,
    refundPolicy: "partial", refundDescription: "50% refund if cancelled 72 hours before.", checkInTime: "15:00", checkOutTime: "10:00",
    rooms: [
      { type: "Swiss Tent", price: 3999, originalPrice: 5999, maxGuests: 2, bedType: "Double", size: "20 sqm", available: 10 },
      { type: "Royal Tent", price: 6999, originalPrice: 9999, maxGuests: 3, bedType: "King", size: "32 sqm", available: 4 },
    ],
    offers: [
      { title: "Desert Night", description: "Free camel ride + folk dance performance", code: "DESERT1", discount: "Free add-on" },
    ],
    description: "Experience the magic of the Thar Desert in luxury Swiss tents under a canopy of stars. Includes camel safaris, traditional folk performances, and authentic Rajasthani feasts.",
    tags: ["Desert","Unique","All Meals","Adventure"],
  },
  {
    id: "htl-011", name: "Treehouse Villas", city: "Wayanad", address: "Vythiri, Wayanad, Kerala 673576",
    image: "/hotels/htl-011/main.jpg",
    images: ["/hotels/htl-011/main.jpg","/hotels/htl-011/room.jpg","/hotels/htl-011/bathroom.jpg","/hotels/htl-011/treehouse.jpg","/hotels/htl-011/forest.jpg"],
    rating: 4.7, reviewCount: 540, stars: 4, pricePerNight: 7999, originalPrice: 11999,
    amenities: ["Treehouse","Jungle Safari","Pool","Spa","Restaurant","Nature Walks","Bird Watching"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: true, gym: false, spa: true, petFriendly: false,
    refundPolicy: "partial", refundDescription: "50% refund if cancelled 48 hours before.", checkInTime: "14:00", checkOutTime: "11:00",
    rooms: [
      { type: "Treehouse Villa", price: 7999, originalPrice: 11999, maxGuests: 2, bedType: "Queen", size: "28 sqm", available: 4 },
      { type: "Forest Suite", price: 12999, originalPrice: 17999, maxGuests: 3, bedType: "King", size: "45 sqm", available: 2 },
    ],
    offers: [
      { title: "Jungle Package", description: "Safari + bird watching tour included with 2+ nights", code: "JUNGLE2", discount: "Free add-on" },
    ],
    description: "Sleep amidst the canopy of Wayanad's tropical rainforest in handcrafted treehouses. A magical escape for nature enthusiasts seeking adventure and serenity.",
    tags: ["Treehouse","Jungle","Unique","Nature"],
  },
  {
    id: "htl-012", name: "The Lakeview Grand", city: "Nainital", address: "Mall Road, Nainital, Uttarakhand 263002",
    image: "/hotels/htl-012/main.jpg",
    images: ["/hotels/htl-012/main.jpg","/hotels/htl-012/room.jpg","/hotels/htl-012/bathroom.jpg","/hotels/htl-012/lake.jpg","/hotels/htl-012/restaurant.jpg"],
    rating: 4.4, reviewCount: 1050, stars: 4, pricePerNight: 4299, originalPrice: 5999,
    amenities: ["Free WiFi","Lake View","Restaurant","Room Service","Heating","Parking","Boating Nearby"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: false, spa: false, petFriendly: true,
    refundPolicy: "full", refundDescription: "Free cancellation up to 24 hours before check-in.", checkInTime: "13:00", checkOutTime: "11:00",
    rooms: [
      { type: "Lake View Room", price: 4299, originalPrice: 5999, maxGuests: 2, bedType: "Double", size: "25 sqm", available: 6 },
      { type: "Family Room", price: 6499, originalPrice: 8999, maxGuests: 4, bedType: "King + Twin", size: "40 sqm", available: 3 },
    ],
    offers: [{ title: "Family Fun", description: "Kids below 6 stay free + free boat ride", code: "FAMILY0", discount: "Free add-on" }],
    description: "A lakeside gem on Nainital's famous Mall Road with stunning views of Naini Lake, perfect for family holidays and romantic getaways in the Kumaon hills.",
    tags: ["Lake View","Family","Hill Station","Budget"],
  },
  {
    id: "htl-013", name: "Harbour Bay Hotel", city: "Chennai", address: "ECR Beach Road, Chennai, TN 600041",
    image: "/hotels/htl-013/main.jpg",
    images: ["/hotels/htl-013/main.jpg","/hotels/htl-013/room.jpg","/hotels/htl-013/bathroom.jpg","/hotels/htl-013/pool.jpg","/hotels/htl-013/restaurant.jpg"],
    rating: 4.3, reviewCount: 1420, stars: 4, pricePerNight: 5499, originalPrice: 7999,
    amenities: ["Free WiFi","Pool","Beach Nearby","Restaurant","Bar","Gym","Business Center","Parking"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: true, gym: true, spa: false, petFriendly: false,
    refundPolicy: "full", refundDescription: "Full refund if cancelled 24 hours before check-in.", checkInTime: "14:00", checkOutTime: "12:00",
    rooms: [
      { type: "Standard Room", price: 5499, originalPrice: 7999, maxGuests: 2, bedType: "Queen", size: "30 sqm", available: 10 },
      { type: "Business Suite", price: 8999, originalPrice: 12999, maxGuests: 2, bedType: "King", size: "48 sqm", available: 4 },
    ],
    offers: [{ title: "Corporate Deal", description: "20% off for verified business travellers", code: "CORP20", discount: "20%" }],
    description: "A modern beachside hotel on East Coast Road, combining business and leisure with easy access to Chennai's IT corridor and the beautiful coastline.",
    tags: ["Beach","Business","Pool","Modern"],
  },
  {
    id: "htl-014", name: "The Deccan Residency", city: "Hyderabad", address: "Banjara Hills, Hyderabad, TS 500034",
    image: "/hotels/htl-014/main.jpg",
    images: ["/hotels/htl-014/main.jpg","/hotels/htl-014/room.jpg","/hotels/htl-014/bathroom.jpg","/hotels/htl-014/lobby.jpg","/hotels/htl-014/restaurant.jpg"],
    rating: 4.5, reviewCount: 1780, stars: 4, pricePerNight: 5999, originalPrice: 8499,
    amenities: ["Free WiFi","Restaurant","Bar","Pool","Gym","Business Center","Parking","Laundry"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: true, gym: true, spa: false, petFriendly: false,
    refundPolicy: "full", refundDescription: "Full refund if cancelled 48 hours before check-in.", checkInTime: "14:00", checkOutTime: "12:00",
    rooms: [
      { type: "Classic Room", price: 5999, originalPrice: 8499, maxGuests: 2, bedType: "Queen", size: "32 sqm", available: 8 },
      { type: "Executive Room", price: 8499, originalPrice: 11999, maxGuests: 2, bedType: "King", size: "42 sqm", available: 4 },
    ],
    offers: [{ title: "Biryani & Stay", description: "Free Hyderabadi biryani dinner for 2", code: "BIRYANI", discount: "Free add-on" }],
    description: "A boutique property in the upscale Banjara Hills, known for its blend of modern design and Deccan heritage. Close to Charminar, Golconda Fort, and HITEC City.",
    tags: ["City Center","Business","Modern","Culture"],
  },
  {
    id: "htl-015", name: "Himalayan Eco Lodge", city: "Rishikesh", address: "Tapovan, Rishikesh, Uttarakhand 249192",
    image: "/hotels/htl-015/main.jpg",
    images: ["/hotels/htl-015/main.jpg","/hotels/htl-015/room.jpg","/hotels/htl-015/bathroom.jpg","/hotels/htl-015/yoga.jpg","/hotels/htl-015/river.jpg"],
    rating: 4.6, reviewCount: 720, stars: 3, pricePerNight: 2999, originalPrice: 4499,
    amenities: ["Yoga Classes","River View","Organic Meals","Meditation","Trekking","Rafting Nearby"],
    foodIncluded: "all-meals", wifi: true, parking: true, pool: false, gym: false, spa: false, petFriendly: false,
    refundPolicy: "full", refundDescription: "Free cancellation up to 72 hours before check-in.", checkInTime: "13:00", checkOutTime: "10:00",
    rooms: [
      { type: "River View Room", price: 2999, originalPrice: 4499, maxGuests: 2, bedType: "Double", size: "22 sqm", available: 6 },
      { type: "Yoga Retreat Room", price: 4499, originalPrice: 6499, maxGuests: 2, bedType: "Twin", size: "28 sqm", available: 4 },
    ],
    offers: [{ title: "Yoga Retreat", description: "7-day yoga & meditation program at 30% off", code: "YOGA30", discount: "30%" }],
    description: "An eco-friendly lodge overlooking the Ganges in Tapovan, designed for spiritual seekers and adventure enthusiasts. Organic meals, daily yoga, and river rafting nearby.",
    tags: ["Yoga","River View","Eco","Budget"],
  },
  {
    id: "htl-016", name: "The Bengal Club Hotel", city: "Kolkata", address: "Park Street, Kolkata, WB 700016",
    image: "/hotels/htl-016/main.jpg",
    images: ["/hotels/htl-016/main.jpg","/hotels/htl-016/room.jpg","/hotels/htl-016/bathroom.jpg","/hotels/htl-016/lobby.jpg","/hotels/htl-016/restaurant.jpg","/hotels/htl-016/bar.jpg"],
    rating: 4.4, reviewCount: 1340, stars: 4, pricePerNight: 5299, originalPrice: 7499,
    amenities: ["Free WiFi","Restaurant","Bar","Heritage Decor","Room Service","Parking","Laundry"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: true, spa: false, petFriendly: false,
    refundPolicy: "full", refundDescription: "Full refund if cancelled 24 hours before check-in.", checkInTime: "14:00", checkOutTime: "12:00",
    rooms: [
      { type: "Heritage Room", price: 5299, originalPrice: 7499, maxGuests: 2, bedType: "Queen", size: "30 sqm", available: 6 },
      { type: "Colonial Suite", price: 9999, originalPrice: 13999, maxGuests: 3, bedType: "King", size: "52 sqm", available: 2 },
    ],
    offers: [{ title: "Durga Puja Special", description: "Pandal hopping package + Bengali thali dinner", code: "PUJA25", discount: "Free add-on" }],
    description: "A refined Park Street institution blending Victorian elegance with Bengali warmth. Legendary for its cuisine, literary evenings, and the spirit of Kolkata's cultural heartbeat.",
    tags: ["Heritage","Culture","City Center","Colonial"],
  },
  {
    id: "htl-017", name: "Island Paradise Resort", city: "Andaman", address: "Havelock Island, South Andaman, 744211",
    image: "/hotels/htl-017/main.jpg",
    images: ["/hotels/htl-017/main.jpg","/hotels/htl-017/room.jpg","/hotels/htl-017/bathroom.jpg","/hotels/htl-017/beach.jpg","/hotels/htl-017/diving.jpg"],
    rating: 4.8, reviewCount: 480, stars: 4, pricePerNight: 8999, originalPrice: 12999,
    amenities: ["Beach Access","Scuba Diving","Snorkeling","Restaurant","Bar","Kayaking","Glass Bottom Boat"],
    foodIncluded: "breakfast", wifi: true, parking: false, pool: true, gym: false, spa: true, petFriendly: false,
    refundPolicy: "partial", refundDescription: "50% refund if cancelled 72 hours before check-in.", checkInTime: "14:00", checkOutTime: "11:00",
    rooms: [
      { type: "Beach Cottage", price: 8999, originalPrice: 12999, maxGuests: 2, bedType: "King", size: "35 sqm", available: 5 },
      { type: "Overwater Villa", price: 18999, originalPrice: 26999, maxGuests: 2, bedType: "King", size: "50 sqm", available: 2 },
    ],
    offers: [{ title: "Dive Package", description: "Free discover scuba session with 3+ night stay", code: "DIVE3", discount: "Free add-on" }],
    description: "On the pristine shores of Havelock Island, this resort offers crystal-clear waters, world-class diving, and the untouched beauty of the Andaman archipelago.",
    tags: ["Island","Diving","Beach","Romantic"],
  },
  {
    id: "htl-018", name: "The IT Hub Suites", city: "Bengaluru", address: "Outer Ring Road, Whitefield, Bengaluru, KA 560066",
    image: "/hotels/htl-018/main.jpg",
    images: ["/hotels/htl-018/main.jpg","/hotels/htl-018/room.jpg","/hotels/htl-018/bathroom.jpg","/hotels/htl-018/workspace.jpg","/hotels/htl-018/restaurant.jpg"],
    rating: 4.3, reviewCount: 1560, stars: 4, pricePerNight: 4999, originalPrice: 6999,
    amenities: ["Free WiFi","Co-working Space","Gym","Restaurant","Laundry","Airport Shuttle","Parking"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: true, spa: false, petFriendly: false,
    refundPolicy: "full", refundDescription: "Free cancellation up to 6 hours before check-in.", checkInTime: "12:00", checkOutTime: "12:00",
    rooms: [
      { type: "Studio Room", price: 4999, originalPrice: 6999, maxGuests: 2, bedType: "Queen", size: "28 sqm", available: 12 },
      { type: "Work Suite", price: 7499, originalPrice: 9999, maxGuests: 2, bedType: "King", size: "42 sqm", available: 5 },
    ],
    offers: [{ title: "Extended Stay", description: "30% off on 7+ night bookings", code: "LONG30", discount: "30%" }],
    description: "Purpose-built for tech professionals and business travellers in Whitefield's IT corridor. Features co-working spaces, 24/7 dining, and express laundry.",
    tags: ["Business","IT Hub","Modern","Extended Stay"],
  },
  {
    id: "htl-019", name: "Spice Garden Villa", city: "Munnar", address: "Munnar-Top Station Road, Munnar, Kerala 685612",
    image: "/hotels/htl-019/main.jpg",
    images: ["/hotels/htl-019/main.jpg","/hotels/htl-019/room.jpg","/hotels/htl-019/bathroom.jpg","/hotels/htl-019/garden.jpg","/hotels/htl-019/view.jpg"],
    rating: 4.6, reviewCount: 620, stars: 3, pricePerNight: 3799, originalPrice: 5499,
    amenities: ["Spice Garden Tour","Mountain View","Restaurant","Parking","Bonfire","Nature Walks"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: false, spa: false, petFriendly: true,
    refundPolicy: "full", refundDescription: "Free cancellation up to 48 hours before check-in.", checkInTime: "13:00", checkOutTime: "11:00",
    rooms: [
      { type: "Garden Room", price: 3799, originalPrice: 5499, maxGuests: 2, bedType: "Double", size: "24 sqm", available: 7 },
      { type: "Hilltop Cottage", price: 6499, originalPrice: 9499, maxGuests: 3, bedType: "King", size: "38 sqm", available: 3 },
    ],
    offers: [{ title: "Spice Trail", description: "Free guided spice garden walking tour", code: "SPICE1", discount: "Free add-on" }],
    description: "Among Munnar's emerald tea plantations and spice gardens, this villa offers misty mountain mornings, cardamom-scented walks, and the magic of Kerala's Western Ghats.",
    tags: ["Tea Plantation","Nature","Budget","Pet Friendly"],
  },
  {
    id: "htl-020", name: "Golden Temple View Hotel", city: "Amritsar", address: "Near Golden Temple, Amritsar, Punjab 143001",
    image: "/hotels/htl-020/main.jpg",
    images: ["/hotels/htl-020/main.jpg","/hotels/htl-020/room.jpg","/hotels/htl-020/bathroom.jpg","/hotels/htl-020/view.jpg","/hotels/htl-020/restaurant.jpg"],
    rating: 4.5, reviewCount: 1080, stars: 3, pricePerNight: 2999, originalPrice: 4499,
    amenities: ["Temple View","Free WiFi","Restaurant","Parking","Room Service","Punjabi Cuisine"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: false, spa: false, petFriendly: false,
    refundPolicy: "full", refundDescription: "Free cancellation up to 24 hours before check-in.", checkInTime: "12:00", checkOutTime: "11:00",
    rooms: [
      { type: "Standard Room", price: 2999, originalPrice: 4499, maxGuests: 2, bedType: "Double", size: "22 sqm", available: 10 },
      { type: "Temple View Suite", price: 5499, originalPrice: 7999, maxGuests: 3, bedType: "King", size: "36 sqm", available: 3 },
    ],
    offers: [{ title: "Langar Lunch", description: "Guided Golden Temple visit + Wagah Border trip", code: "GOLDEN", discount: "Free add-on" }],
    description: "Walking distance from the Golden Temple with rooftop views of the illuminated shrine. Authentic Punjabi hospitality, legendary food, and spiritual serenity.",
    tags: ["Spiritual","Budget","Culture","Temple View"],
  },
  {
    id: "htl-021", name: "Coral Reef Beach Hotel", city: "Pondicherry", address: "Promenade Beach, Pondicherry, 605001",
    image: "/hotels/htl-021/main.jpg",
    images: ["/hotels/htl-021/main.jpg","/hotels/htl-021/room.jpg","/hotels/htl-021/bathroom.jpg","/hotels/htl-021/beach.jpg","/hotels/htl-021/cafe.jpg"],
    rating: 4.4, reviewCount: 920, stars: 3, pricePerNight: 3999, originalPrice: 5999,
    amenities: ["Beach Access","Free WiFi","Café","Cycle Rental","Rooftop","Parking"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: false, spa: false, petFriendly: true,
    refundPolicy: "full", refundDescription: "Free cancellation up to 24 hours before check-in.", checkInTime: "14:00", checkOutTime: "11:00",
    rooms: [
      { type: "Sea View Room", price: 3999, originalPrice: 5999, maxGuests: 2, bedType: "Queen", size: "26 sqm", available: 6 },
      { type: "French Quarter Suite", price: 6999, originalPrice: 9999, maxGuests: 3, bedType: "King", size: "40 sqm", available: 2 },
    ],
    offers: [{ title: "Auroville Experience", description: "Free guided Auroville & French Quarter tour", code: "AURO1", discount: "Free add-on" }],
    description: "A charming Franco-Tamil boutique hotel on the Promenade, blending French colonial architecture with vibrant Pondicherry culture. Bohemian cafés and beaches steps away.",
    tags: ["Beach","French Colonial","Bohemian","Pet Friendly"],
  },
  {
    id: "htl-022", name: "The Wilderness Camp", city: "Jim Corbett", address: "Dhikala Zone, Jim Corbett National Park, UK 244715",
    image: "/hotels/htl-022/main.jpg",
    images: ["/hotels/htl-022/main.jpg","/hotels/htl-022/tent.jpg","/hotels/htl-022/bathroom.jpg","/hotels/htl-022/safari.jpg","/hotels/htl-022/view.jpg"],
    rating: 4.5, reviewCount: 580, stars: 3, pricePerNight: 5499, originalPrice: 7999,
    amenities: ["Jungle Safari","Bird Watching","Bonfire","All Meals","Nature Walks","WiFi in Lounge"],
    foodIncluded: "all-meals", wifi: false, parking: true, pool: false, gym: false, spa: false, petFriendly: false,
    refundPolicy: "partial", refundDescription: "50% refund if cancelled 72 hours before.", checkInTime: "14:00", checkOutTime: "10:00",
    rooms: [
      { type: "Jungle Tent", price: 5499, originalPrice: 7999, maxGuests: 2, bedType: "Double", size: "24 sqm", available: 8 },
      { type: "Forest Cottage", price: 8499, originalPrice: 11999, maxGuests: 3, bedType: "King", size: "36 sqm", available: 3 },
    ],
    offers: [{ title: "Tiger Trail", description: "2 safari rides included with 2+ night stay", code: "TIGER2", discount: "Free add-on" }],
    description: "Deep inside Jim Corbett National Park's Dhikala zone, this wildlife camp offers the ultimate Indian safari experience with Bengal tiger sightings and pristine Himalayan foothills.",
    tags: ["Wildlife","Safari","All Meals","Adventure"],
  },
  {
    id: "htl-023", name: "Sunrise Cliff Resort", city: "Varkala", address: "North Cliff, Varkala, Kerala 695141",
    image: "/hotels/htl-023/main.jpg",
    images: ["/hotels/htl-023/main.jpg","/hotels/htl-023/room.jpg","/hotels/htl-023/bathroom.jpg","/hotels/htl-023/cliff.jpg","/hotels/htl-023/pool.jpg"],
    rating: 4.6, reviewCount: 430, stars: 4, pricePerNight: 5999, originalPrice: 8499,
    amenities: ["Cliff View","Pool","Ayurvedic Spa","Restaurant","Yoga","Beach Access"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: true, gym: false, spa: true, petFriendly: false,
    refundPolicy: "partial", refundDescription: "50% refund if cancelled 48 hours before check-in.", checkInTime: "14:00", checkOutTime: "11:00",
    rooms: [
      { type: "Cliff View Room", price: 5999, originalPrice: 8499, maxGuests: 2, bedType: "Queen", size: "30 sqm", available: 5 },
      { type: "Infinity Pool Villa", price: 11999, originalPrice: 16999, maxGuests: 3, bedType: "King", size: "55 sqm", available: 2 },
    ],
    offers: [{ title: "Ayurveda Retreat", description: "5-day Ayurvedic detox at 25% off", code: "AYUR25", discount: "25%" }],
    description: "Perched atop Varkala's dramatic red cliffs overlooking the Arabian Sea, this resort combines Ayurvedic wellness, cliff-top yoga, and Kerala's finest coastal beauty.",
    tags: ["Cliff View","Ayurveda","Beach","Wellness"],
  },
  {
    id: "htl-024", name: "Valley of Flowers Inn", city: "Leh", address: "Fort Road, Leh, Ladakh 194101",
    image: "/hotels/htl-024/main.jpg",
    images: ["/hotels/htl-024/main.jpg","/hotels/htl-024/room.jpg","/hotels/htl-024/bathroom.jpg","/hotels/htl-024/mountain.jpg","/hotels/htl-024/garden.jpg"],
    rating: 4.5, reviewCount: 380, stars: 3, pricePerNight: 3499, originalPrice: 4999,
    amenities: ["Mountain View","Free WiFi","Restaurant","Heating","Oxygen Support","Parking","Bike Rental"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: false, gym: false, spa: false, petFriendly: false,
    refundPolicy: "full", refundDescription: "Free cancellation up to 72 hours before check-in.", checkInTime: "14:00", checkOutTime: "10:00",
    rooms: [
      { type: "Standard Room", price: 3499, originalPrice: 4999, maxGuests: 2, bedType: "Double", size: "20 sqm", available: 8 },
      { type: "Mountain Suite", price: 5999, originalPrice: 8499, maxGuests: 3, bedType: "King", size: "34 sqm", available: 3 },
    ],
    offers: [{ title: "Biker's Stop", description: "Free bike rental for 1 day with 3+ night stay", code: "BIKE3", discount: "Free add-on" }],
    description: "A warm Ladakhi home-stay style inn on Fort Road with panoramic views of Stok Kangri, perfect basecamp for Pangong Lake trips, Nubra Valley excursions, and monastery visits.",
    tags: ["Mountain","Adventure","Biking","Budget"],
  },
  {
    id: "htl-025", name: "The Victoria Grand", city: "Kolkata", address: "Chowringhee Road, Kolkata, WB 700071",
    image: "/hotels/htl-025/main.jpg",
    images: ["/hotels/htl-025/main.jpg","/hotels/htl-025/room.jpg","/hotels/htl-025/bathroom.jpg","/hotels/htl-025/lobby.jpg","/hotels/htl-025/restaurant.jpg","/hotels/htl-025/pool.jpg"],
    rating: 4.7, reviewCount: 1920, stars: 5, pricePerNight: 8499, originalPrice: 11999,
    amenities: ["Free WiFi","Pool","Spa","Gym","Multiple Restaurants","Bar","Business Center","Concierge"],
    foodIncluded: "breakfast", wifi: true, parking: true, pool: true, gym: true, spa: true, petFriendly: false,
    refundPolicy: "full", refundDescription: "Full refund if cancelled 48 hours before check-in.", checkInTime: "14:00", checkOutTime: "12:00",
    rooms: [
      { type: "Deluxe Room", price: 8499, originalPrice: 11999, maxGuests: 2, bedType: "King", size: "36 sqm", available: 6 },
      { type: "Grand Suite", price: 16999, originalPrice: 23999, maxGuests: 3, bedType: "King + Lounge", size: "65 sqm", available: 2 },
      { type: "Maharaja Suite", price: 29999, originalPrice: 42999, maxGuests: 4, bedType: "King + King", size: "95 sqm", available: 1 },
    ],
    offers: [
      { title: "Festive Gala", description: "Complimentary New Year's Eve dinner for 2", code: "NYE2025", discount: "Free add-on" },
      { title: "Weekend Getaway", description: "Stay Fri-Sun, get 25% off", code: "WKND25", discount: "25%" },
    ],
    description: "A grand heritage landmark overlooking the Maidan and Victoria Memorial. Colonial grandeur meets modern luxury with world-class dining, a stunning pool, and impeccable Bengali hospitality.",
    tags: ["Heritage","Luxury","Pool","Spa"],
  },
];
