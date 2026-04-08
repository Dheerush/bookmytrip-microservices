export interface TrainFare {
  general: number;
  sleeper: number;
  ac3Tier: number;
  ac2Tier: number;
  ac1st: number;
}

export interface TrainSeatAvailability {
  general: number;
  sleeper: number;
  ac3Tier: number;
  ac2Tier: number;
  ac1st: number;
}

export interface FareCategory {
  adult: number;
  child: number;      // 5-11 years — 50% of adult
  seniorCitizen: number; // 40% discount
  military: number;      // 25% discount
}

export interface Train {
  id: string;
  trainNumber: string;
  name: string;
  from: string;
  fromCode: string;
  fromStationName?: string;
  fromStationCode?: string;
  to: string;
  toCode: string;
  toStationName?: string;
  toStationCode?: string;
  platformNumber?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  daysOfWeek: string[];
  pnr: string;
  fare: TrainFare;
  fareCategories: {
    sleeper: FareCategory;
    ac3Tier: FareCategory;
    ac2Tier: FareCategory;
    ac1st: FareCategory;
  };
  seatsAvailable: TrainSeatAvailability;
  type: "Superfast" | "Express" | "Rajdhani" | "Shatabdi" | "Duronto" | "Garib Rath" | "Mail";
  stops: number;
  rating: number;
}

function makeFareCategories(base: TrainFare) {
  const cat = (price: number): FareCategory => ({
    adult: price,
    child: Math.round(price * 0.5),
    seniorCitizen: Math.round(price * 0.6),
    military: Math.round(price * 0.75),
  });
  return {
    sleeper: cat(base.sleeper),
    ac3Tier: cat(base.ac3Tier),
    ac2Tier: cat(base.ac2Tier),
    ac1st: cat(base.ac1st),
  };
}

