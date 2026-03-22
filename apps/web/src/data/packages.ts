export interface CityFact {
  name: string;
  nickname: string;
  famousFor: string[];
  didYouKnow: string[];
  mustVisit: string[];
  cuisine: string[];
  demography: string;
  bestTimeToVisit: string;
  funFact: string;
  faqs: { q: string; a: string }[];
}

export interface CountryFaq {
  country: string;
  faqs: { q: string; a: string }[];
}

export interface Guide {
  name: string;
  contact: string;
  languages: string[];
  rating: number;
  experience: string;
  speciality: string;
  photo: string;
  bio: string;
}

export interface Package {
  id: string;
  name: string;
  region: 'India' | 'Abroad';
  subRegion: string;
  cities?: string[];
  countries?: string[];
  price: number;
  originalPrice?: number;
  duration: string;
  durationDays: number;
  durationNights: number;
  hotel: string;
  hotelRating: number;
  food: string[];
  transport: string[];
  activities: string[];
  inclusions: string[];
  exclusions: string[];
  bestSeason: string;
  groupSize: string;
  tripType: 'Leisure' | 'Adventure' | 'Cultural' | 'Honeymoon' | 'Family' | 'Spiritual';
  guide: Guide;
  hospitality: string;
  documents: string[];
  reviews: { user: string; rating: number; comment: string; date: string }[];
  images: string[];
  heroImage: string;
  description: string;
  highlights: string[];
  tags: string[];
  cityFacts?: CityFact[];
  countryFaqs?: CountryFaq[];
}

// ─── Indian City Facts ───────────────────────────────────────────

export const indianCityFacts: Record<string, CityFact> = {
  Delhi: {
    name: 'Delhi',
    nickname: 'Dilli — Heart of India',
    famousFor: ['Red Fort', 'Qutub Minar', 'India Gate', 'Chandni Chowk', 'Humayun\'s Tomb'],
    didYouKnow: [
      'Delhi has been the capital of at least 8 successive empires over 5,000 years.',
      'The Delhi Metro, inaugurated in 2002, is one of Asia\'s largest metro networks.',
      'Connaught Place is among the most expensive commercial districts in the world.',
      'Delhi\'s Jama Masjid, built in 1656, can hold 25,000 worshippers at once.',
    ],
    mustVisit: ['Red Fort', 'Qutub Minar', 'Humayun\'s Tomb', 'India Gate', 'Lotus Temple', 'Akshardham', 'Chandni Chowk bazaar'],
    cuisine: ['Butter Chicken', 'Chole Bhature', 'Paranthe Wali Gali paranthas', 'Kebabs from Karim\'s', 'Jalebi from Old Delhi'],
    demography: 'Population ~33 million (NCR). One of the world\'s most densely populated cities, with residents from every Indian state.',
    bestTimeToVisit: 'Oct – Mar (pleasant winters)',
    funFact: 'Delhi has more trees per capita than any other Indian city — over 10 million trees.',
    faqs: [
      { q: 'Is Delhi safe for foreign tourists?', a: 'Delhi is generally safe for tourists. Stick to well-known areas, use registered cabs (Ola/Uber), and keep your belongings secure in crowded markets like Chandni Chowk.' },
      { q: 'What currency is used in Delhi?', a: 'Indian Rupee (INR). ATMs are widely available, and UPI-based digital payments are accepted almost everywhere.' },
      { q: 'How do I get around Delhi?', a: 'The Delhi Metro is the fastest, cheapest way to get around. Auto-rickshaws, Ola, and Uber are also widely available.' },
      { q: 'What languages are spoken?', a: 'Hindi is primary, but English is widely understood in hotels, restaurants, and tourist areas.' },
      { q: 'What should I wear visiting Delhi\'s monuments?', a: 'Modest clothing is appreciated at religious sites. Carry a scarf or dupatta for mosques and temples.' },
    ]
  },
  Kolkata: {
    name: 'Kolkata',
    nickname: 'City of Joy',
    famousFor: ['Howrah Bridge', 'Victoria Memorial', 'Durga Puja', 'Rasgulla', 'Sunderbans', 'Tram network'],
    didYouKnow: [
      'Kolkata\'s Howrah Bridge carries over 100,000 vehicles and 150,000 pedestrians every single day.',
      'Kolkata is the only city in India that still operates hand-pulled rickshaws.',
      'Rasgulla — India\'s beloved cottage cheese sweet — was invented here in 1868.',
      'Kolkata had India\'s first underground metro, opened in 1984.',
      'The Sunderbans, the world\'s largest mangrove delta, lies at Kolkata\'s doorstep.',
    ],
    mustVisit: ['Victoria Memorial', 'Howrah Bridge', 'Dakshineswar Temple', 'Sunderbans', 'College Street', 'Park Street', 'Marble Palace'],
    cuisine: ['Rasgulla', 'Mishti Doi', 'Kathi Roll', 'Hilsa fish curry', 'Puchka (local pani puri)', 'Kosha Mangsho'],
    demography: 'Population ~15 million. Predominantly Bengali-speaking, with significant Anglo-Indian, Chinese, and Marwari communities.',
    bestTimeToVisit: 'Oct – Feb (especially during Durga Puja in Oct)',
    funFact: 'Kolkata\'s Durga Puja festival is a UNESCO Intangible Cultural Heritage and draws millions of visitors annually.',
    faqs: [
      { q: 'When is the best time to visit Kolkata for Durga Puja?', a: 'Durga Puja falls in October (date varies). The entire city transforms with elaborate pandals — it\'s one of the world\'s greatest street festivals.' },
      { q: 'Can I visit the Sunderbans from Kolkata?', a: 'Yes — the Sunderbans are about 3–4 hours from Kolkata. Day trips and overnight packages are available. You\'ll need a permit to enter the tiger reserve.' },
      { q: 'Is Kolkata vegetarian-friendly?', a: 'Kolkata is famous for its fish and meat dishes, but vegetarian options are widely available everywhere.' },
      { q: 'What is College Street known for?', a: 'College Street is the largest second-hand book market in the world — a paradise for bibliophiles with thousands of stalls.' },
    ]
  },
  Chennai: {
    name: 'Chennai',
    nickname: 'Gateway of South India',
    famousFor: ['Marina Beach', 'Kapaleeshwarar Temple', 'Carnatic music', 'Bharatanatyam', 'Filter coffee', 'Auto industry'],
    didYouKnow: [
      'Marina Beach in Chennai is the world\'s second longest urban beach at 13 km.',
      'Chennai is called the "Detroit of India" — it produces 35% of India\'s automobiles.',
      'The city has one of the oldest film industries in Asia — Tamil cinema (Kollywood).',
      'Chennai\'s Kapaleeshwarar Temple is over 1,300 years old.',
    ],
    mustVisit: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George', 'Government Museum', 'Mahabalipuram (day trip)', 'San Thome Basilica'],
    cuisine: ['Idli-Sambar', 'Dosa', 'Chettinad Chicken Curry', 'Filter Coffee', 'Pongal', 'Sundal'],
    demography: 'Population ~11 million. Predominantly Tamil-speaking. Major IT, automobile, and healthcare hub.',
    bestTimeToVisit: 'Nov – Feb (cooler months)',
    funFact: 'Chennai has the highest number of temples in any Indian city — over 1,000 temples within city limits.',
    faqs: [
      { q: 'Is Chennai very hot?', a: 'Chennai has a tropical climate and can be very humid. Nov–Feb is most comfortable. Stay hydrated and wear light cotton clothing.' },
      { q: 'Can I visit Mahabalipuram from Chennai?', a: 'Absolutely — Mahabalipuram (a UNESCO World Heritage site) is just 60 km south. An easy half-day or full-day trip.' },
      { q: 'What is Chennai famous for food?', a: 'Chennai is the home of authentic South Indian cuisine — crispy dosas, fluffy idlis, and strong filter coffee are must-tries.' },
    ]
  },
  Jaipur: {
    name: 'Jaipur',
    nickname: 'The Pink City',
    famousFor: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Blue pottery', 'Bandhani textiles'],
    didYouKnow: [
      'Jaipur was the world\'s first planned city, designed in 1727 by Maharaja Jai Singh II.',
      'The entire old city was painted pink in 1876 to welcome Prince Albert — and it stayed that way.',
      'Jantar Mantar in Jaipur is the world\'s largest stone sundial, accurate to 2 seconds.',
      'Jaipur has more gemstone traders than anywhere else in the world.',
    ],
    mustVisit: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Nahargarh Fort', 'Johari Bazaar'],
    cuisine: ['Dal Baati Churma', 'Laal Maas', 'Ghewar', 'Pyaaz Kachori', 'Mawa Kachori'],
    demography: 'Population ~4 million. Capital of Rajasthan. Major tourism, gems, and textile hub.',
    bestTimeToVisit: 'Oct – Mar',
    funFact: 'Jaipur is part of India\'s Golden Triangle tourist circuit along with Delhi and Agra.',
    faqs: [
      { q: 'Why is Jaipur called the Pink City?', a: 'In 1876, the entire old city was painted terracotta pink (the color of hospitality) to welcome the Prince of Wales. The tradition has been maintained ever since.' },
      { q: 'What is the best way to explore Amber Fort?', a: 'You can take an elephant ride up to the fort (book early morning), or walk up the stone path. The interiors are best explored with a guide.' },
      { q: 'What to buy in Jaipur?', a: 'Blue pottery, Bandhani dupattas, gemstone jewellery, block-printed textiles, and miniature paintings are the best souvenirs.' },
    ]
  },
};

