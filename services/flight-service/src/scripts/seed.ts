/**
 * Seed script — populates the flights collection from the frontend mock data.
 * Run with: pnpm seed
 * Skips if flights already exist in the DB.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { Flight } from '../models/Flight';
import logger from '../utils/logger';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface FareCategory {
  adult: number; child: number; infant: number; seniorCitizen: number; military: number;
}

function makeFareCategory(base: number): FareCategory {
  return {
    adult: base,
    child: Math.round(base * 0.5),
    infant: Math.round(base * 0.1),
    seniorCitizen: Math.round(base * 0.85),
    military: Math.round(base * 0.75),
  };
}

// ── Seed data (source: apps/web/src/data/flights.ts) ─────────────────────────

const raw = [
  { flightCode: 'BT-201', airline: 'SkyWing Airlines',  from: 'New Delhi', fromCode: 'DEL', to: 'Mumbai',     toCode: 'BOM', departureTime: '06:30', arrivalTime: '08:40', duration: '2h 10m',  stops: 0, stopCities: [],             originalPrice: 7499, discountedPrice: 5299, fare: { economy: 5299,  premiumEconomy: 8499,  business: 16999 }, seatsLeft: 14, aircraft: 'Boeing 737-800',    baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.5 },
  { flightCode: 'BT-315', airline: 'AeroIndia',          from: 'New Delhi', fromCode: 'DEL', to: 'Bengaluru',  toCode: 'BLR', departureTime: '07:15', arrivalTime: '09:55', duration: '2h 40m',  stops: 0, stopCities: [],             originalPrice: 8999, discountedPrice: 6499, fare: { economy: 6499,  premiumEconomy: 10499, business: 21999 }, seatsLeft: 8,  aircraft: 'Airbus A320neo',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.6 },
  { flightCode: 'BT-427', airline: 'JetStream',          from: 'Mumbai',    fromCode: 'BOM', to: 'Kolkata',    toCode: 'CCU', departureTime: '09:00', arrivalTime: '11:35', duration: '2h 35m',  stops: 0, stopCities: [],             originalPrice: 7299, discountedPrice: 5199, fare: { economy: 5199,  premiumEconomy: 8299,  business: 16499 }, seatsLeft: 22, aircraft: 'Boeing 737 MAX',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: false, rating: 4.3 },
  { flightCode: 'BT-512', airline: 'ClearSky Air',       from: 'Bengaluru', fromCode: 'BLR', to: 'New Delhi',  toCode: 'DEL', departureTime: '10:20', arrivalTime: '13:00', duration: '2h 40m',  stops: 0, stopCities: [],             originalPrice: 8499, discountedPrice: 6199, fare: { economy: 6199,  premiumEconomy: 9999,  business: 20499 }, seatsLeft: 11, aircraft: 'Airbus A321',      baggage: { cabin: '7 kg', checkin: '20 kg' }, meals: true,  refundable: true,  rating: 4.7 },
  { flightCode: 'BT-678', airline: 'SkyWing Airlines',  from: 'Chennai',   fromCode: 'MAA', to: 'Hyderabad',  toCode: 'HYD', departureTime: '11:45', arrivalTime: '12:55', duration: '1h 10m',  stops: 0, stopCities: [],             originalPrice: 4999, discountedPrice: 3499, fare: { economy: 3499,  premiumEconomy: 5999,  business: 11999 }, seatsLeft: 30, aircraft: 'ATR 72-600',       baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: false, rating: 4.2 },
  { flightCode: 'BT-789', airline: 'AeroIndia',          from: 'New Delhi', fromCode: 'DEL', to: 'Goa',        toCode: 'GOI', departureTime: '08:30', arrivalTime: '11:10', duration: '2h 40m',  stops: 0, stopCities: [],             originalPrice: 9499, discountedPrice: 6999, fare: { economy: 6999,  premiumEconomy: 11499, business: 22999 }, seatsLeft: 6,  aircraft: 'Airbus A320neo',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.6 },
  { flightCode: 'BT-134', airline: 'JetStream',          from: 'Hyderabad', fromCode: 'HYD', to: 'Mumbai',     toCode: 'BOM', departureTime: '13:05', arrivalTime: '14:30', duration: '1h 25m',  stops: 0, stopCities: [],             originalPrice: 5499, discountedPrice: 3999, fare: { economy: 3999,  premiumEconomy: 6599,  business: 13299 }, seatsLeft: 18, aircraft: 'Boeing 737-800',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: false, rating: 4.4 },
  { flightCode: 'BT-246', airline: 'BlueBird Airways',   from: 'Kolkata',   fromCode: 'CCU', to: 'New Delhi',  toCode: 'DEL', departureTime: '14:20', arrivalTime: '16:55', duration: '2h 35m',  stops: 0, stopCities: [],             originalPrice: 7799, discountedPrice: 5599, fare: { economy: 5599,  premiumEconomy: 8999,  business: 17999 }, seatsLeft: 12, aircraft: 'Airbus A320',      baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.5 },
  { flightCode: 'BT-358', airline: 'ClearSky Air',       from: 'New Delhi', fromCode: 'DEL', to: 'Jaipur',     toCode: 'JAI', departureTime: '06:00', arrivalTime: '07:10', duration: '1h 10m',  stops: 0, stopCities: [],             originalPrice: 4299, discountedPrice: 2999, fare: { economy: 2999,  premiumEconomy: 4999,  business:  9999 }, seatsLeft: 35, aircraft: 'ATR 72-600',       baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: false, rating: 4.1 },
  { flightCode: 'BT-469', airline: 'SkyWing Airlines',  from: 'Mumbai',    fromCode: 'BOM', to: 'Bengaluru',  toCode: 'BLR', departureTime: '15:30', arrivalTime: '17:10', duration: '1h 40m',  stops: 0, stopCities: [],             originalPrice: 6499, discountedPrice: 4699, fare: { economy: 4699,  premiumEconomy: 7499,  business: 14999 }, seatsLeft: 20, aircraft: 'Boeing 737 MAX',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.5 },
  { flightCode: 'BT-571', airline: 'AeroIndia',          from: 'New Delhi', fromCode: 'DEL', to: 'Chennai',    toCode: 'MAA', departureTime: '16:45', arrivalTime: '19:30', duration: '2h 45m',  stops: 0, stopCities: [],             originalPrice: 8799, discountedPrice: 6299, fare: { economy: 6299,  premiumEconomy: 10199, business: 20999 }, seatsLeft: 9,  aircraft: 'Airbus A321neo',   baggage: { cabin: '7 kg', checkin: '20 kg' }, meals: true,  refundable: true,  rating: 4.6 },
  { flightCode: 'BT-682', airline: 'BlueBird Airways',   from: 'Pune',      fromCode: 'PNQ', to: 'New Delhi',  toCode: 'DEL', departureTime: '07:30', arrivalTime: '09:40', duration: '2h 10m',  stops: 0, stopCities: [],             originalPrice: 7199, discountedPrice: 5099, fare: { economy: 5099,  premiumEconomy: 8199,  business: 16499 }, seatsLeft: 16, aircraft: 'Airbus A320neo',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: true,  rating: 4.4 },
  { flightCode: 'BT-793', airline: 'JetStream',          from: 'New Delhi', fromCode: 'DEL', to: 'Kolkata',    toCode: 'CCU', departureTime: '18:10', arrivalTime: '20:30', duration: '2h 20m',  stops: 0, stopCities: [],             originalPrice: 6999, discountedPrice: 4999, fare: { economy: 4999,  premiumEconomy: 7999,  business: 15999 }, seatsLeft: 25, aircraft: 'Boeing 737-800',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: false, rating: 4.3 },
  { flightCode: 'BT-904', airline: 'ClearSky Air',       from: 'Goa',       fromCode: 'GOI', to: 'Mumbai',     toCode: 'BOM', departureTime: '19:20', arrivalTime: '20:35', duration: '1h 15m',  stops: 0, stopCities: [],             originalPrice: 5299, discountedPrice: 3799, fare: { economy: 3799,  premiumEconomy: 6199,  business: 12499 }, seatsLeft: 28, aircraft: 'ATR 72-600',       baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: false, rating: 4.2 },
  { flightCode: 'BT-115', airline: 'SkyWing Airlines',  from: 'New Delhi', fromCode: 'DEL', to: 'Ahmedabad',  toCode: 'AMD', departureTime: '05:45', arrivalTime: '07:30', duration: '1h 45m',  stops: 0, stopCities: [],             originalPrice: 5799, discountedPrice: 4199, fare: { economy: 4199,  premiumEconomy: 6799,  business: 13599 }, seatsLeft: 19, aircraft: 'Boeing 737-800',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.4 },
  { flightCode: 'BT-226', airline: 'AeroIndia',          from: 'Bengaluru', fromCode: 'BLR', to: 'Hyderabad',  toCode: 'HYD', departureTime: '12:00', arrivalTime: '13:15', duration: '1h 15m',  stops: 0, stopCities: [],             originalPrice: 4799, discountedPrice: 3399, fare: { economy: 3399,  premiumEconomy: 5599,  business: 11199 }, seatsLeft: 32, aircraft: 'Airbus A320neo',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: false, rating: 4.5 },
  { flightCode: 'BT-337', airline: 'BlueBird Airways',   from: 'Chennai',   fromCode: 'MAA', to: 'Kolkata',    toCode: 'CCU', departureTime: '08:15', arrivalTime: '10:30', duration: '2h 15m',  stops: 0, stopCities: [],             originalPrice: 6799, discountedPrice: 4899, fare: { economy: 4899,  premiumEconomy: 7899,  business: 15799 }, seatsLeft: 15, aircraft: 'Boeing 737 MAX',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.4 },
  { flightCode: 'BT-448', airline: 'JetStream',          from: 'Mumbai',    fromCode: 'BOM', to: 'Goa',        toCode: 'GOI', departureTime: '20:30', arrivalTime: '21:45', duration: '1h 15m',  stops: 0, stopCities: [],             originalPrice: 5999, discountedPrice: 4299, fare: { economy: 4299,  premiumEconomy: 6999,  business: 13999 }, seatsLeft: 10, aircraft: 'Airbus A320',      baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: false, rating: 4.3 },
  { flightCode: 'BT-559', airline: 'ClearSky Air',       from: 'New Delhi', fromCode: 'DEL', to: 'Lucknow',    toCode: 'LKO', departureTime: '09:45', arrivalTime: '10:55', duration: '1h 10m',  stops: 0, stopCities: [],             originalPrice: 4599, discountedPrice: 3299, fare: { economy: 3299,  premiumEconomy: 5399,  business: 10799 }, seatsLeft: 38, aircraft: 'ATR 72-600',       baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: false, rating: 4.1 },
  { flightCode: 'BT-660', airline: 'SkyWing Airlines',  from: 'Mumbai',    fromCode: 'BOM', to: 'New Delhi',  toCode: 'DEL', departureTime: '21:30', arrivalTime: '23:40', duration: '2h 10m',  stops: 0, stopCities: [],             originalPrice: 7699, discountedPrice: 5499, fare: { economy: 5499,  premiumEconomy: 8799,  business: 17599 }, seatsLeft: 7,  aircraft: 'Boeing 737-800',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.6 },
  { flightCode: 'BT-771', airline: 'AeroIndia',          from: 'Hyderabad', fromCode: 'HYD', to: 'New Delhi',  toCode: 'DEL', departureTime: '14:50', arrivalTime: '17:10', duration: '2h 20m',  stops: 0, stopCities: [],             originalPrice: 7999, discountedPrice: 5799, fare: { economy: 5799,  premiumEconomy: 9299,  business: 18599 }, seatsLeft: 13, aircraft: 'Airbus A321neo',   baggage: { cabin: '7 kg', checkin: '20 kg' }, meals: true,  refundable: true,  rating: 4.5 },
  { flightCode: 'BT-882', airline: 'BlueBird Airways',   from: 'New Delhi', fromCode: 'DEL', to: 'Pune',       toCode: 'PNQ', departureTime: '17:00', arrivalTime: '19:10', duration: '2h 10m',  stops: 0, stopCities: [],             originalPrice: 7399, discountedPrice: 5299, fare: { economy: 5299,  premiumEconomy: 8499,  business: 16999 }, seatsLeft: 17, aircraft: 'Airbus A320',      baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.4 },
  { flightCode: 'BT-993', airline: 'JetStream',          from: 'Bengaluru', fromCode: 'BLR', to: 'Mumbai',     toCode: 'BOM', departureTime: '22:00', arrivalTime: '23:40', duration: '1h 40m',  stops: 0, stopCities: [],             originalPrice: 6299, discountedPrice: 4499, fare: { economy: 4499,  premiumEconomy: 7299,  business: 14599 }, seatsLeft: 21, aircraft: 'Boeing 737 MAX',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: false, refundable: false, rating: 4.3 },
  { flightCode: 'BT-104', airline: 'ClearSky Air',       from: 'New Delhi', fromCode: 'DEL', to: 'Srinagar',   toCode: 'SXR', departureTime: '06:15', arrivalTime: '07:45', duration: '1h 30m',  stops: 0, stopCities: [],             originalPrice: 6999, discountedPrice: 4999, fare: { economy: 4999,  premiumEconomy: 7999,  business: 15999 }, seatsLeft: 5,  aircraft: 'Airbus A320neo',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.7 },
  { flightCode: 'BT-215', airline: 'SkyWing Airlines',  from: 'Kolkata',   fromCode: 'CCU', to: 'Bengaluru',  toCode: 'BLR', departureTime: '11:30', arrivalTime: '14:20', duration: '2h 50m',  stops: 1, stopCities: ['Hyderabad'],  originalPrice: 9299, discountedPrice: 6799, fare: { economy: 6799,  premiumEconomy: 10899, business: 21799 }, seatsLeft: 10, aircraft: 'Boeing 737-800',   baggage: { cabin: '7 kg', checkin: '15 kg' }, meals: true,  refundable: true,  rating: 4.4 },
];

const seedData = raw.map((r) => ({
  ...r,
  airlineLogo: '',
  fareCategories: {
    economy:       makeFareCategory(r.fare.economy),
    premiumEconomy:makeFareCategory(r.fare.premiumEconomy),
    business:      makeFareCategory(r.fare.business),
  },
  isActive: true,
}));

// ── Runner ────────────────────────────────────────────────────────────────────

const seed = async () => {
  await mongoose.connect(env.MONGO_URI);
  logger.info('Seeder connected to MongoDB');

  const count = await Flight.countDocuments();
  if (count > 0) {
    logger.info(`Seed skipped — ${count} flights already exist`);
    await mongoose.disconnect();
    return;
  }

  const inserted = await Flight.insertMany(seedData);
  logger.info(`✅ Seeded ${inserted.length} flights`);
  await mongoose.disconnect();
};

seed().catch((err) => {
  logger.error('Seed failed', { err });
  process.exit(1);
});