const rawTrains: Omit<Train, "fareCategories">[] = [
  { id: "tr-001", trainNumber: "12951", name: "Mumbai Rajdhani Express", from: "New Delhi", fromCode: "NDLS", to: "Mumbai Central", toCode: "BCT", departureTime: "16:55", arrivalTime: "08:35", duration: "15h 40m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR284719", fare: { general: 450, sleeper: 780, ac3Tier: 1890, ac2Tier: 2780, ac1st: 4720 }, seatsAvailable: { general: 120, sleeper: 45, ac3Tier: 32, ac2Tier: 18, ac1st: 6 }, type: "Rajdhani", stops: 5, rating: 4.6 },
  { id: "tr-002", trainNumber: "12301", name: "Howrah Rajdhani Express", from: "New Delhi", fromCode: "NDLS", to: "Howrah Jn", toCode: "HWH", departureTime: "16:50", arrivalTime: "09:55", duration: "17h 05m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR381045", fare: { general: 520, sleeper: 890, ac3Tier: 2100, ac2Tier: 3100, ac1st: 5200 }, seatsAvailable: { general: 90, sleeper: 30, ac3Tier: 22, ac2Tier: 14, ac1st: 4 }, type: "Rajdhani", stops: 4, rating: 4.7 },
  { id: "tr-003", trainNumber: "12002", name: "New Delhi Shatabdi Express", from: "New Delhi", fromCode: "NDLS", to: "Bhopal Jn", toCode: "BPL", departureTime: "06:15", arrivalTime: "14:10", duration: "7h 55m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"], pnr: "PNR492830", fare: { general: 350, sleeper: 650, ac3Tier: 1350, ac2Tier: 1900, ac1st: 3200 }, seatsAvailable: { general: 200, sleeper: 60, ac3Tier: 40, ac2Tier: 26, ac1st: 8 }, type: "Shatabdi", stops: 3, rating: 4.5 },
  { id: "tr-004", trainNumber: "12259", name: "Sealdah Duronto Express", from: "New Delhi", fromCode: "NDLS", to: "Sealdah", toCode: "SDAH", departureTime: "20:10", arrivalTime: "11:30", duration: "15h 20m", daysOfWeek: ["Mon","Thu","Sat"], pnr: "PNR571924", fare: { general: 480, sleeper: 820, ac3Tier: 1950, ac2Tier: 2900, ac1st: 4900 }, seatsAvailable: { general: 80, sleeper: 28, ac3Tier: 18, ac2Tier: 10, ac1st: 4 }, type: "Duronto", stops: 0, rating: 4.4 },
  { id: "tr-005", trainNumber: "12627", name: "Karnataka Express", from: "New Delhi", fromCode: "NDLS", to: "Bengaluru", toCode: "SBC", departureTime: "21:20", arrivalTime: "06:40", duration: "33h 20m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR693815", fare: { general: 620, sleeper: 950, ac3Tier: 2350, ac2Tier: 3400, ac1st: 5800 }, seatsAvailable: { general: 150, sleeper: 55, ac3Tier: 38, ac2Tier: 20, ac1st: 6 }, type: "Superfast", stops: 12, rating: 4.3 },
  { id: "tr-006", trainNumber: "12431", name: "Thiruvananthapuram Rajdhani", from: "New Delhi", fromCode: "NDLS", to: "Trivandrum Central", toCode: "TVC", departureTime: "11:25", arrivalTime: "05:15", duration: "41h 50m", daysOfWeek: ["Wed","Sun"], pnr: "PNR719283", fare: { general: 720, sleeper: 1100, ac3Tier: 2700, ac2Tier: 3900, ac1st: 6500 }, seatsAvailable: { general: 60, sleeper: 22, ac3Tier: 15, ac2Tier: 8, ac1st: 3 }, type: "Rajdhani", stops: 8, rating: 4.5 },
  { id: "tr-007", trainNumber: "12903", name: "Golden Temple Mail", from: "Mumbai Central", fromCode: "BCT", to: "Amritsar Jn", toCode: "ASR", departureTime: "21:30", arrivalTime: "05:05", duration: "31h 35m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR834517", fare: { general: 550, sleeper: 850, ac3Tier: 2050, ac2Tier: 3000, ac1st: 5100 }, seatsAvailable: { general: 110, sleeper: 40, ac3Tier: 28, ac2Tier: 16, ac1st: 5 }, type: "Mail", stops: 18, rating: 4.1 },
  { id: "tr-008", trainNumber: "12839", name: "Chennai Mail", from: "Howrah Jn", fromCode: "HWH", to: "Chennai Central", toCode: "MAS", departureTime: "23:50", arrivalTime: "03:50", duration: "28h 00m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR928471", fare: { general: 510, sleeper: 800, ac3Tier: 1950, ac2Tier: 2850, ac1st: 4800 }, seatsAvailable: { general: 130, sleeper: 50, ac3Tier: 35, ac2Tier: 20, ac1st: 7 }, type: "Mail", stops: 14, rating: 4.2 },
  { id: "tr-009", trainNumber: "12625", name: "Kerala Express", from: "New Delhi", fromCode: "NDLS", to: "Trivandrum Central", toCode: "TVC", departureTime: "11:25", arrivalTime: "19:00", duration: "55h 35m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR104729", fare: { general: 750, sleeper: 1150, ac3Tier: 2800, ac2Tier: 4100, ac1st: 6800 }, seatsAvailable: { general: 70, sleeper: 25, ac3Tier: 14, ac2Tier: 8, ac1st: 2 }, type: "Express", stops: 22, rating: 4.0 },
  { id: "tr-010", trainNumber: "12309", name: "Rajdhani Express (Patna)", from: "New Delhi", fromCode: "NDLS", to: "Rajendra Nagar", toCode: "RJPB", departureTime: "17:00", arrivalTime: "07:30", duration: "14h 30m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR218374", fare: { general: 420, sleeper: 750, ac3Tier: 1750, ac2Tier: 2600, ac1st: 4400 }, seatsAvailable: { general: 95, sleeper: 35, ac3Tier: 25, ac2Tier: 15, ac1st: 5 }, type: "Rajdhani", stops: 3, rating: 4.5 },
  { id: "tr-011", trainNumber: "12621", name: "Tamil Nadu Express", from: "New Delhi", fromCode: "NDLS", to: "Chennai Central", toCode: "MAS", departureTime: "22:30", arrivalTime: "07:10", duration: "32h 40m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR342198", fare: { general: 590, sleeper: 920, ac3Tier: 2200, ac2Tier: 3200, ac1st: 5400 }, seatsAvailable: { general: 140, sleeper: 48, ac3Tier: 33, ac2Tier: 18, ac1st: 5 }, type: "Superfast", stops: 10, rating: 4.4 },
  { id: "tr-012", trainNumber: "12723", name: "Telangana Express", from: "New Delhi", fromCode: "NDLS", to: "Hyderabad Deccan", toCode: "HYB", departureTime: "06:50", arrivalTime: "05:45", duration: "22h 55m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR457281", fare: { general: 500, sleeper: 790, ac3Tier: 1900, ac2Tier: 2800, ac1st: 4700 }, seatsAvailable: { general: 115, sleeper: 42, ac3Tier: 30, ac2Tier: 16, ac1st: 5 }, type: "Superfast", stops: 9, rating: 4.3 },
  { id: "tr-013", trainNumber: "12285", name: "Secunderabad Duronto", from: "Hazrat Nizamuddin", fromCode: "NZM", to: "Secunderabad Jn", toCode: "SC", departureTime: "20:55", arrivalTime: "10:20", duration: "13h 25m", daysOfWeek: ["Tue","Fri"], pnr: "PNR563847", fare: { general: 460, sleeper: 800, ac3Tier: 1880, ac2Tier: 2750, ac1st: 4650 }, seatsAvailable: { general: 75, sleeper: 22, ac3Tier: 15, ac2Tier: 9, ac1st: 3 }, type: "Duronto", stops: 0, rating: 4.6 },
  { id: "tr-014", trainNumber: "12213", name: "Yesvantpur Duronto", from: "New Delhi", fromCode: "NDLS", to: "Yesvantpur Jn", toCode: "YPR", departureTime: "20:35", arrivalTime: "06:20", duration: "33h 45m", daysOfWeek: ["Mon","Thu"], pnr: "PNR678194", fare: { general: 630, sleeper: 960, ac3Tier: 2380, ac2Tier: 3450, ac1st: 5850 }, seatsAvailable: { general: 65, sleeper: 20, ac3Tier: 12, ac2Tier: 7, ac1st: 3 }, type: "Duronto", stops: 0, rating: 4.5 },
  { id: "tr-015", trainNumber: "12152", name: "Samarsata Express", from: "Mumbai LTT", fromCode: "LTT", to: "Gorakhpur Jn", toCode: "GKP", departureTime: "05:25", arrivalTime: "11:15", duration: "29h 50m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR789215", fare: { general: 530, sleeper: 830, ac3Tier: 2000, ac2Tier: 2920, ac1st: 4950 }, seatsAvailable: { general: 100, sleeper: 38, ac3Tier: 24, ac2Tier: 14, ac1st: 4 }, type: "Express", stops: 15, rating: 4.0 },
  { id: "tr-016", trainNumber: "12017", name: "Dehradun Shatabdi", from: "New Delhi", fromCode: "NDLS", to: "Dehradun", toCode: "DDN", departureTime: "06:45", arrivalTime: "12:40", duration: "5h 55m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR894327", fare: { general: 280, sleeper: 550, ac3Tier: 1180, ac2Tier: 1650, ac1st: 2700 }, seatsAvailable: { general: 220, sleeper: 72, ac3Tier: 48, ac2Tier: 30, ac1st: 10 }, type: "Shatabdi", stops: 2, rating: 4.6 },
  { id: "tr-017", trainNumber: "12953", name: "August Kranti Rajdhani", from: "Mumbai Central", fromCode: "BCT", to: "Hazrat Nizamuddin", toCode: "NZM", departureTime: "17:40", arrivalTime: "10:55", duration: "17h 15m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR915438", fare: { general: 470, sleeper: 810, ac3Tier: 1920, ac2Tier: 2830, ac1st: 4780 }, seatsAvailable: { general: 85, sleeper: 32, ac3Tier: 20, ac2Tier: 12, ac1st: 4 }, type: "Rajdhani", stops: 4, rating: 4.7 },
  { id: "tr-018", trainNumber: "12429", name: "Lucknow Rajdhani", from: "New Delhi", fromCode: "NDLS", to: "Lucknow NR", toCode: "LKO", departureTime: "22:20", arrivalTime: "05:30", duration: "7h 10m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR026541", fare: { general: 320, sleeper: 600, ac3Tier: 1400, ac2Tier: 2050, ac1st: 3450 }, seatsAvailable: { general: 180, sleeper: 60, ac3Tier: 42, ac2Tier: 28, ac1st: 8 }, type: "Rajdhani", stops: 1, rating: 4.6 },
  { id: "tr-019", trainNumber: "12560", name: "Shiv Ganga Express", from: "New Delhi", fromCode: "NDLS", to: "Varanasi Jn", toCode: "BSB", departureTime: "18:50", arrivalTime: "06:50", duration: "12h 00m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR137652", fare: { general: 370, sleeper: 680, ac3Tier: 1550, ac2Tier: 2250, ac1st: 3800 }, seatsAvailable: { general: 160, sleeper: 55, ac3Tier: 36, ac2Tier: 22, ac1st: 7 }, type: "Superfast", stops: 6, rating: 4.3 },
  { id: "tr-020", trainNumber: "12802", name: "Purushottam Express", from: "New Delhi", fromCode: "NDLS", to: "Puri", toCode: "PURI", departureTime: "22:35", arrivalTime: "05:10", duration: "30h 35m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR248763", fare: { general: 560, sleeper: 870, ac3Tier: 2100, ac2Tier: 3050, ac1st: 5150 }, seatsAvailable: { general: 120, sleeper: 44, ac3Tier: 30, ac2Tier: 17, ac1st: 5 }, type: "Superfast", stops: 11, rating: 4.2 },
  { id: "tr-021", trainNumber: "16501", name: "Yesvantpur Express", from: "Mumbai CST", fromCode: "CSTM", to: "Yesvantpur Jn", toCode: "YPR", departureTime: "13:45", arrivalTime: "12:55", duration: "23h 10m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR359874", fare: { general: 440, sleeper: 720, ac3Tier: 1700, ac2Tier: 2500, ac1st: 4200 }, seatsAvailable: { general: 105, sleeper: 40, ac3Tier: 28, ac2Tier: 15, ac1st: 5 }, type: "Express", stops: 10, rating: 4.1 },
  { id: "tr-022", trainNumber: "12611", name: "Chennai - Mysore Shatabdi", from: "Chennai Central", fromCode: "MAS", to: "Mysuru Jn", toCode: "MYS", departureTime: "06:00", arrivalTime: "13:00", duration: "7h 00m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"], pnr: "PNR461985", fare: { general: 300, sleeper: 580, ac3Tier: 1250, ac2Tier: 1750, ac1st: 2900 }, seatsAvailable: { general: 190, sleeper: 65, ac3Tier: 44, ac2Tier: 28, ac1st: 9 }, type: "Shatabdi", stops: 4, rating: 4.4 },
  { id: "tr-023", trainNumber: "12649", name: "Karnataka Sampark Kranti", from: "Hazrat Nizamuddin", fromCode: "NZM", to: "Yesvantpur Jn", toCode: "YPR", departureTime: "20:50", arrivalTime: "22:05", duration: "25h 15m", daysOfWeek: ["Mon","Wed","Sat"], pnr: "PNR572396", fare: { general: 520, sleeper: 810, ac3Tier: 1960, ac2Tier: 2880, ac1st: 4870 }, seatsAvailable: { general: 88, sleeper: 30, ac3Tier: 20, ac2Tier: 11, ac1st: 4 }, type: "Superfast", stops: 7, rating: 4.3 },
  { id: "tr-024", trainNumber: "12245", name: "Howrah Duronto Express", from: "Howrah Jn", fromCode: "HWH", to: "New Delhi", toCode: "NDLS", departureTime: "19:45", arrivalTime: "09:55", duration: "14h 10m", daysOfWeek: ["Tue","Fri","Sun"], pnr: "PNR683407", fare: { general: 490, sleeper: 850, ac3Tier: 2050, ac2Tier: 3000, ac1st: 5100 }, seatsAvailable: { general: 72, sleeper: 24, ac3Tier: 16, ac2Tier: 9, ac1st: 3 }, type: "Duronto", stops: 0, rating: 4.5 },
  { id: "tr-025", trainNumber: "12010", name: "Lucknow Shatabdi", from: "New Delhi", fromCode: "NDLS", to: "Lucknow NR", toCode: "LKO", departureTime: "06:10", arrivalTime: "12:40", duration: "6h 30m", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], pnr: "PNR794518", fare: { general: 310, sleeper: 590, ac3Tier: 1280, ac2Tier: 1780, ac1st: 2950 }, seatsAvailable: { general: 210, sleeper: 70, ac3Tier: 46, ac2Tier: 30, ac1st: 10 }, type: "Shatabdi", stops: 2, rating: 4.6 },
];

export const trains: Train[] = rawTrains.map((t) => ({
  ...t,
  fareCategories: makeFareCategories(t.fare),
}));