// ─── Country FAQs ────────────────────────────────────────────────

export const countryFaqs: Record<string, { q: string; a: string }[]> = {
  France: [
    { q: 'Do I need a visa for France?', a: 'Indian passport holders need a Schengen visa. Apply at the French consulate at least 4–6 weeks in advance. Our package includes visa assistance.' },
    { q: 'What is the currency in France?', a: 'Euro (€). Cards are widely accepted but carry some cash for small shops and markets.' },
    { q: 'Is France safe for Indian tourists?', a: 'France is generally safe. Be mindful of pickpockets in tourist areas like the Eiffel Tower and Louvre. Register your valuables.' },
    { q: 'What language do people speak in France?', a: 'French is the official language. In major tourist areas, English is widely understood. A few French phrases go a long way.' },
  ],
  Japan: [
    { q: 'Do Indians need a visa for Japan?', a: 'Yes, Indian passport holders need a Japan tourist visa. Processing takes 5–7 working days. We assist with the application.' },
    { q: 'Is Japan expensive?', a: 'Japan can be pricey in cities but budget-friendly with planning. Our package covers hotels, meals, and transport. Local convenience store food (7-Eleven, FamilyMart) is surprisingly good and cheap.' },
    { q: 'What is the best time to visit Japan?', a: 'Spring (Mar–May) for cherry blossoms and Autumn (Sep–Nov) for foliage are the most spectacular times. Summer has festivals; winter is great for skiing.' },
    { q: 'Can vegetarians eat well in Japan?', a: 'Japan is not the easiest for strict vegetarians, but Buddhist temples serve shojin ryori (vegan cuisine). Ramen, sushi, and tempura can also be made vegetarian upon request.' },
    { q: 'Is it true Japan is cashless?', a: 'Japan is actually still quite cash-heavy. Always carry Japanese Yen. IC cards (Suica/Pasmo) are great for train travel.' },
  ],
  Thailand: [
    { q: 'Do Indians need a visa for Thailand?', a: 'Indian passport holders currently get visa-on-arrival or e-visa for Thailand. Check the latest rules before travel — policies change frequently.' },
    { q: 'What is the best time to visit Thailand?', a: 'Nov – Mar is ideal (dry season). Avoid May–Oct for most regions due to monsoon, except for the Andaman coast which is best in Dec–Apr.' },
    { q: 'Is Thailand vegetarian-friendly?', a: 'Yes! Thai cuisine has great vegetarian options — spring rolls, pad thai, green curry with tofu, and mango sticky rice are all vegetarian-friendly.' },
    { q: 'What should I know about Thai customs?', a: 'Always remove shoes before entering temples. Dress modestly (cover shoulders and knees) at religious sites. Never touch anyone\'s head or point feet at people or Buddha images.' },
  ],
  Dubai: [
    { q: 'Do Indians need a visa for Dubai?', a: 'Indian passport holders can get a Dubai visa on arrival for 14 days (free). For longer stays, a tourist visa is required — we handle this in our package.' },
    { q: 'What is the dress code in Dubai?', a: 'Dubai is liberal by Gulf standards, but dress modestly in public places, malls, and especially near mosques. Swimwear is fine at beaches and pools.' },
    { q: 'Is alcohol available in Dubai?', a: 'Alcohol is available in licensed hotels, restaurants, and bars. It is not sold in general shops and is strictly prohibited in public.' },
    { q: 'What currency is used in Dubai?', a: 'UAE Dirham (AED). 1 AED ≈ ₹22. Cards are widely accepted everywhere.' },
  ],
  Australia: [
    { q: 'Do Indians need a visa for Australia?', a: 'Yes, Indian passport holders need an ETA (Electronic Travel Authority) or tourist visa. We assist with the application process.' },
    { q: 'What is the best time to visit Australia?', a: 'Australia is a year-round destination. Sep–Nov (spring) and Mar–May (autumn) are ideal. December–February is summer (very hot inland, great for beaches).' },
    { q: 'Is Australia vegetarian-friendly?', a: 'Australian cities are very vegetarian and vegan-friendly. You\'ll find great plant-based options in Melbourne and Sydney especially.' },
    { q: 'What are the must-do experiences in Australia?', a: 'Great Barrier Reef snorkelling, Uluru sunrise, Sydney Opera House, the Great Ocean Road, and kangaroo spotting are iconic experiences.' },
  ],
  Singapore: [
    { q: 'Do Indians need a visa for Singapore?', a: 'Indian passport holders can apply for a Singapore tourist visa. The process is straightforward and our team assists with documentation.' },
    { q: 'Is Singapore expensive?', a: 'Singapore is one of Asia\'s priciest cities, but hawker centres offer incredible food for ₹200–400 per meal. Our package covers accommodation and key attractions.' },
    { q: 'What is Singapore famous for?', a: 'Gardens by the Bay, Marina Bay Sands, Sentosa Island, Universal Studios, and its extraordinary hawker food culture.' },
    { q: 'Is Singapore safe?', a: 'Singapore is one of the safest cities in the world with extremely low crime rates. Strict laws — do not litter, chew gum (it\'s banned), or jaywalk.' },
  ],
  Turkey: [
    { q: 'Do Indians need a visa for Turkey?', a: 'Indian passport holders need an e-Visa for Turkey, obtainable online at evisa.gov.tr. It\'s quick and straightforward — we guide you through the process.' },
    { q: 'What currency is used in Turkey?', a: 'Turkish Lira (TRY). Credit cards are widely accepted in cities. Exchange currency at exchange offices (döviz bürosu) for better rates than banks.' },
    { q: 'Is Turkey safe for tourists?', a: 'Popular tourist areas like Istanbul, Cappadocia, and the Aegean coast are very safe. Avoid border regions. General safety precautions apply as in any major city.' },
    { q: 'What is Turkey famous for?', a: 'Hot air balloons over Cappadocia, Istanbul\'s Grand Bazaar and Hagia Sophia, Turkish baths (hammam), and some of the world\'s finest baklava and kebabs.' },
  ],
  'South Korea': [
    { q: 'Do Indians need a visa for South Korea?', a: 'Yes. Indian passport holders need a South Korea tourist visa. Apply at the Korean consulate with a straightforward documentation process.' },
    { q: 'Is South Korea vegetarian-friendly?', a: 'South Korea is challenging for strict vegetarians as most dishes contain meat or seafood. However, Korean Buddhist temple food (temple cuisine) is entirely vegan and available.' },
    { q: 'What is Seoul famous for?', a: 'K-Pop culture, Gyeongbokgung Palace, street food (tteokbokki, Korean fried chicken), Myeongdong shopping, and Bukchon Hanok Village.' },
    { q: 'What is the best time to visit South Korea?', a: 'Spring (Apr–May) for cherry blossoms and Autumn (Sep–Nov) for vibrant fall foliage are the most popular times.' },
  ],
  'Sri Lanka': [
    { q: 'Do Indians need a visa for Sri Lanka?', a: 'Indian passport holders can obtain an ETA (Electronic Travel Authorization) online before arrival. It\'s quick and affordable — we assist with the process.' },
    { q: 'What is the best time to visit Sri Lanka?', a: 'Dec–Mar for the west and south coasts; Jun–Sep for the east coast. Sri Lanka has two distinct monsoon seasons affecting different regions.' },
    { q: 'Is Sri Lanka safe for Indian tourists?', a: 'Yes, Sri Lanka is very welcoming to Indian tourists. The country is culturally close to India, and Hindi/Tamil speakers will find communication easy.' },
    { q: 'What is Sri Lanka famous for?', a: 'Sigiriya Rock Fortress, Dambulla Cave Temple, pristine beaches (Mirissa, Unawatuna), tea plantations in Nuwara Eliya, and incredible spice cuisine.' },
  ],
  Bhutan: [
    { q: 'Do Indians need a visa for Bhutan?', a: 'Indian, Bangladeshi, and Maldivian nationals do NOT need a visa for Bhutan. Just a valid passport or voter ID. A permit is required which we arrange.' },
    { q: 'What is the Sustainable Development Fee (SDF) for Bhutan?', a: 'As of 2023, Indian tourists pay INR 1,200 per day as Sustainable Development Fee. This supports Bhutan\'s conservation efforts.' },
    { q: 'What is Bhutan known for?', a: 'Bhutan is the world\'s only carbon-negative country. Famous for Tiger\'s Nest Monastery, Gross National Happiness philosophy, pristine landscapes, and Buddhist culture.' },
    { q: 'Is Bhutan expensive?', a: 'Beyond the SDF, Bhutan is surprisingly affordable for Indians. Food, hotels, and guides are reasonably priced.' },
  ],
  Vietnam: [
    { q: 'Do Indians need a visa for Vietnam?', a: 'Yes, Indian passport holders can apply for an e-Visa online (valid 90 days). We assist with the process. Visa on arrival is also possible with prior approval.' },
    { q: 'What is Vietnam famous for?', a: 'Ha Long Bay, Hoi An Ancient Town, Vietnamese pho and banh mi, Mekong Delta, and the Cu Chi Tunnels in Ho Chi Minh City.' },
    { q: 'Is Vietnam vegetarian-friendly?', a: 'Vietnam has a strong Buddhist vegetarian tradition. Vegetarian pho, spring rolls, and rice dishes are widely available especially in Hoi An and Hanoi.' },
    { q: 'What is the best time to visit Vietnam?', a: 'Vietnam is long and narrow, so weather varies. Feb–Apr is generally good for the whole country. Avoid central Vietnam in Oct–Nov (typhoon season).' },
  ],
};

