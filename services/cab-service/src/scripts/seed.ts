import 'dotenv/config';
import mongoose from 'mongoose';
import { Cab } from '../models/Cab';
import { env } from '../config/env';
import logger from '../utils/logger';

const cabs = [
  { carModel: 'Maruti Suzuki Dzire', brand: 'Maruti', type: 'Sedan', image: '/cabs/dzire.jpg', seatingCapacity: 4, fuelType: 'Petrol', ac: true, baseFare: 299, pricePerKm: 12, rating: 4.5, reviewCount: 1240, driverName: 'Rajesh Kumar', driverRating: 4.7, city: 'Delhi', features: ['AC', 'Music System', 'GPS', 'Bottle Water'], luggage: '2 Bags', available: true },
  { carModel: 'Toyota Innova Crysta', brand: 'Toyota', type: 'MUV', image: '/cabs/innova.jpg', seatingCapacity: 7, fuelType: 'Diesel', ac: true, baseFare: 599, pricePerKm: 18, rating: 4.8, reviewCount: 980, driverName: 'Amit Sharma', driverRating: 4.9, city: 'Mumbai', features: ['AC', 'Music System', 'GPS', 'Charging Port', 'Spacious'], luggage: '4 Bags', available: true },
  { carModel: 'Mahindra XUV700', brand: 'Mahindra', type: 'SUV', image: '/cabs/xuv700.jpg', seatingCapacity: 7, fuelType: 'Diesel', ac: true, baseFare: 699, pricePerKm: 20, rating: 4.7, reviewCount: 760, driverName: 'Vikram Singh', driverRating: 4.6, city: 'Jaipur', features: ['AC', 'Sunroof', 'GPS', 'Premium Sound', 'Leather Seats'], luggage: '4 Bags', available: true },
  { carModel: 'Maruti Suzuki Swift', brand: 'Maruti', type: 'Hatchback', image: '/cabs/swift.jpg', seatingCapacity: 4, fuelType: 'Petrol', ac: true, baseFare: 199, pricePerKm: 9, rating: 4.3, reviewCount: 2100, driverName: 'Suresh Yadav', driverRating: 4.4, city: 'Delhi', features: ['AC', 'Music System', 'Compact'], luggage: '1 Bag', available: true },
  { carModel: 'Mercedes-Benz E-Class', brand: 'Mercedes', type: 'Luxury', image: '/cabs/mercedes-e.jpg', seatingCapacity: 4, fuelType: 'Petrol', ac: true, baseFare: 1499, pricePerKm: 35, rating: 4.9, reviewCount: 420, driverName: 'Arjun Mehta', driverRating: 4.9, city: 'Mumbai', features: ['AC', 'Premium Sound', 'Leather Seats', 'WiFi', 'Bottle Water', 'Newspaper'], luggage: '3 Bags', available: true },
  { carModel: 'Honda Amaze', brand: 'Honda', type: 'Sedan', image: '/cabs/amaze.jpg', seatingCapacity: 4, fuelType: 'Diesel', ac: true, baseFare: 349, pricePerKm: 13, rating: 4.4, reviewCount: 890, driverName: 'Pradeep Verma', driverRating: 4.5, city: 'Bangalore', features: ['AC', 'Music System', 'GPS', 'Comfortable'], luggage: '2 Bags', available: true },
  { carModel: 'Kia Carens', brand: 'Kia', type: 'MUV', image: '/cabs/carens.jpg', seatingCapacity: 7, fuelType: 'Petrol', ac: true, baseFare: 549, pricePerKm: 16, rating: 4.6, reviewCount: 650, driverName: 'Manoj Tiwari', driverRating: 4.7, city: 'Hyderabad', features: ['AC', 'Music System', 'GPS', 'Ventilated Seats', 'Spacious'], luggage: '3 Bags', available: true },
  { carModel: 'Tata Nexon EV', brand: 'Tata', type: 'SUV', image: '/cabs/nexon-ev.jpg', seatingCapacity: 5, fuelType: 'Electric', ac: true, baseFare: 399, pricePerKm: 8, rating: 4.6, reviewCount: 540, driverName: 'Rohan Kapoor', driverRating: 4.8, city: 'Delhi', features: ['AC', 'Electric', 'GPS', 'Zero Emission', 'Smooth Ride'], luggage: '2 Bags', available: true },
  { carModel: 'Hyundai Aura CNG', brand: 'Hyundai', type: 'Sedan', image: '/cabs/aura.jpg', seatingCapacity: 4, fuelType: 'CNG', ac: true, baseFare: 249, pricePerKm: 10, rating: 4.2, reviewCount: 1560, driverName: 'Deepak Chauhan', driverRating: 4.3, city: 'Delhi', features: ['AC', 'CNG', 'Budget Friendly', 'Music System'], luggage: '2 Bags', available: true },
  { carModel: 'Toyota Fortuner', brand: 'Toyota', type: 'SUV', image: '/cabs/fortuner.jpg', seatingCapacity: 7, fuelType: 'Diesel', ac: true, baseFare: 899, pricePerKm: 24, rating: 4.8, reviewCount: 380, driverName: 'Karan Singh', driverRating: 4.8, city: 'Chandigarh', features: ['AC', 'Premium', 'GPS', '4WD', 'Leather Seats', 'Spacious'], luggage: '5 Bags', available: true },
  { carModel: 'Maruti Suzuki Ertiga', brand: 'Maruti', type: 'MUV', image: '/cabs/ertiga.jpg', seatingCapacity: 7, fuelType: 'CNG', ac: true, baseFare: 449, pricePerKm: 14, rating: 4.5, reviewCount: 1120, driverName: 'Ramesh Gupta', driverRating: 4.6, city: 'Pune', features: ['AC', 'CNG', 'Spacious', 'Music System', 'Family Friendly'], luggage: '3 Bags', available: true },
  { carModel: 'BMW 5 Series', brand: 'BMW', type: 'Luxury', image: '/cabs/bmw5.jpg', seatingCapacity: 4, fuelType: 'Petrol', ac: true, baseFare: 1799, pricePerKm: 40, rating: 4.9, reviewCount: 290, driverName: 'Ankit Malhotra', driverRating: 5.0, city: 'Delhi', features: ['AC', 'Premium Sound', 'Leather Seats', 'WiFi', 'Mini Bar', 'Magazine'], luggage: '3 Bags', available: true },
  { carModel: 'Hyundai Creta', brand: 'Hyundai', type: 'SUV', image: '/cabs/creta.jpg', seatingCapacity: 5, fuelType: 'Petrol', ac: true, baseFare: 499, pricePerKm: 16, rating: 4.5, reviewCount: 870, driverName: 'Nitin Reddy', driverRating: 4.6, city: 'Hyderabad', features: ['AC', 'GPS', 'Music System', 'Sunroof', 'Comfortable'], luggage: '2 Bags', available: true },
  { carModel: 'Tata Tiago', brand: 'Tata', type: 'Hatchback', image: '/cabs/tiago.jpg', seatingCapacity: 4, fuelType: 'Petrol', ac: true, baseFare: 179, pricePerKm: 8, rating: 4.1, reviewCount: 1800, driverName: 'Santosh Patil', driverRating: 4.2, city: 'Pune', features: ['AC', 'Budget Friendly', 'Compact'], luggage: '1 Bag', available: true },
  { carModel: 'Mahindra Scorpio N', brand: 'Mahindra', type: 'SUV', image: '/cabs/scorpio.jpg', seatingCapacity: 7, fuelType: 'Diesel', ac: true, baseFare: 649, pricePerKm: 19, rating: 4.6, reviewCount: 620, driverName: 'Prakash Joshi', driverRating: 4.5, city: 'Jaipur', features: ['AC', 'GPS', '4WD', 'Rugged', 'Music System'], luggage: '4 Bags', available: true },
  { carModel: 'Honda City', brand: 'Honda', type: 'Sedan', image: '/cabs/city.jpg', seatingCapacity: 4, fuelType: 'Petrol', ac: true, baseFare: 399, pricePerKm: 14, rating: 4.6, reviewCount: 940, driverName: 'Gaurav Sinha', driverRating: 4.7, city: 'Bangalore', features: ['AC', 'Music System', 'GPS', 'Lane Assist', 'Comfortable'], luggage: '2 Bags', available: true },
  { carModel: 'MG Hector', brand: 'MG', type: 'SUV', image: '/cabs/hector.jpg', seatingCapacity: 5, fuelType: 'Diesel', ac: true, baseFare: 549, pricePerKm: 17, rating: 4.4, reviewCount: 480, driverName: 'Sumit Agarwal', driverRating: 4.5, city: 'Kolkata', features: ['AC', 'Panoramic Sunroof', 'GPS', 'Premium Sound', 'Connected Car'], luggage: '3 Bags', available: true },
  { carModel: 'Maruti Suzuki Wagon R', brand: 'Maruti', type: 'Hatchback', image: '/cabs/wagonr.jpg', seatingCapacity: 4, fuelType: 'CNG', ac: true, baseFare: 149, pricePerKm: 7, rating: 4.0, reviewCount: 3200, driverName: 'Rahul Mishra', driverRating: 4.1, city: 'Delhi', features: ['AC', 'CNG', 'Budget Friendly', 'Tall Boy Design'], luggage: '1 Bag', available: true },
  { carModel: 'Audi A6', brand: 'Audi', type: 'Luxury', image: '/cabs/audi-a6.jpg', seatingCapacity: 4, fuelType: 'Petrol', ac: true, baseFare: 1999, pricePerKm: 45, rating: 4.9, reviewCount: 210, driverName: 'Naveen Bhatia', driverRating: 5.0, city: 'Mumbai', features: ['AC', 'Premium Sound', 'Leather Seats', 'WiFi', 'Ambient Lighting', 'Privacy Glass'], luggage: '3 Bags', available: true },
  { carModel: 'Kia Seltos', brand: 'Kia', type: 'SUV', image: '/cabs/seltos.jpg', seatingCapacity: 5, fuelType: 'Petrol', ac: true, baseFare: 449, pricePerKm: 15, rating: 4.5, reviewCount: 720, driverName: 'Vivek Pandey', driverRating: 4.6, city: 'Chennai', features: ['AC', 'GPS', 'Music System', 'Ventilated Seats', 'Connected Car'], luggage: '2 Bags', available: true },
  { carModel: 'Hyundai Grand i10 Nios', brand: 'Hyundai', type: 'Hatchback', image: '/cabs/i10.jpg', seatingCapacity: 4, fuelType: 'Petrol', ac: true, baseFare: 169, pricePerKm: 8, rating: 4.2, reviewCount: 1650, driverName: 'Ajay Raut', driverRating: 4.3, city: 'Pune', features: ['AC', 'Compact', 'Music System', 'Budget Friendly'], luggage: '1 Bag', available: true },
  { carModel: 'Toyota Land Cruiser', brand: 'Toyota', type: 'Luxury', image: '/cabs/landcruiser.jpg', seatingCapacity: 7, fuelType: 'Diesel', ac: true, baseFare: 2499, pricePerKm: 55, rating: 5.0, reviewCount: 140, driverName: 'Sharad Kapoor', driverRating: 5.0, city: 'Delhi', features: ['AC', 'Premium', '4WD', 'Leather Seats', 'WiFi', 'Mini Bar', 'Captain Seats'], luggage: '5 Bags', available: true },
  { carModel: 'Maruti Suzuki Ciaz', brand: 'Maruti', type: 'Sedan', image: '/cabs/ciaz.jpg', seatingCapacity: 4, fuelType: 'Diesel', ac: true, baseFare: 349, pricePerKm: 13, rating: 4.4, reviewCount: 780, driverName: 'Mohan Das', driverRating: 4.5, city: 'Kolkata', features: ['AC', 'Music System', 'GPS', 'Spacious Boot', 'Comfortable'], luggage: '3 Bags', available: true },
  { carModel: 'Mahindra Marazzo', brand: 'Mahindra', type: 'MUV', image: '/cabs/marazzo.jpg', seatingCapacity: 8, fuelType: 'Diesel', ac: true, baseFare: 499, pricePerKm: 15, rating: 4.3, reviewCount: 560, driverName: 'Balraj Patel', driverRating: 4.4, city: 'Ahmedabad', features: ['AC', '8-Seater', 'Spacious', 'Music System', 'Captain Seats'], luggage: '4 Bags', available: true },
  { carModel: 'Tata Safari', brand: 'Tata', type: 'SUV', image: '/cabs/safari.jpg', seatingCapacity: 7, fuelType: 'Diesel', ac: true, baseFare: 649, pricePerKm: 19, rating: 4.6, reviewCount: 510, driverName: 'Harish Nair', driverRating: 4.7, city: 'Goa', features: ['AC', 'Panoramic Sunroof', 'GPS', 'Terrain Modes', 'Premium Sound'], luggage: '4 Bags', available: true },
];

const seed = async () => {
  await mongoose.connect(env.MONGO_URI);
  logger.info('Seeder connected to MongoDB');

  const count = await Cab.countDocuments();
  if (count > 0) {
    logger.info(`Seed skipped - ${count} cabs already exist`);
    await mongoose.disconnect();
    return;
  }

  const inserted = await Cab.insertMany(cabs.map((cab) => ({ ...cab, isActive: true })));
  logger.info(`Seeded ${inserted.length} cabs`);
  await mongoose.disconnect();
};

seed().catch((error) => {
  logger.error('Seed failed', { error });
  process.exit(1);
});