// ─── Packages ────────────────────────────────────────────────────

export const packages: Package[] = [

  // ── INDIA ──────────────────────────────────────────────────────

  {
    id: 'india-rajasthan-001',
    name: 'Royal Rajasthan Tour',
    region: 'India',
    subRegion: 'Rajasthan',
    cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer', 'Mount Abu'],
    price: 24999,
    originalPrice: 31999,
    duration: '7 Days / 6 Nights',
    durationDays: 7,
    durationNights: 6,
    hotel: '5-star Heritage Hotels',
    hotelRating: 5,
    food: ['Rajasthani Cuisine', 'Local delicacies', 'Welcome dinner'],
    transport: ['AC Bus', 'Private Car', 'Camel cart'],
    activities: ['Fort visits', 'Camel safari', 'Traditional folk concert', 'Local market tour'],
    inclusions: ['Accommodation', 'Breakfast & dinner', 'AC transport', 'Guide fees', 'Entry tickets'],
    exclusions: ['Flights', 'Lunch', 'Personal expenses', 'Travel insurance'],
    bestSeason: 'Oct – Mar',
    groupSize: '2–20 people',
    tripType: 'Cultural',
    guide: {
      name: 'Raj Singh',
      contact: '+91-9876543210',
      languages: ['Hindi', 'English'],
      rating: 4.8,
      experience: '12 years',
      speciality: 'Heritage & Royal Culture',
      photo: '/guides/raj-singh.jpg',
      bio: 'Born in Jaipur, Raj brings Rajasthan\'s royal stories to life with unmatched passion.'
    },
    hospitality: 'Royal welcome with garland & tilak, cultural evenings under the stars',
    documents: ['Aadhaar / ID Proof'],
    reviews: [
      { user: 'Amit S.', rating: 5, comment: 'Amazing experience, great hospitality!', date: '2024-11-12' },
      { user: 'Priya K.', rating: 4, comment: 'Loved the folk concert and food.', date: '2024-10-05' }
    ],
    images: ['/travel-packages/india/jodhpur1.jpg', '/travel-packages/india/udaipur1.jpg'],
    heroImage: '/travel-packages/india/jodhpur1.jpg',
    description: 'Explore the royal heritage, forts, and vibrant culture of Rajasthan with expert guides. From the pink city of Jaipur to the golden dunes of Jaisalmer, every moment is steeped in royalty.',
    highlights: [
      'Private access to heritage forts at golden hour',
      'Authentic camel safari in Jaisalmer dunes',
      'Cultural folk evening with local artists',
      'Stay in curated palace & haveli hotels'
    ],
    tags: ['Heritage', 'Culture', 'Desert', 'Forts'],
    cityFacts: [indianCityFacts.Jaipur],
  },

  {
    id: 'india-delhi-agra-001',
    name: 'Golden Triangle — Delhi, Agra & Jaipur',
    region: 'India',
    subRegion: 'North India',
    cities: ['Delhi', 'Agra', 'Jaipur'],
    price: 18999,
    originalPrice: 24999,
    duration: '6 Days / 5 Nights',
    durationDays: 6,
    durationNights: 5,
    hotel: '4-star Hotels',
    hotelRating: 4,
    food: ['Mughlai Cuisine', 'Rajasthani thali', 'Street food tour'],
    transport: ['AC Car', 'Train (Delhi–Agra Shatabdi)'],
    activities: ['Taj Mahal sunrise visit', 'Red Fort tour', 'Amber Fort elephant ride', 'Chandni Chowk food walk'],
    inclusions: ['Accommodation', 'Daily breakfast', 'AC transport', 'Guide', 'Entry tickets', 'Train tickets'],
    exclusions: ['Flights to Delhi', 'Lunch & dinner', 'Personal expenses'],
    bestSeason: 'Oct – Mar',
    groupSize: '2–16 people',
    tripType: 'Cultural',
    guide: {
      name: 'Arjun Sharma',
      contact: '+91-9811234567',
      languages: ['Hindi', 'English', 'French'],
      rating: 4.9,
      experience: '14 years',
      speciality: 'Mughal History & Architecture',
      photo: '/guides/arjun-sharma.jpg',
      bio: 'An archaeology graduate from Delhi University, Arjun has guided 5,000+ tourists through the Golden Triangle.'
    },
    hospitality: 'Welcome with traditional tilak, farewell dinner at a rooftop Mughal restaurant',
    documents: ['Aadhaar / ID Proof'],
    reviews: [
      { user: 'Marco T.', rating: 5, comment: 'The Taj at sunrise was life-changing. Arjun\'s stories made everything come alive.', date: '2024-12-10' },
      { user: 'Yuki N.', rating: 5, comment: 'Best organised trip. Every detail was perfect.', date: '2024-11-22' }
    ],
    images: ['/travel-packages/india/taj1.jpg', '/travel-packages/india/lotus1.jpeg'],
    heroImage: '/travel-packages/india/jodhpur1.jpg',
    description: 'India\'s most iconic circuit — the Mughal grandeur of Delhi and Agra, and the royal pink lanes of Jaipur. Witness the Taj Mahal at sunrise, explore medieval forts, and taste the richest cuisine India offers.',
    highlights: [
      'Taj Mahal at sunrise — the most iconic image in the world',
      'Chandni Chowk midnight street food walk',
      'Amber Fort elephant ride at golden hour',
      'Guided tour of Red Fort\'s secret chambers'
    ],
    tags: ['Heritage', 'Mughal', 'Iconic', 'Photography', 'History'],
    cityFacts: [indianCityFacts.Delhi, indianCityFacts.Jaipur],
  },

  {
    id: 'india-kolkata-001',
    name: 'Kolkata & Sunderbans Explorer',
    region: 'India',
    subRegion: 'East India',
    cities: ['Kolkata', 'Sunderbans'],
    price: 16999,
    originalPrice: 21999,
    duration: '5 Days / 4 Nights',
    durationDays: 5,
    durationNights: 4,
    hotel: 'Heritage Boutique Hotels',
    hotelRating: 4,
    food: ['Bengali cuisine', 'Hilsa fish curry', 'Rasgulla & mishti doi', 'College Street coffee'],
    transport: ['AC Car', 'Boat (Sunderbans)', 'Tram ride'],
    activities: ['Victoria Memorial tour', 'Howrah Bridge walk', 'Sunderbans tiger safari', 'Durga Puja pandal hopping', 'Tram ride through old Kolkata'],
    inclusions: ['Accommodation', 'Daily breakfast', 'Sunderbans boat safari', 'Guide', 'All entry tickets'],
    exclusions: ['Flights to Kolkata', 'Lunch & dinner (except day 1)', 'Personal expenses'],
    bestSeason: 'Oct – Feb',
    groupSize: '2–12 people',
    tripType: 'Cultural',
    guide: {
      name: 'Debashis Roy',
      contact: '+91-9830123456',
      languages: ['Bengali', 'Hindi', 'English'],
      rating: 4.7,
      experience: '10 years',
      speciality: 'Bengali Culture & Wildlife',
      photo: '/guides/debashis-roy.jpg',
      bio: 'A Kolkata native and wildlife photographer, Debashis knows every corner of the City of Joy and the Sunderbans.'
    },
    hospitality: 'Welcome with mishti doi and traditional Bengali hospitality, heritage hotel stay',
    documents: ['Aadhaar / ID Proof', 'Sunderbans permit (arranged)'],
    reviews: [
      { user: 'Anita M.', rating: 5, comment: 'The Sunderbans boat safari was incredible. Saw a Royal Bengal Tiger!', date: '2024-11-30' },
      { user: 'James H.', rating: 4, comment: 'Kolkata surprised me — so much history and the food was extraordinary.', date: '2024-10-18' }
    ],
    images: ['/travel-packages/india/sundar1.jpeg', '/travel-packages/india/victoria1.jpeg'],
    heroImage: '/packages/kolkata1.jpg',
    description: 'Discover Kolkata — India\'s most intellectually alive city — then venture into the Sunderbans, the world\'s largest mangrove delta and home to the Royal Bengal Tiger. Culture, wildlife, and soul in one journey.',
    highlights: [
      'Royal Bengal Tiger boat safari in the Sunderbans',
      'Victoria Memorial — India\'s finest colonial building',
      'Ride Kolkata\'s iconic 150-year-old trams',
      'Midnight street food tour of Park Street'
    ],
    tags: ['Culture', 'Wildlife', 'Heritage', 'Bengal', 'Food'],
    cityFacts: [indianCityFacts.Kolkata],
  },

  {
    id: 'india-south-001',
    name: 'South India Temple Trail',
    region: 'India',
    subRegion: 'South India',
    cities: ['Chennai', 'Mahabalipuram', 'Pondicherry', 'Thanjavur', 'Madurai'],
    price: 21999,
    originalPrice: 27999,
    duration: '7 Days / 6 Nights',
    durationDays: 7,
    durationNights: 6,
    hotel: '4-star Hotels & Boutique Stays',
    hotelRating: 4,
    food: ['Chettinad cuisine', 'Tamil Brahmin thali', 'French-Tamil fusion in Pondicherry', 'Filter coffee'],
    transport: ['AC Car', 'Train (Chennai–Madurai)'],
    activities: ['Mahabalipuram UNESCO site', 'Brihadeeswarar Temple', 'French Quarter Pondicherry walk', 'Meenakshi Amman Temple tour', 'Marina Beach sunrise'],
    inclusions: ['All accommodation', 'Daily breakfast', 'AC transport throughout', 'Expert guide', 'Entry fees'],
    exclusions: ['Flights', 'Lunch & dinner', 'Personal expenses'],
    bestSeason: 'Nov – Feb',
    groupSize: '2–14 people',
    tripType: 'Spiritual',
    guide: {
      name: 'Kavitha Rajan',
      contact: '+91-9444123456',
      languages: ['Tamil', 'English', 'Hindi'],
      rating: 4.8,
      experience: '11 years',
      speciality: 'Dravidian Architecture & Temple Rituals',
      photo: '/guides/kavitha-rajan.jpg',
      bio: 'Kavitha holds a PhD in South Indian temple architecture and has been guiding scholars and tourists since 2013.'
    },
    hospitality: 'Traditional Tamil welcome with kolam and flowers, authentic home-stay dinner night',
    documents: ['Aadhaar / ID Proof'],
    reviews: [
      { user: 'Robert F.', rating: 5, comment: 'Kavitha\'s knowledge of temple architecture was astounding. A truly spiritual journey.', date: '2024-12-05' },
      { user: 'Meena K.', rating: 5, comment: 'Best tour of South India I\'ve ever taken. Mahabalipuram at dawn was ethereal.', date: '2024-11-14' }
    ],
    images: ['/travel-packages/india/temple1.jpeg', '/travel-packages/india/pondi1.jpeg'],
    heroImage: '/packages/south-india1.jpg',
    description: 'Journey through the Dravidian heartland — ancient temples carved from stone, French colonial boulevards, crashing Bay of Bengal waves, and some of the world\'s most complex religious architecture.',
    highlights: [
      'Sunrise at Mahabalipuram\'s Shore Temple (UNESCO)',
      'Meenakshi Amman Temple evening ritual ceremony',
      'Pondicherry French Quarter heritage walk',
      'Brihadeeswarar Temple — a 1,000-year-old architectural marvel'
    ],
    tags: ['Spiritual', 'Temples', 'UNESCO', 'South India', 'History'],
    cityFacts: [indianCityFacts.Chennai],
  },

  // ── ABROAD ─────────────────────────────────────────────────────

  {
    id: 'abroad-europe-001',
    name: 'Europe Explorer',
    region: 'Abroad',
    subRegion: 'Europe',
    countries: ['France', 'Italy', 'Switzerland', 'Germany', 'Netherlands'],
    price: 149999,
    originalPrice: 189999,
    duration: '12 Days / 11 Nights',
    durationDays: 12,
    durationNights: 11,
    hotel: 'Luxury European Hotels',
    hotelRating: 5,
    food: ['Continental', 'Local specialties', 'Wine tasting included'],
    transport: ['International flights', 'Inter-city trains', 'Coach'],
    activities: ['Eiffel Tower visit', 'Colosseum tour', 'Swiss Alps excursion', 'Amsterdam canals', 'Museum tours'],
    inclusions: ['Return flights', 'All accommodation', 'Daily breakfast', 'Schengen visa assistance', 'Guide', 'Transport'],
    exclusions: ['Lunch & dinner (except specified)', 'Travel insurance', 'Personal expenses'],
    bestSeason: 'Apr – Oct',
    groupSize: '4–20 people',
    tripType: 'Leisure',
    guide: {
      name: 'Anna Müller',
      contact: '+49-123456789',
      languages: ['English', 'German', 'French'],
      rating: 4.9,
      experience: '9 years',
      speciality: 'European Art & Architecture',
      photo: '/guides/anna-muller.jpg',
      bio: 'A Berlin-based art historian, Anna makes every museum and monument come alive.'
    },
    hospitality: 'Warm European hospitality with welcome dinner in Paris',
    documents: ['Passport (6 months validity)', 'Schengen Visa'],
    reviews: [
      { user: 'John D.', rating: 5, comment: 'Best trip ever, loved the activities!', date: '2024-09-20' },
      { user: 'Sara M.', rating: 4, comment: 'Great guides and food.', date: '2024-08-14' }
    ],
    images: ['/travel-packages/abroad/europe1.jpeg', '/packages/europe2.jpg'],
    heroImage: '/packages/europe1.jpg',
    description: 'Discover the best of Europe — from the romantic streets of Paris to the canals of Amsterdam. Curated experiences, world-class hotels, and expert local guides make every day unforgettable.',
    highlights: [
      'Private Eiffel Tower visit at sunset',
      'Swiss Alps day trip with panoramic views',
      'Expert art historian guide for museums',
      'Luxury 4–5 star hotels throughout'
    ],
    tags: ['Europe', 'History', 'Art', 'Luxury', 'Multi-country'],
    countryFaqs: [
      { country: 'France', faqs: countryFaqs.France },
    ],
  },

  {
    id: 'abroad-japan-001',
    name: 'Japan: Ancient & Modern',
    region: 'Abroad',
    subRegion: 'Japan',
    countries: ['Japan'],
    cities: ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara'],
    price: 189999,
    originalPrice: 239999,
    duration: '10 Days / 9 Nights',
    durationDays: 10,
    durationNights: 9,
    hotel: 'Mix of City Hotels & Traditional Ryokan',
    hotelRating: 5,
    food: ['Japanese ramen', 'Sushi & sashimi', 'Kaiseki dinner', 'Street food in Osaka', 'Matcha everything'],
    transport: ['Return flights', 'JR Pass (bullet train)', 'Local metro'],
    activities: ['Fushimi Inari 10,000 torii gates', 'Nishiki Market Kyoto', 'Hiroshima Peace Memorial', 'TeamLab Planets Tokyo', 'Nara deer park', 'Traditional tea ceremony'],
    inclusions: ['Return flights', 'All accommodation (incl. 2 nights ryokan)', 'JR Pass', 'Daily breakfast', 'Guide', 'Visa assistance'],
    exclusions: ['Lunch & dinner (except ryokan)', 'Travel insurance', 'Personal shopping'],
    bestSeason: 'Mar – May (cherry blossom) · Sep – Nov (autumn)',
    groupSize: '2–14 people',
    tripType: 'Cultural',
    guide: {
      name: 'Yuki Tanaka',
      contact: '+81-90-1234-5678',
      languages: ['Japanese', 'English', 'Hindi (basic)'],
      rating: 4.9,
      experience: '8 years',
      speciality: 'Japanese History, Zen & Contemporary Art',
      photo: '/guides/yuki-tanaka.jpg',
      bio: 'Yuki grew up in Kyoto surrounded by temples and has a rare ability to bridge traditional Japan with its ultra-modern present.'
    },
    hospitality: 'Welcome onsen (hot spring) evening, kimono experience in Kyoto',
    documents: ['Passport (6 months validity)', 'Japan Tourist Visa'],
    reviews: [
      { user: 'Priya S.', rating: 5, comment: 'Japan was everything I dreamed of. The ryokan experience was unforgettable.', date: '2024-11-05' },
      { user: 'Carlos M.', rating: 5, comment: 'Yuki is the best guide I\'ve ever had. Deep knowledge, warm personality.', date: '2024-10-12' }
    ],
    images: ['/travel-packages/abroad/fuji1.jpeg', '/travel-packages/abroad/japan1.jpeg'],
    heroImage: '/travel-packages/abroad/fuji1.jpeg',
    description: 'Japan is unlike anywhere on earth — neon-lit Tokyo alongside 1,000-year-old temples, bullet trains past snow-capped Fuji, geisha streets in Kyoto, and the world\'s most extraordinary food culture. This is Japan at its full depth.',
    highlights: [
      'Sleep in a traditional ryokan with onsen bath',
      'Fushimi Inari — 10,000 vermillion torii gates at dawn',
      'TeamLab Planets — the most immersive art experience on the planet',
      'Tea ceremony with a Kyoto tea master'
    ],
    tags: ['Japan', 'Culture', 'Architecture', 'Food', 'Art', 'Cherry Blossom'],
    countryFaqs: [{ country: 'Japan', faqs: countryFaqs.Japan }],
  },

  {
    id: 'abroad-thailand-001',
    name: 'Thailand: Temples, Beaches & Street Food',
    region: 'Abroad',
    subRegion: 'Thailand',
    countries: ['Thailand'],
    cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Koh Samui'],
    price: 74999,
    originalPrice: 94999,
    duration: '8 Days / 7 Nights',
    durationDays: 8,
    durationNights: 7,
    hotel: '4-5 Star Resort Hotels',
    hotelRating: 4,
    food: ['Pad Thai', 'Tom Yum soup', 'Mango sticky rice', 'Night market street food', 'Thai green curry'],
    transport: ['Return flights', 'Domestic flight (Bangkok–Phuket)', 'Tuk-tuk', 'Longtail boat'],
    activities: ['Grand Palace Bangkok', 'Elephant sanctuary Chiang Mai', 'Phi Phi Islands snorkelling', 'Thai cooking class', 'Floating market visit', 'Wat Pho temple massage'],
    inclusions: ['Return flights', 'All hotels', 'Daily breakfast', 'Domestic flight', 'Guide', 'Elephant sanctuary visit'],
    exclusions: ['Lunch & dinner (except specified)', 'Travel insurance', 'Personal expenses'],
    bestSeason: 'Nov – Mar',
    groupSize: '2–18 people',
    tripType: 'Leisure',
    guide: {
      name: 'Nong Siriporn',
      contact: '+66-81-234-5678',
      languages: ['Thai', 'English'],
      rating: 4.8,
      experience: '7 years',
      speciality: 'Thai Culture, Buddhist Temples & Beach Destinations',
      photo: '/guides/nong-siriporn.jpg',
      bio: 'Bangkok-born Nong has an infectious enthusiasm for Thai food and culture, and knows every hidden gem from the city to the islands.'
    },
    hospitality: 'Traditional Thai welcome garland, sunset cocktail cruise on arrival',
    documents: ['Passport (6 months validity)', 'Thailand Visa-on-Arrival / e-Visa'],
    reviews: [
      { user: 'Rahul K.', rating: 5, comment: 'The elephant sanctuary was the highlight of our lives. Absolutely ethical and beautiful.', date: '2024-12-14' },
      { user: 'Sophie L.', rating: 4, comment: 'Thailand is stunning. Phi Phi Islands snorkelling was breathtaking.', date: '2024-11-08' }
    ],
    images: ['/travel-packages/abroad/thailand1.jpg', '/travel-packages/abroad/thailand2.jpg'],
    heroImage: '/packages/thailand1.jpg',
    description: 'From Bangkok\'s glittering temples to Chiang Mai\'s misty mountains to the turquoise waters of Phuket — Thailand delivers an extraordinary mix of culture, nature, and flavour in one of Southeast Asia\'s most accessible countries.',
    highlights: [
      'Ethical elephant sanctuary experience in Chiang Mai',
      'Phi Phi Islands snorkelling in crystal-clear waters',
      'Grand Palace & Emerald Buddha — Thailand\'s most sacred site',
      'Thai cooking masterclass with a local chef'
    ],
    tags: ['Beach', 'Culture', 'Food', 'Temples', 'Nature', 'Thailand'],
    countryFaqs: [{ country: 'Thailand', faqs: countryFaqs.Thailand }],
  },

  {
    id: 'abroad-dubai-001',
    name: 'Dubai: Desert Luxury & Skyscrapers',
    region: 'Abroad',
    subRegion: 'Dubai',
    countries: ['UAE'],
    cities: ['Dubai', 'Abu Dhabi'],
    price: 84999,
    originalPrice: 109999,
    duration: '6 Days / 5 Nights',
    durationDays: 6,
    durationNights: 5,
    hotel: '5-Star Dubai Hotels',
    hotelRating: 5,
    food: ['Arabic mezze', 'Emirati camel milk', 'International fine dining', 'Gold-flecked desserts', 'Shawarma street food'],
    transport: ['Return flights', 'Private transfers', 'Desert safari 4WD'],
    activities: ['Burj Khalifa observation deck', 'Desert safari with dune bashing', 'Dubai Mall & fountain show', 'Dhow cruise dinner', 'Louvre Abu Dhabi', 'Gold Souk & Spice Souk'],
    inclusions: ['Return flights', 'Luxury hotel', 'Daily breakfast', 'Desert safari', 'Dhow cruise', 'Guide', 'All transfers'],
    exclusions: ['Visa (we assist)', 'Lunch & dinner (except dhow cruise)', 'Personal shopping'],
    bestSeason: 'Nov – Mar',
    groupSize: '2–20 people',
    tripType: 'Leisure',
    guide: {
      name: 'Omar Al-Rashid',
      contact: '+971-50-123-4567',
      languages: ['Arabic', 'English', 'Hindi', 'Urdu'],
      rating: 4.8,
      experience: '10 years',
      speciality: 'Dubai Luxury & Desert Experiences',
      photo: '/guides/omar-rashid.jpg',
      bio: 'Omar is a Dubai local who knows the city\'s transformation from fishing village to global luxury hub intimately.'
    },
    hospitality: 'VIP airport pickup in luxury car, Arabic coffee & dates welcome ritual',
    documents: ['Passport (6 months validity)', 'UAE Visa-on-Arrival (Indian passport)'],
    reviews: [
      { user: 'Neha R.', rating: 5, comment: 'The desert safari and the Burj Khalifa at night — surreal experiences.', date: '2024-12-20' },
      { user: 'Tom W.', rating: 5, comment: 'Pure luxury from start to finish. Omar made everything seamless.', date: '2024-11-28' }
    ],
    images: ['/travel-packages/abroad/dubai1.jpg', '/travel-packages/abroad/dubai2.jpg'],
    heroImage: '/travel-packages/abroad/dubai1.jpg',
    description: 'Dubai is humanity\'s most audacious city — the world\'s tallest building, the world\'s largest mall, artificial islands, and then just 45 minutes away: vast silent desert under a billion stars. This package shows you both worlds.',
    highlights: [
      'Burj Khalifa 148th floor At the Top SKY experience',
      'Private desert safari with camel ride & BBQ dinner',
      'Dhow cruise dinner on Dubai Creek',
      'Louvre Abu Dhabi — art spanning 5,000 years'
    ],
    tags: ['Luxury', 'Desert', 'Architecture', 'Shopping', 'UAE'],
    countryFaqs: [{ country: 'Dubai', faqs: countryFaqs.Dubai }],
  },

  {
    id: 'abroad-australia-001',
    name: 'Australia: Icons & Outback',
    region: 'Abroad',
    subRegion: 'Australia',
    countries: ['Australia'],
    cities: ['Sydney', 'Melbourne', 'Cairns', 'Uluru'],
    price: 229999,
    originalPrice: 289999,
    duration: '12 Days / 11 Nights',
    durationDays: 12,
    durationNights: 11,
    hotel: '4-5 Star Hotels & Eco-Lodges',
    hotelRating: 4,
    food: ['Australian BBQ', 'Modern Australian fusion', 'Seafood in Sydney', 'Indigenous bush tucker experience'],
    transport: ['Return flights', 'Domestic flights (Sydney–Cairns–Uluru)', 'Coach transfers'],
    activities: ['Sydney Opera House tour', 'Great Barrier Reef snorkelling', 'Uluru sunrise walk', 'Melbourne laneway art tour', 'Kangaroo & koala wildlife park', 'Great Ocean Road drive'],
    inclusions: ['Return international flights', 'All domestic flights', 'Hotels & eco-lodges', 'Daily breakfast', 'GBR snorkelling', 'Guide', 'Transfers'],
    exclusions: ['Australia visa (we assist)', 'Lunch & dinner', 'Travel insurance', 'Personal expenses'],
    bestSeason: 'Sep – Nov · Mar – May',
    groupSize: '2–14 people',
    tripType: 'Adventure',
    guide: {
      name: 'Sarah Mitchell',
      contact: '+61-400-123-456',
      languages: ['English'],
      rating: 4.9,
      experience: '11 years',
      speciality: 'Australian Wildlife & Indigenous Culture',
      photo: '/guides/sarah-mitchell.jpg',
      bio: 'Sarah is a marine biologist turned guide with a passion for Australia\'s extraordinary natural world and Aboriginal heritage.'
    },
    hospitality: 'Welcome with Australian wines, Indigenous Welcome to Country ceremony at Uluru',
    documents: ['Passport (6 months validity)', 'Australia Tourist Visa (ETA)'],
    reviews: [
      { user: 'Vikram P.', rating: 5, comment: 'The Great Barrier Reef was a religious experience. Sarah\'s marine biology knowledge made it extraordinary.', date: '2024-11-15' },
      { user: 'Claire B.', rating: 5, comment: 'Uluru at sunrise. I cried. Enough said.', date: '2024-10-22' }
    ],
    images: ['/travel-packages/abroad/aus1.jpg', '/travel-packages/abroad/aus2.jpg'],
    heroImage: '/travel-packages/abroad/aus1.jpg',
    description: 'Australia is a continent of extremes — neon coral reefs, sandstone monoliths glowing red at dusk, penguins waddling up beaches, and cities ranked the world\'s most liveable. This journey covers the best of all of it.',
    highlights: [
      'Great Barrier Reef — the world\'s largest living organism',
      'Uluru sunrise & Aboriginal Dreamtime stories',
      'Sydney Opera House guided backstage tour',
      'Kangaroo and koala encounter at wildlife sanctuary'
    ],
    tags: ['Australia', 'Wildlife', 'Adventure', 'Nature', 'UNESCO'],
    countryFaqs: [{ country: 'Australia', faqs: countryFaqs.Australia }],
  },

  {
    id: 'abroad-singapore-001',
    name: 'Singapore: The Future City',
    region: 'Abroad',
    subRegion: 'Singapore',
    countries: ['Singapore'],
    price: 89999,
    originalPrice: 114999,
    duration: '5 Days / 4 Nights',
    durationDays: 5,
    durationNights: 4,
    hotel: '5-Star Singapore Hotels',
    hotelRating: 5,
    food: ['Hawker centre feast', 'Chilli crab', 'Laksa', 'Hainanese chicken rice', 'Durian (optional!)'],
    transport: ['Return flights', 'MRT passes', 'Private transfers'],
    activities: ['Gardens by the Bay', 'Marina Bay Sands SkyPark', 'Sentosa Island & Universal Studios', 'Singapore Botanic Gardens', 'Night Safari', 'Hawker centre food tour'],
    inclusions: ['Return flights', '5-star hotel', 'MRT passes', 'Universal Studios tickets', 'Night Safari', 'Daily breakfast', 'Guide'],
    exclusions: ['Visa (we assist)', 'Lunch & dinner (except hawker tour)', 'Personal shopping'],
    bestSeason: 'Feb – Apr · Jul – Sep',
    groupSize: '2–16 people',
    tripType: 'Family',
    guide: {
      name: 'Wei Lin Tan',
      contact: '+65-9123-4567',
      languages: ['English', 'Mandarin', 'Tamil', 'Malay'],
      rating: 4.8,
      experience: '8 years',
      speciality: 'Singapore Food Culture & Urban Architecture',
      photo: '/guides/wei-lin-tan.jpg',
      bio: 'Wei Lin is a true Singaporean who speaks four languages and can navigate the city\'s extraordinary food scene with her eyes closed.'
    },
    hospitality: 'Welcome with Merlion sightseeing cruise, farewell dinner at Makansutra Gluttons Bay hawker centre',
    documents: ['Passport (6 months validity)', 'Singapore Tourist Visa'],
    reviews: [
      { user: 'Divya R.', rating: 5, comment: 'Singapore with kids was perfect. Clean, safe, and incredible food. Universal Studios was a dream!', date: '2024-12-08' },
      { user: 'Adrian K.', rating: 4, comment: 'Compact but extraordinary. Gardens by the Bay at night is pure magic.', date: '2024-10-30' }
    ],
    images: ['/travel-packages/abroad/singapore1.jpg', '/travel-packages/abroad/singapore2.jpg'],
    heroImage: '/travel-packages/abroad/singapore1.jpg',
    description: 'Singapore is 720 square kilometres of extraordinary urban achievement — supertrees that generate solar power, an airport that is a tourist destination in itself, a hawker food culture declared UNESCO heritage, and a skyline that glows gold every night.',
    highlights: [
      'Marina Bay Sands SkyPark — iconic Singapore view',
      'Gardens by the Bay light show after dark',
      'World-class hawker food tour with local guide',
      'Universal Studios Singapore full-day experience'
    ],
    tags: ['Singapore', 'Family', 'Food', 'Architecture', 'Theme Parks'],
    countryFaqs: [{ country: 'Singapore', faqs: countryFaqs.Singapore }],
  },

  {
    id: 'abroad-turkey-001',
    name: 'Turkey: Where Continents Meet',
    region: 'Abroad',
    subRegion: 'Turkey',
    countries: ['Turkey'],
    cities: ['Istanbul', 'Cappadocia', 'Pamukkale', 'Ephesus'],
    price: 104999,
    originalPrice: 134999,
    duration: '9 Days / 8 Nights',
    durationDays: 9,
    durationNights: 8,
    hotel: '4-5 Star Cave Hotels & Boutique Hotels',
    hotelRating: 4,
    food: ['Kebabs & mezze', 'Baklava', 'Turkish breakfast spread', 'Borek', 'Turkish tea & coffee'],
    transport: ['Return flights', 'Domestic flight (Istanbul–Cappadocia)', 'Private coach'],
    activities: ['Hot air balloon Cappadocia', 'Hagia Sophia & Blue Mosque', 'Grand Bazaar Istanbul', 'Pamukkale thermal pools', 'Ephesus ancient city walk', 'Turkish hammam experience'],
    inclusions: ['Return flights', 'All hotels (incl. cave hotel in Cappadocia)', 'Daily breakfast', 'Hot air balloon', 'Domestic flight', 'Guide', 'Hammam experience'],
    exclusions: ['Visa (e-Visa, we assist)', 'Lunch & dinner', 'Travel insurance'],
    bestSeason: 'Apr – Jun · Sep – Nov',
    groupSize: '2–16 people',
    tripType: 'Cultural',
    guide: {
      name: 'Mehmet Yilmaz',
      contact: '+90-532-123-4567',
      languages: ['Turkish', 'English', 'Arabic'],
      rating: 4.9,
      experience: '13 years',
      speciality: 'Ottoman History & Anatolian Archaeology',
      photo: '/guides/mehmet-yilmaz.jpg',
      bio: 'A history graduate from Istanbul University, Mehmet has guided everyone from archaeology students to UNESCO delegates through Turkey\'s astonishing heritage.'
    },
    hospitality: 'Welcome Turkish tea & baklava, sunset boat cruise on the Bosphorus',
    documents: ['Passport (6 months validity)', 'Turkey e-Visa'],
    reviews: [
      { user: 'Ananya S.', rating: 5, comment: 'The hot air balloon over Cappadocia at sunrise is the single most beautiful thing I have ever seen.', date: '2024-10-25' },
      { user: 'Peter D.', rating: 5, comment: 'Istanbul alone justifies the trip. Mehmet\'s knowledge of the Ottoman Empire is encyclopaedic.', date: '2024-09-18' }
    ],
    images: ['/packages/turkey1.jpg', '/packages/turkey2.jpg'],
    heroImage: '/packages/turkey1.jpg',
    description: 'Turkey is the only country straddling two continents, and it shows — Byzantine mosaics beside Ottoman minarets, ancient Greek ruins beside lunar Cappadocian valleys, thermal Roman pools beside Mediterranean turquoise. Europe and Asia in one extraordinary journey.',
    highlights: [
      'Hot air balloon at sunrise over Cappadocia fairy chimneys',
      'Hagia Sophia — 1,500 years of history in one building',
      'Sleep in a cave hotel carved from volcanic rock',
      'Grand Bazaar — the world\'s oldest shopping mall (1461 AD)'
    ],
    tags: ['Turkey', 'History', 'Cappadocia', 'Cultural', 'UNESCO', 'Balloon'],
    countryFaqs: [{ country: 'Turkey', faqs: countryFaqs.Turkey }],
  },

  {
    id: 'abroad-south-korea-001',
    name: 'South Korea: K-Culture & Ancient Palaces',
    region: 'Abroad',
    subRegion: 'South Korea',
    countries: ['South Korea'],
    cities: ['Seoul', 'Busan', 'Gyeongju', 'Jeju Island'],
    price: 134999,
    originalPrice: 169999,
    duration: '9 Days / 8 Nights',
    durationDays: 9,
    durationNights: 8,
    hotel: '4-5 Star Hotels & Traditional Hanok Stay',
    hotelRating: 4,
    food: ['Korean BBQ', 'Tteokbokki', 'Bibimbap', 'Korean fried chicken', 'Haenyeo seafood (Jeju)'],
    transport: ['Return flights', 'KTX bullet train (Seoul–Busan)', 'Domestic flight to Jeju', 'Metro'],
    activities: ['Gyeongbokgung Palace', 'K-Pop culture experience', 'Myeongdong street food', 'Bulguksa Temple Gyeongju', 'Jeju lava tube caves', 'Busan fish market & Gamcheon Village'],
    inclusions: ['Return flights', 'All accommodation (incl. hanok stay)', 'KTX train', 'Jeju domestic flight', 'Daily breakfast', 'Guide'],
    exclusions: ['Visa (we assist)', 'Lunch & dinner', 'Personal shopping', 'Travel insurance'],
    bestSeason: 'Apr – Jun · Sep – Nov',
    groupSize: '2–14 people',
    tripType: 'Cultural',
    guide: {
      name: 'Ji-Ho Park',
      contact: '+82-10-1234-5678',
      languages: ['Korean', 'English', 'Japanese'],
      rating: 4.8,
      experience: '7 years',
      speciality: 'Korean History, K-Pop Culture & Gastronomy',
      photo: '/guides/ji-ho-park.jpg',
      bio: 'Seoul-born Ji-Ho brings equal passion to 600-year-old Joseon dynasty palaces and the latest K-Pop entertainment districts.'
    },
    hospitality: 'Welcome with traditional Korean tea ceremony, hanbok (traditional dress) experience',
    documents: ['Passport (6 months validity)', 'South Korea Tourist Visa'],
    reviews: [
      { user: 'Ishaan G.', rating: 5, comment: 'The K-Pop experience, the food, the palaces — South Korea exceeded every expectation.', date: '2024-11-20' },
      { user: 'Emma R.', rating: 5, comment: 'Sleeping in a hanok under the stars in Gyeongju was magical. Ji-Ho is wonderful.', date: '2024-10-14' }
    ],
    images: ['/packages/south-korea1.jpg', '/packages/south-korea2.jpg'],
    heroImage: '/packages/south-korea1.jpg',
    description: 'South Korea is the world\'s most dramatic cultural contrast — ancient wooden palaces beside futuristic glass towers, K-Pop neon beside 1,500-year-old Buddhist temples, kimchi alongside the world\'s most innovative street food. This is modernity and antiquity living side by side.',
    highlights: [
      'Gyeongbokgung Palace changing of the guard ceremony',
      'Stay one night in a traditional Hanok village',
      'K-Pop entertainment district experience in Hongdae',
      'Jeju Island\'s UNESCO lava tube caves'
    ],
    tags: ['South Korea', 'K-Pop', 'Culture', 'Food', 'History', 'Temples'],
    countryFaqs: [{ country: 'South Korea', faqs: countryFaqs['South Korea'] }],
  },

  {
    id: 'abroad-sri-lanka-001',
    name: 'Sri Lanka: Pearl of the Indian Ocean',
    region: 'Abroad',
    subRegion: 'Sri Lanka',
    countries: ['Sri Lanka'],
    cities: ['Colombo', 'Kandy', 'Sigiriya', 'Mirissa', 'Ella'],
    price: 54999,
    originalPrice: 69999,
    duration: '8 Days / 7 Nights',
    durationDays: 8,
    durationNights: 7,
    hotel: 'Boutique & Heritage Hotels',
    hotelRating: 4,
    food: ['Sri Lankan rice & curry', 'Hoppers (egg hoppers)', 'Kottu roti', 'Seafood on the beach', 'Ceylon tea'],
    transport: ['Return flights', 'Private car throughout', 'Scenic train (Kandy–Ella)'],
    activities: ['Sigiriya Rock Fortress', 'Temple of the Tooth Kandy', 'Whale watching Mirissa', 'Nine Arch Bridge Ella', 'Tea plantation walk', 'Yala leopard safari'],
    inclusions: ['Return flights', 'All hotels', 'Private car', 'Scenic train tickets', 'Daily breakfast', 'Guide', 'Entry fees'],
    exclusions: ['Lunch & dinner', 'Travel insurance', 'Personal expenses'],
    bestSeason: 'Dec – Mar (west/south) · Jun – Sep (east)',
    groupSize: '2–14 people',
    tripType: 'Adventure',
    guide: {
      name: 'Chamara Perera',
      contact: '+94-77-123-4567',
      languages: ['Sinhala', 'Tamil', 'English'],
      rating: 4.8,
      experience: '9 years',
      speciality: 'Sri Lankan Wildlife & Buddhist Heritage',
      photo: '/guides/chamara-perera.jpg',
      bio: 'Chamara has guided from Jaffna to Galle and knows Sri Lanka\'s extraordinary diversity of wildlife, culture, and coastline.'
    },
    hospitality: 'Traditional Sri Lankan welcome with spiced tea & sweetmeats, moonlit beach dinner',
    documents: ['Passport (6 months validity)', 'Sri Lanka ETA (online)'],
    reviews: [
      { user: 'Rohan M.', rating: 5, comment: 'Sigiriya at sunrise was absolutely worth the climb. And the whale watching — 3 blue whales!', date: '2024-12-18' },
      { user: 'Lisa K.', rating: 5, comment: 'The Kandy to Ella train is the most beautiful train journey I\'ve ever taken.', date: '2024-11-25' }
    ],
    images: ['/packages/sri-lanka1.jpg', '/packages/sri-lanka2.jpg'],
    heroImage: '/packages/sri-lanka1.jpg',
    description: 'Sri Lanka packs extraordinary diversity into a small island — ancient rock fortresses, misty tea highlands, leopard-prowled jungles, whale-watching seas, and beaches where the Indian Ocean glows at dusk. And it\'s all within a single spectacular week.',
    highlights: [
      'Sigiriya Rock — a 5th century fortress palace in the clouds',
      'Blue whale watching off Mirissa coast',
      'World\'s most scenic train journey: Kandy to Ella',
      'Yala National Park — world\'s highest leopard density'
    ],
    tags: ['Sri Lanka', 'Wildlife', 'Nature', 'Heritage', 'Beach', 'UNESCO'],
    countryFaqs: [{ country: 'Sri Lanka', faqs: countryFaqs['Sri Lanka'] }],
  },

  {
    id: 'abroad-bhutan-001',
    name: 'Bhutan: Kingdom of Happiness',
    region: 'Abroad',
    subRegion: 'Bhutan',
    countries: ['Bhutan'],
    cities: ['Thimphu', 'Paro', 'Punakha', 'Bumthang'],
    price: 64999,
    originalPrice: 79999,
    duration: '7 Days / 6 Nights',
    durationDays: 7,
    durationNights: 6,
    hotel: 'Traditional Bhutanese Hotels & Farmhouse Stay',
    hotelRating: 4,
    food: ['Ema datshi (chilli cheese)', 'Red rice', 'Phaksha paa (pork with chillis)', 'Butter tea', 'Bhutanese suja'],
    transport: ['Return flights (via Paro — one of the world\'s most dramatic landings)', 'Private car'],
    activities: ['Tiger\'s Nest Monastery trek', 'Punakha Dzong', 'Archery demonstration', 'Traditional weaving workshop', 'Rinpung Dzong Paro', 'Punakha suspension bridge'],
    inclusions: ['Return flights', 'All accommodation', 'Daily all-meals', 'SDF permit', 'Guide', 'All entry fees', 'Traditional dinner'],
    exclusions: ['Personal expenses', 'Travel insurance', 'Alcohol'],
    bestSeason: 'Mar – May (spring) · Sep – Nov (autumn & dzong festivals)',
    groupSize: '2–10 people',
    tripType: 'Spiritual',
    guide: {
      name: 'Dorji Wangchuk',
      contact: '+975-17-123-456',
      languages: ['Dzongkha', 'English', 'Hindi'],
      rating: 4.9,
      experience: '15 years',
      speciality: 'Bhutanese Buddhist Culture & Himalayan Trekking',
      photo: '/guides/dorji-wangchuk.jpg',
      bio: 'A licensed Bhutanese national guide since 2009, Dorji is deeply rooted in his country\'s Buddhist philosophy and shares it with rare authenticity.'
    },
    hospitality: 'Welcome butter tea & khata (ceremonial scarf), traditional farmhouse dinner with local family',
    documents: ['Passport (6 months validity)', 'Bhutan Permit (arranged — Indians do not need a visa)'],
    reviews: [
      { user: 'Priya V.', rating: 5, comment: 'Bhutan healed something in me. Tiger\'s Nest at sunrise changed my relationship with the world.', date: '2024-11-10' },
      { user: 'Mark S.', rating: 5, comment: 'The most peaceful, pure travel experience I have ever had. Dorji is a gem.', date: '2024-10-05' }
    ],
    images: ['/packages/bhutan1.jpg', '/packages/bhutan2.jpg'],
    heroImage: '/packages/bhutan1.jpg',
    description: 'Bhutan measures national success not in GDP but in Gross National Happiness — and you feel it the moment you land. Carbon-negative, plastic-free, and deeply Buddhist, Bhutan is the world\'s last great Himalayan kingdom, deliberately preserved for future generations.',
    highlights: [
      'Tiger\'s Nest Monastery — perched 900m above the valley on a cliff face',
      'Punakha Dzong — the most beautiful building in the Himalayas',
      'Traditional farmhouse dinner with a Bhutanese family',
      'Bhutan is the only carbon-negative country on earth'
    ],
    tags: ['Bhutan', 'Spiritual', 'Himalaya', 'Buddhist', 'Nature', 'UNESCO'],
    countryFaqs: [{ country: 'Bhutan', faqs: countryFaqs.Bhutan }],
  },

  {
    id: 'abroad-vietnam-001',
    name: 'Vietnam: North to South',
    region: 'Abroad',
    subRegion: 'Vietnam',
    countries: ['Vietnam'],
    cities: ['Hanoi', 'Ha Long Bay', 'Hoi An', 'Ho Chi Minh City'],
    price: 79999,
    originalPrice: 99999,
    duration: '9 Days / 8 Nights',
    durationDays: 9,
    durationNights: 8,
    hotel: '4-Star Hotels & Ha Long Bay Cruise',
    hotelRating: 4,
    food: ['Pho', 'Banh mi', 'Cao Lau (Hoi An)', 'Fresh spring rolls', 'Vietnamese iced coffee'],
    transport: ['Return flights', 'Domestic flight (Hanoi–Danang–HCM)', 'Ha Long Bay cruise'],
    activities: ['Ha Long Bay overnight cruise', 'Hoi An Ancient Town lantern festival', 'Cu Chi Tunnels', 'Hoan Kiem Lake Hanoi', 'Mekong Delta boat trip', 'Vietnamese cooking class'],
    inclusions: ['Return flights', 'All hotels', 'Ha Long Bay 2-night cruise', 'Domestic flights', 'Daily breakfast', 'Guide', 'Cooking class'],
    exclusions: ['Visa (e-Visa, we assist)', 'Lunch & dinner (except cruise)', 'Travel insurance'],
    bestSeason: 'Feb – Apr (whole country)',
    groupSize: '2–16 people',
    tripType: 'Cultural',
    guide: {
      name: 'Nguyen Thi Lan',
      contact: '+84-90-123-4567',
      languages: ['Vietnamese', 'English', 'French'],
      rating: 4.8,
      experience: '8 years',
      speciality: 'Vietnamese History, Cuisine & Waterways',
      photo: '/guides/nguyen-thi-lan.jpg',
      bio: 'Hanoi-born Lan is equally at home in a silk-roofed ancient pagoda and a smoking street food kitchen.'
    },
    hospitality: 'Welcome with Vietnamese iced coffee & banh mi, farewell lantern release ceremony in Hoi An',
    documents: ['Passport (6 months validity)', 'Vietnam e-Visa'],
    reviews: [
      { user: 'Sunita P.', rating: 5, comment: 'Ha Long Bay is the most beautiful place I have ever seen. The overnight cruise was perfect.', date: '2024-12-02' },
      { user: 'Felix M.', rating: 5, comment: 'Hoi An at night with the lanterns is pure magic. Lan was an exceptional guide.', date: '2024-11-12' }
    ],
    images: ['/packages/vietnam1.jpg', '/packages/vietnam2.jpg'],
    heroImage: '/packages/vietnam1.jpg',
    description: 'Vietnam is one of the world\'s great travel destinations — a country of surreal natural beauty, ancient towns perfectly preserved, extraordinary cuisine born from three culinary traditions, and a spirit of resilience that is completely infectious.',
    highlights: [
      'Ha Long Bay 2-night cruise among 1,600 limestone islands',
      'Hoi An Ancient Town — UNESCO heritage & lantern festival',
      'Cooking class with a Vietnamese grandmother',
      'Cu Chi Tunnels — understanding Vietnam\'s extraordinary history'
    ],
    tags: ['Vietnam', 'Nature', 'UNESCO', 'Food', 'History', 'Cruise'],
    countryFaqs: [{ country: 'Vietnam', faqs: countryFaqs.Vietnam }],
  },

  {
    id: 'abroad-usa-001',
    name: 'USA Adventure',
    region: 'Abroad',
    subRegion: 'USA',
    cities: ['New York', 'Los Angeles', 'San Francisco', 'Las Vegas', 'Orlando'],
    price: 179999,
    originalPrice: 219999,
    duration: '10 Days / 9 Nights',
    durationDays: 10,
    durationNights: 9,
    hotel: 'Premium US Hotels',
    hotelRating: 4,
    food: ['American BBQ', 'New York pizza & bagels', 'In-N-Out Burger', 'Seafood at Fisherman\'s Wharf', 'BBQ dinner night'],
    transport: ['Return flights', 'Domestic flights', 'Coach'],
    activities: ['Statue of Liberty', 'Disneyland full day', 'Hollywood & Beverly Hills tour', 'Grand Canyon guided rim tour', 'Las Vegas Strip night walk', 'Golden Gate Bridge walk'],
    inclusions: ['Return flights', 'All hotels', 'Breakfast', 'Guided tours', 'Entry passes (Disneyland, Grand Canyon, Statue of Liberty)'],
    exclusions: ['Lunch & dinner (except specified)', 'Personal shopping', 'Travel insurance'],
    bestSeason: 'Mar – Nov',
    groupSize: '4–20 people',
    tripType: 'Family',
    guide: {
      name: 'Mike Johnson',
      contact: '+1-555-123456',
      languages: ['English'],
      rating: 4.7,
      experience: '7 years',
      speciality: 'American Icons & Theme Parks',
      photo: '/guides/mike-johnson.jpg',
      bio: 'A California native, Mike knows every shortcut to the best experiences across the USA.'
    },
    hospitality: 'Friendly US hospitality, welcome BBQ dinner on arrival night',
    documents: ['Passport (6 months validity)', 'US B1/B2 Visa'],
    reviews: [
      { user: 'Emily R.', rating: 5, comment: 'Disneyland was magical!', date: '2024-12-01' },
      { user: 'Raj P.', rating: 4, comment: 'Loved the national parks.', date: '2024-11-18' }
    ],
    images: ['/packages/usa1.jpg', '/packages/usa2.jpg'],
    heroImage: '/packages/usa1.jpg',
    description: 'Experience the highlights of America — iconic cities, theme parks, natural wonders, and non-stop energy. From the Manhattan skyline to the Grand Canyon rim, this trip covers it all.',
    highlights: [
      'Disneyland full-day pass included',
      'Grand Canyon guided rim tour',
      'Hollywood & Beverly Hills insider walk',
      'New York City skyline from the Top of the Rock'
    ],
    tags: ['USA', 'Family', 'Theme Parks', 'Cities', 'Iconic'],
  },
];