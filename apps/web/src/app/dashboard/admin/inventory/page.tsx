"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import MediaUploader from "@/components/dashboard/MediaUploader/MediaUploader";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/services/auth/context";
import styles from "./page.module.scss";
import {
  InventoryEntity,
  createInventory,
  deactivateInventory,
  getFlightByIdentifier,
  getTrainByIdentifier,
  listInventory,
  reactivateInventory,
  updateInventory,
} from "@/services/inventory/api";

type EntityState = Record<string, string>;

type FieldType = "text" | "number" | "checkbox";

interface EntityField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
}

interface EntityConfig {
  id: InventoryEntity;
  label: string;
  createFields: EntityField[];
  updateFields: EntityField[];
  createDefaults: EntityState;
  updateDefaults: EntityState;
}

const MIN_DELAY_MS = 500;

const runWithDelay = async <T,>(task: Promise<T>): Promise<T> => {
  const [result] = await Promise.all([
    task,
    new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS)),
  ]);
  return result;
};

const ENTITY_CONFIGS: EntityConfig[] = [
  {
    id: "flights",
    label: "Flights",
    createFields: [
      { key: "flightCode", label: "Flight Code", type: "text", required: true, placeholder: "BT-999" },
      { key: "airline", label: "Airline", type: "text", required: true, placeholder: "BookMyTrip Air" },
      { key: "from", label: "From City", type: "text", required: true, placeholder: "Delhi" },
      { key: "fromCode", label: "From Code", type: "text", required: true, placeholder: "DEL" },
      { key: "boardingAirport", label: "Boarding Airport", type: "text", required: true, placeholder: "Indira Gandhi International Airport" },
      { key: "boardingTerminal", label: "Boarding Terminal", type: "text", required: true, placeholder: "T3" },
      { key: "boardingTime", label: "Boarding Time", type: "text", required: true, placeholder: "08:45" },
      { key: "to", label: "To City", type: "text", required: true, placeholder: "Mumbai" },
      { key: "toCode", label: "To Code", type: "text", required: true, placeholder: "BOM" },
      { key: "departureTime", label: "Departure Time", type: "text", required: true, placeholder: "09:30" },
      { key: "arrivalTime", label: "Arrival Time", type: "text", required: true, placeholder: "11:45" },
      { key: "duration", label: "Duration", type: "text", required: true, placeholder: "2h 15m" },
      { key: "stops", label: "Stops", type: "number", required: true, placeholder: "0" },
      { key: "stopCities", label: "Stop Cities", type: "text", placeholder: "Type a city and press Enter" },
      { key: "operatingDays", label: "Operating Days", type: "text", required: true, placeholder: "Type a day and press Enter" },
      { key: "originalPrice", label: "Original Price", type: "number", required: true, placeholder: "6499" },
      { key: "discountedPrice", label: "Discounted Price", type: "number", required: true, placeholder: "5299" },
      { key: "fareEconomy", label: "Fare Economy", type: "number", required: true, placeholder: "5299" },
      { key: "farePremiumEconomy", label: "Fare Premium Economy", type: "number", required: true, placeholder: "6799" },
      { key: "fareBusiness", label: "Fare Business", type: "number", required: true, placeholder: "11899" },
      { key: "seatsLeft", label: "Seats Left", type: "number", required: true, placeholder: "18" },
      { key: "aircraft", label: "Aircraft", type: "text", required: true, placeholder: "Airbus A320" },
      { key: "baggageCabin", label: "Cabin Baggage", type: "text", required: true, placeholder: "7kg" },
      { key: "baggageCheckin", label: "Check-in Baggage", type: "text", required: true, placeholder: "20kg" },
      { key: "meals", label: "Meals", type: "checkbox" },
      { key: "refundable", label: "Refundable", type: "checkbox" },
      { key: "rating", label: "Rating", type: "number", placeholder: "4.4" },
    ],
    updateFields: [
      { key: "discountedPrice", label: "Discounted Price", type: "number", placeholder: "4999" },
      { key: "seatsLeft", label: "Seats Left", type: "number", placeholder: "14" },
      { key: "meals", label: "Meals", type: "checkbox" },
      { key: "refundable", label: "Refundable", type: "checkbox" },
      { key: "rating", label: "Rating", type: "number", placeholder: "4.6" },
    ],
    createDefaults: {
      flightCode: "BT-999",
      airline: "BookMyTrip Air",
      from: "Delhi",
      fromCode: "DEL",
      boardingAirport: "Indira Gandhi International Airport",
      boardingTerminal: "T3",
      boardingTime: "08:45",
      to: "Mumbai",
      toCode: "BOM",
      departureTime: "09:30",
      arrivalTime: "11:45",
      duration: "2h 15m",
      stops: "0",
      stopCities: "",
      operatingDays: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
      originalPrice: "6499",
      discountedPrice: "5299",
      fareEconomy: "5299",
      farePremiumEconomy: "6799",
      fareBusiness: "11899",
      seatsLeft: "18",
      aircraft: "Airbus A320",
      baggageCabin: "7kg",
      baggageCheckin: "20kg",
      meals: "false",
      refundable: "true",
      rating: "4.4",
    },
    updateDefaults: {
      discountedPrice: "4999",
      seatsLeft: "14",
      meals: "true",
      refundable: "true",
      rating: "4.6",
    },
  },
  {
    id: "trains",
    label: "Trains",
    createFields: [
      { key: "trainNumber", label: "Train Number", type: "text", required: true, placeholder: "12999" },
      { key: "name", label: "Train Name", type: "text", required: true, placeholder: "Sample Express" },
      { key: "from", label: "From City", type: "text", required: true, placeholder: "Delhi" },
      { key: "fromCode", label: "From Code", type: "text", required: true, placeholder: "NDLS" },
      { key: "fromStationName", label: "From Station Name", type: "text", required: true, placeholder: "New Delhi Railway Station" },
      { key: "fromStationCode", label: "From Station Code", type: "text", required: true, placeholder: "NDLS" },
      { key: "to", label: "To City", type: "text", required: true, placeholder: "Mumbai" },
      { key: "toCode", label: "To Code", type: "text", required: true, placeholder: "BCT" },
      { key: "toStationName", label: "To Station Name", type: "text", required: true, placeholder: "Mumbai Central" },
      { key: "toStationCode", label: "To Station Code", type: "text", required: true, placeholder: "BCT" },
      { key: "platformNumber", label: "Platform Number", type: "text", required: true, placeholder: "5" },
      { key: "departureTime", label: "Departure Time", type: "text", required: true, placeholder: "06:00" },
      { key: "arrivalTime", label: "Arrival Time", type: "text", required: true, placeholder: "21:30" },
      { key: "duration", label: "Duration", type: "text", required: true, placeholder: "15h 30m" },
      { key: "daysOfWeek", label: "Operating Days", type: "text", required: true, placeholder: "Type a day and press Enter" },
      { key: "pnr", label: "PNR Prefix", type: "text", required: true, placeholder: "PNR-TRAIN" },
      { key: "fareSleeper", label: "Sleeper Fare", type: "number", required: true, placeholder: "899" },
      { key: "fareAc3", label: "3AC Fare", type: "number", required: true, placeholder: "1299" },
      { key: "fareAc2", label: "2AC Fare", type: "number", required: true, placeholder: "1799" },
      { key: "fareAc1", label: "1AC Fare", type: "number", required: true, placeholder: "2599" },
      { key: "seatsSleeper", label: "Sleeper Seats", type: "number", required: true, placeholder: "120" },
      { key: "seatsAc3", label: "3AC Seats", type: "number", required: true, placeholder: "80" },
      { key: "seatsAc2", label: "2AC Seats", type: "number", required: true, placeholder: "50" },
      { key: "seatsAc1", label: "1AC Seats", type: "number", required: true, placeholder: "25" },
      { key: "type", label: "Type", type: "text", required: true, placeholder: "Express" },
      { key: "stops", label: "Stops", type: "number", required: true, placeholder: "4" },
      { key: "rating", label: "Rating", type: "number", placeholder: "4.2" },
    ],
    updateFields: [
      { key: "fareSleeper", label: "Sleeper Fare", type: "number", placeholder: "949" },
      { key: "fareAc3", label: "3AC Fare", type: "number", placeholder: "1349" },
      { key: "seatsSleeper", label: "Sleeper Seats", type: "number", placeholder: "105" },
      { key: "rating", label: "Rating", type: "number", placeholder: "4.4" },
    ],
    createDefaults: {
      trainNumber: "12999",
      name: "Sample Express",
      from: "Delhi",
      fromCode: "NDLS",
      fromStationName: "New Delhi Railway Station",
      fromStationCode: "NDLS",
      to: "Mumbai",
      toCode: "BCT",
      toStationName: "Mumbai Central",
      toStationCode: "BCT",
      platformNumber: "5",
      departureTime: "06:00",
      arrivalTime: "21:30",
      duration: "15h 30m",
      daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
      pnr: "PNR-TRAIN",
      fareSleeper: "899",
      fareAc3: "1299",
      fareAc2: "1799",
      fareAc1: "2599",
      seatsSleeper: "120",
      seatsAc3: "80",
      seatsAc2: "50",
      seatsAc1: "25",
      type: "Express",
      stops: "4",
      rating: "4.2",
    },
    updateDefaults: {
      fareSleeper: "949",
      fareAc3: "1349",
      seatsSleeper: "105",
      rating: "4.4",
    },
  },
  {
    id: "hotels",
    label: "Hotels",
    createFields: [
      { key: "name", label: "Hotel Name", type: "text", required: true, placeholder: "Blue Coast Residency" },
      { key: "city", label: "City", type: "text", required: true, placeholder: "Goa" },
      { key: "address", label: "Address", type: "text", required: true, placeholder: "Calangute Beach Road" },
      { key: "image", label: "Primary Image URL", type: "text", required: true, placeholder: "https://..." },
      { key: "images", label: "Image URLs", type: "text", required: true, placeholder: "Paste url and press Enter" },
      { key: "rating", label: "Rating", type: "number", required: true, placeholder: "4.5" },
      { key: "reviewCount", label: "Review Count", type: "number", required: true, placeholder: "132" },
      { key: "stars", label: "Stars", type: "number", required: true, placeholder: "4" },
      { key: "pricePerNight", label: "Price/Night", type: "number", required: true, placeholder: "4999" },
      { key: "originalPrice", label: "Original Price", type: "number", required: true, placeholder: "6199" },
      { key: "amenities", label: "Amenities", type: "text", required: true, placeholder: "Type amenity and press Enter" },
      { key: "foodIncluded", label: "Food Included", type: "text", required: true, placeholder: "breakfast" },
      { key: "wifi", label: "WiFi", type: "checkbox" },
      { key: "parking", label: "Parking", type: "checkbox" },
      { key: "pool", label: "Pool", type: "checkbox" },
      { key: "gym", label: "Gym", type: "checkbox" },
      { key: "spa", label: "Spa", type: "checkbox" },
      { key: "petFriendly", label: "Pet Friendly", type: "checkbox" },
      { key: "refundPolicy", label: "Refund Policy", type: "text", required: true, placeholder: "partial" },
      { key: "refundDescription", label: "Refund Description", type: "text", required: true, placeholder: "50% refund before 24h" },
      { key: "checkInTime", label: "Check-in Time", type: "text", required: true, placeholder: "14:00" },
      { key: "checkOutTime", label: "Check-out Time", type: "text", required: true, placeholder: "11:00" },
      { key: "description", label: "Description", type: "text", required: true, placeholder: "Premium hotel near beach..." },
      { key: "tags", label: "Tags", type: "text", required: true, placeholder: "Type tag and press Enter" },
    ],
    updateFields: [
      { key: "pricePerNight", label: "Price/Night", type: "number", placeholder: "4599" },
      { key: "rating", label: "Rating", type: "number", placeholder: "4.7" },
      { key: "wifi", label: "WiFi", type: "checkbox" },
      { key: "pool", label: "Pool", type: "checkbox" },
    ],
    createDefaults: {
      name: "Blue Coast Residency",
      city: "Goa",
      address: "Calangute Beach Road",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      images: "https://images.unsplash.com/photo-1566073771259-6a8506099945,https://images.unsplash.com/photo-1571896349842-33c89424de2d",
      rating: "4.5",
      reviewCount: "132",
      stars: "4",
      pricePerNight: "4999",
      originalPrice: "6199",
      amenities: "Pool,WiFi,Breakfast,Gym",
      foodIncluded: "breakfast",
      wifi: "true",
      parking: "true",
      pool: "true",
      gym: "true",
      spa: "false",
      petFriendly: "false",
      refundPolicy: "partial",
      refundDescription: "50% refund before 24h",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      description: "Premium hotel near the beach with modern amenities and curated stay experiences.",
      tags: "beach,luxury,family",
    },
    updateDefaults: {
      pricePerNight: "4599",
      rating: "4.7",
      wifi: "true",
      pool: "true",
    },
  },
  {
    id: "cabs",
    label: "Cabs",
    createFields: [
      { key: "carModel", label: "Car Model", type: "text", required: true, placeholder: "Swift Dzire" },
      { key: "brand", label: "Brand", type: "text", required: true, placeholder: "Maruti" },
      { key: "type", label: "Type", type: "text", required: true, placeholder: "Sedan" },
      { key: "image", label: "Image URL", type: "text", required: true, placeholder: "https://..." },
      { key: "seatingCapacity", label: "Seating Capacity", type: "number", required: true, placeholder: "4" },
      { key: "fuelType", label: "Fuel Type", type: "text", required: true, placeholder: "Petrol" },
      { key: "ac", label: "AC", type: "checkbox" },
      { key: "baseFare", label: "Base Fare", type: "number", required: true, placeholder: "399" },
      { key: "pricePerKm", label: "Price/KM", type: "number", required: true, placeholder: "12" },
      { key: "rating", label: "Rating", type: "number", required: true, placeholder: "4.3" },
      { key: "reviewCount", label: "Review Count", type: "number", required: true, placeholder: "54" },
      { key: "driverName", label: "Driver Name", type: "text", required: true, placeholder: "Arun Kumar" },
      { key: "driverPhone", label: "Driver Phone", type: "text", required: true, placeholder: "9876543210" },
      { key: "cabNumber", label: "Cab Number", type: "text", required: true, placeholder: "DLAW0124" },
      { key: "driverRating", label: "Driver Rating", type: "number", required: true, placeholder: "4.6" },
      { key: "city", label: "City", type: "text", required: true, placeholder: "Mumbai" },
      { key: "cabStands", label: "Cab Stands", type: "text", required: true, placeholder: "Type cab stand and press Enter" },
      { key: "features", label: "Features", type: "text", required: true, placeholder: "Type feature and press Enter" },
      { key: "luggage", label: "Luggage", type: "text", required: true, placeholder: "2 bags" },
      { key: "available", label: "Available", type: "checkbox" },
    ],
    updateFields: [
      { key: "baseFare", label: "Base Fare", type: "number", placeholder: "449" },
      { key: "pricePerKm", label: "Price/KM", type: "number", placeholder: "13" },
      { key: "rating", label: "Rating", type: "number", placeholder: "4.5" },
      { key: "cabStands", label: "Cab Stands", type: "text", placeholder: "Type cab stand and press Enter" },
      { key: "available", label: "Available", type: "checkbox" },
    ],
    createDefaults: {
      carModel: "Swift Dzire",
      brand: "Maruti",
      type: "Sedan",
      image: "https://images.unsplash.com/photo-1549924231-f129b911e442",
      seatingCapacity: "4",
      fuelType: "Petrol",
      ac: "true",
      baseFare: "399",
      pricePerKm: "12",
      rating: "4.3",
      reviewCount: "54",
      driverName: "Arun Kumar",
      driverPhone: "9876543210",
      cabNumber: "DLAW0124",
      driverRating: "4.6",
      city: "Mumbai",
      cabStands: "Andheri Station,Bandra West,Airport Terminal 2,BKC,Lower Parel,Powai",
      features: "Music,Charging Port,Sanitized",
      luggage: "2 bags",
      available: "true",
    },
    updateDefaults: {
      baseFare: "449",
      pricePerKm: "13",
      rating: "4.5",
      cabStands: "Andheri Station,Bandra West,Airport Terminal 2,BKC,Lower Parel,Powai",
      available: "true",
    },
  },
  {
    id: "tours",
    label: "Tours",
    createFields: [
      { key: "title", label: "Title", type: "text", required: true, placeholder: "Goa Escape" },
      { key: "city", label: "City", type: "text", required: true, placeholder: "Goa" },
      { key: "country", label: "Country", type: "text", required: true, placeholder: "India" },
      { key: "durationDays", label: "Duration Days", type: "number", required: true, placeholder: "4" },
      { key: "basePrice", label: "Base Price", type: "number", required: true, placeholder: "15999" },
      { key: "discountPrice", label: "Discount Price", type: "number", placeholder: "13999" },
      { key: "heroImage", label: "Hero Image URL", type: "text", required: true, placeholder: "https://..." },
      { key: "images", label: "Image URLs", type: "text", required: true, placeholder: "Paste url and press Enter" },
      { key: "description", label: "Description", type: "text", required: true, placeholder: "Explore beaches and heritage sites..." },
      { key: "tags", label: "Tags", type: "text", placeholder: "Type tag and press Enter" },
      { key: "inclusions", label: "Inclusions", type: "text", placeholder: "Type inclusion and press Enter" },
      { key: "exclusions", label: "Exclusions", type: "text", placeholder: "Type exclusion and press Enter" },
      { key: "hotel", label: "Hotel", type: "text", placeholder: "Premium Beach Resort" },
      { key: "hotelRating", label: "Hotel Rating", type: "number", placeholder: "4.5" },
      { key: "food", label: "Food", type: "text", placeholder: "Breakfast,Dinner" },
      { key: "transport", label: "Transport", type: "text", placeholder: "Private transfers,Coach" },
      { key: "activities", label: "Activities", type: "text", placeholder: "Scuba,Sunset cruise" },
      { key: "highlights", label: "Highlights", type: "text", placeholder: "Beach day,Old Goa,Market walk" },
      { key: "bestSeason", label: "Best Season", type: "text", placeholder: "Oct-Mar" },
      { key: "groupSize", label: "Group Size", type: "text", placeholder: "2-15 pax" },
      { key: "tripType", label: "Trip Type", type: "text", placeholder: "Leisure" },
      { key: "hospitality", label: "Hospitality", type: "text", placeholder: "Premium" },
      { key: "documents", label: "Documents", type: "text", placeholder: "Passport,Government ID" },
      { key: "guideName", label: "Guide Name", type: "text", placeholder: "BMT Local Expert" },
      { key: "guideContact", label: "Guide Contact", type: "text", placeholder: "+91 98765 43210" },
      { key: "guideLanguages", label: "Guide Languages", type: "text", placeholder: "English,Hindi" },
      { key: "guideRating", label: "Guide Rating", type: "number", placeholder: "4.6" },
      { key: "guideExperience", label: "Guide Experience", type: "text", placeholder: "5+ years" },
      { key: "guideSpeciality", label: "Guide Speciality", type: "text", placeholder: "Goa and surroundings" },
      { key: "guidePhoto", label: "Guide Photo URL", type: "text", placeholder: "https://..." },
      { key: "guideBio", label: "Guide Bio", type: "text", placeholder: "Friendly local expert..." },
      { key: "offerCodes", label: "Offer Coupons", type: "text", placeholder: "Type coupon code and press Enter" },
      { key: "isActive", label: "Is Active", type: "checkbox" },
    ],
    updateFields: [
      { key: "basePrice", label: "Base Price", type: "number", placeholder: "14999" },
      { key: "discountPrice", label: "Discount Price", type: "number", placeholder: "12999" },
      { key: "description", label: "Description", type: "text", placeholder: "Updated details..." },
    ],
    createDefaults: {
      title: "Goa Escape",
      city: "Goa",
      country: "India",
      durationDays: "4",
      basePrice: "15999",
      discountPrice: "13999",
      heroImage: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda",
      images: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda",
      description: "Explore beaches and heritage districts with curated stays and guided city tours.",
      tags: "beach,leisure,culture",
      inclusions: "Hotel,Breakfast,Transfers",
      exclusions: "Flights,Insurance",
      hotel: "Premium Beach Resort",
      hotelRating: "4.5",
      food: "Breakfast,Dinner",
      transport: "Private transfers",
      activities: "Sightseeing,Beach Day",
      highlights: "Old Goa churches,Sunset cruise,Local markets",
      bestSeason: "Oct-Mar",
      groupSize: "2-15 pax",
      tripType: "Leisure",
      hospitality: "Premium",
      documents: "Government photo ID",
      guideName: "BMT Local Expert",
      guideContact: "+91 98765 43210",
      guideLanguages: "English,Hindi",
      guideRating: "4.6",
      guideExperience: "5+ years",
      guideSpeciality: "Goa and nearby circuits",
      guidePhoto: "",
      guideBio: "Knowledgeable local guide for immersive city and beach experiences.",
      offerCodes: "",
      isActive: "true",
    },
    updateDefaults: {
      basePrice: "14999",
      discountPrice: "12999",
      description: "Updated itinerary and premium inclusions.",
    },
  },
];

const extractId = (row: unknown): string => {
  if (!row || typeof row !== "object") return "";
  const record = row as Record<string, unknown>;
  const mongoId = record._id;
  const id = record.id;
  if (typeof mongoId === "string" && mongoId) return mongoId;
  if (typeof id === "string" && id) return id;
  return "";
};

const parseNumber = (value: string, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

type NumberLimit = { min?: number; max?: number };

const NUMBER_LIMITS: Record<string, NumberLimit> = {
  stops: { min: 0, max: 4 },
  seatsLeft: { min: 0, max: 400 },
  fareEconomy: { min: 0, max: 500000 },
  farePremiumEconomy: { min: 0, max: 500000 },
  fareBusiness: { min: 0, max: 1000000 },
  originalPrice: { min: 0, max: 1000000 },
  discountedPrice: { min: 0, max: 1000000 },
  rating: { min: 1, max: 5 },
  reviewCount: { min: 0, max: 1000000 },
  fareSleeper: { min: 0, max: 500000 },
  fareAc3: { min: 0, max: 500000 },
  fareAc2: { min: 0, max: 500000 },
  fareAc1: { min: 0, max: 500000 },
  seatsSleeper: { min: 0, max: 1200 },
  seatsAc3: { min: 0, max: 1200 },
  seatsAc2: { min: 0, max: 800 },
  seatsAc1: { min: 0, max: 500 },
  stars: { min: 1, max: 5 },
  pricePerNight: { min: 0, max: 1000000 },
  seatingCapacity: { min: 1, max: 20 },
  baseFare: { min: 0, max: 500000 },
  pricePerKm: { min: 0, max: 10000 },
  driverRating: { min: 1, max: 5 },
  durationDays: { min: 1, max: 90 },
  basePrice: { min: 0, max: 10000000 },
  discountPrice: { min: 0, max: 10000000 },
  hotelRating: { min: 0, max: 5 },
  guideRating: { min: 0, max: 5 },
};

const clampNumber = (value: number, limit?: NumberLimit): number => {
  if (!limit) return value;
  let next = value;
  if (limit.min != null && next < limit.min) next = limit.min;
  if (limit.max != null && next > limit.max) next = limit.max;
  return next;
};

const parseBoundedNumber = (key: string, value: string, fallback = 0): number => {
  const num = parseNumber(value, fallback);
  return clampNumber(num, NUMBER_LIMITS[key]);
};

const parseBoolean = (value: string): boolean => value === "true";

const parseList = (value: string | undefined | null): string[] =>
  !value
    ? []
    : Array.from(
        new Set(
          value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean),
        ),
      );

const buildOffersFromCodes = (value: string) => {
  return parseList(value).map((code) => ({
    title: `${code} Offer`,
    code,
    discountType: "percent",
    discountValue: 10,
  }));
};

const parseDistanceMatrix = (value: string | undefined | null) => {
  return parseList(value)
    .map((entry) => {
      const [routePart, distancePart] = entry.split(":");
      if (!routePart || !distancePart) return null;
      const [fromPart, toPart] = routePart.split("->");
      const from = fromPart?.trim();
      const to = toPart?.trim();
      const distanceKm = Number(distancePart.trim());

      if (!from || !to || !Number.isFinite(distanceKm) || distanceKm <= 0) {
        return null;
      }

      return {
        from,
        to,
        distanceKm,
      };
    })
    .filter((route): route is { from: string; to: string; distanceKm: number } => route !== null);
};

const LIST_FIELD_KEYS = new Set([
  "stopCities",
  "operatingDays",
  "daysOfWeek",
  "images",
  "amenities",
  "tags",
  "features",
  "cabStands",
  "pickupPoints",
  "dropPoints",
  "routeDistances",
  "inclusions",
  "exclusions",
  "food",
  "transport",
  "activities",
  "highlights",
  "documents",
  "guideLanguages",
  "offerCodes",
]);

const BULK_ALLOWED_FIELDS: Record<InventoryEntity, string[]> = {
  flights: ["airline", "refundable", "rating", "meals", "aircraft"],
  trains: ["name", "type", "rating", "daysOfWeek"],
  hotels: ["rating", "stars", "amenities", "wifi", "parking", "pool", "gym", "spa", "petFriendly"],
  cabs: ["brand", "type", "rating", "available", "features", "ac"],
  tours: ["country", "basePrice", "discountPrice", "tags", "inclusions", "exclusions"],
};

const buildCreatePayload = (entity: InventoryEntity, values: EntityState) => {
  if (entity === "flights") {
    return {
      flightCode: values.flightCode,
      airline: values.airline,
      from: values.from,
      fromCode: values.fromCode.toUpperCase(),
      boardingAirport: values.boardingAirport,
      boardingTerminal: values.boardingTerminal,
      boardingTime: values.boardingTime,
      to: values.to,
      toCode: values.toCode.toUpperCase(),
      departureTime: values.departureTime,
      arrivalTime: values.arrivalTime,
      duration: values.duration,
      stops: parseBoundedNumber("stops", values.stops),
      stopCities: parseList(values.stopCities),
      operatingDays: parseList(values.operatingDays),
      originalPrice: parseBoundedNumber("originalPrice", values.originalPrice),
      discountedPrice: parseBoundedNumber("discountedPrice", values.discountedPrice),
      fare: {
        economy: parseBoundedNumber("fareEconomy", values.fareEconomy),
        premiumEconomy: parseBoundedNumber("farePremiumEconomy", values.farePremiumEconomy),
        business: parseBoundedNumber("fareBusiness", values.fareBusiness),
      },
      seatsLeft: parseBoundedNumber("seatsLeft", values.seatsLeft),
      aircraft: values.aircraft,
      baggage: {
        cabin: values.baggageCabin,
        checkin: values.baggageCheckin,
      },
      meals: parseBoolean(values.meals),
      refundable: parseBoolean(values.refundable),
      rating: parseBoundedNumber("rating", values.rating, 4),
    };
  }

  if (entity === "trains") {
    const sleeperFare = parseBoundedNumber("fareSleeper", values.fareSleeper);
    const ac3Fare = parseBoundedNumber("fareAc3", values.fareAc3);
    const ac2Fare = parseBoundedNumber("fareAc2", values.fareAc2);
    const ac1Fare = parseBoundedNumber("fareAc1", values.fareAc1);

    return {
      trainNumber: values.trainNumber,
      name: values.name,
      from: values.from,
      fromCode: values.fromCode.toUpperCase(),
      fromStationName: values.fromStationName,
      fromStationCode: values.fromStationCode.toUpperCase(),
      to: values.to,
      toCode: values.toCode.toUpperCase(),
      toStationName: values.toStationName,
      toStationCode: values.toStationCode.toUpperCase(),
      platformNumber: values.platformNumber,
      departureTime: values.departureTime,
      arrivalTime: values.arrivalTime,
      duration: values.duration,
      daysOfWeek: parseList(values.daysOfWeek),
      pnr: values.pnr,
      fare: {
        general: sleeperFare,
        sleeper: sleeperFare,
        ac3Tier: ac3Fare,
        ac2Tier: ac2Fare,
        ac1st: ac1Fare,
      },
      seatsAvailable: {
        general: parseBoundedNumber("seatsSleeper", values.seatsSleeper),
        sleeper: parseBoundedNumber("seatsSleeper", values.seatsSleeper),
        ac3Tier: parseBoundedNumber("seatsAc3", values.seatsAc3),
        ac2Tier: parseBoundedNumber("seatsAc2", values.seatsAc2),
        ac1st: parseBoundedNumber("seatsAc1", values.seatsAc1),
      },
      type: values.type,
      stops: parseBoundedNumber("stops", values.stops),
      rating: parseBoundedNumber("rating", values.rating, 4),
    };
  }

  if (entity === "hotels") {
    const roomPrice = parseBoundedNumber("pricePerNight", values.pricePerNight);
    const roomOriginal = parseBoundedNumber("originalPrice", values.originalPrice);

    return {
      name: values.name,
      city: values.city,
      address: values.address,
      image: values.image,
      images: parseList(values.images),
      rating: parseBoundedNumber("rating", values.rating, 4),
      reviewCount: parseBoundedNumber("reviewCount", values.reviewCount),
      stars: parseBoundedNumber("stars", values.stars, 4),
      pricePerNight: roomPrice,
      originalPrice: roomOriginal,
      amenities: parseList(values.amenities),
      foodIncluded: values.foodIncluded,
      wifi: parseBoolean(values.wifi),
      parking: parseBoolean(values.parking),
      pool: parseBoolean(values.pool),
      gym: parseBoolean(values.gym),
      spa: parseBoolean(values.spa),
      petFriendly: parseBoolean(values.petFriendly),
      refundPolicy: values.refundPolicy,
      refundDescription: values.refundDescription,
      checkInTime: values.checkInTime,
      checkOutTime: values.checkOutTime,
      rooms: [
        {
          type: "Deluxe",
          price: roomPrice,
          originalPrice: roomOriginal,
          maxGuests: 2,
          bedType: "Queen",
          size: "280 sqft",
          available: 12,
        },
      ],
      offers: [],
      description: values.description,
      tags: parseList(values.tags),
    };
  }

  if (entity === "cabs") {
    const cabStands = parseList(values.cabStands || values.pickupPoints || values.dropPoints);
    return {
      carModel: values.carModel,
      brand: values.brand,
      type: values.type,
      image: values.image,
      seatingCapacity: parseBoundedNumber("seatingCapacity", values.seatingCapacity),
      fuelType: values.fuelType,
      ac: parseBoolean(values.ac),
      baseFare: parseBoundedNumber("baseFare", values.baseFare),
      pricePerKm: parseBoundedNumber("pricePerKm", values.pricePerKm),
      rating: parseBoundedNumber("rating", values.rating, 4),
      reviewCount: parseBoundedNumber("reviewCount", values.reviewCount),
      driverName: values.driverName,
      driverPhone: (values.driverPhone || "").replace(/\D/g, "").slice(0, 10),
      cabNumber: (values.cabNumber || "").trim().toUpperCase(),
      driverRating: parseBoundedNumber("driverRating", values.driverRating, 4),
      city: values.city,
      pickupPoints: cabStands,
      dropPoints: cabStands,
      distanceMatrix: parseDistanceMatrix(values.routeDistances),
      features: parseList(values.features),
      luggage: values.luggage,
      available: parseBoolean(values.available),
    };
  }

  return {
    title: values.title,
    city: values.city,
    country: values.country,
    durationDays: parseBoundedNumber("durationDays", values.durationDays),
    basePrice: parseBoundedNumber("basePrice", values.basePrice),
    discountPrice: values.discountPrice ? parseBoundedNumber("discountPrice", values.discountPrice) : undefined,
    heroImage: values.heroImage,
    images: parseList(values.images),
    description: values.description,
    tags: parseList(values.tags),
    inclusions: parseList(values.inclusions),
    exclusions: parseList(values.exclusions),
    hotel: values.hotel || undefined,
    hotelRating: values.hotelRating ? parseBoundedNumber("hotelRating", values.hotelRating) : undefined,
    food: parseList(values.food),
    transport: parseList(values.transport),
    activities: parseList(values.activities),
    highlights: parseList(values.highlights),
    bestSeason: values.bestSeason || undefined,
    groupSize: values.groupSize || undefined,
    tripType: values.tripType || undefined,
    hospitality: values.hospitality || undefined,
    documents: parseList(values.documents),
    guide: values.guideName
      ? {
        name: values.guideName,
        contact: values.guideContact,
        languages: parseList(values.guideLanguages),
        rating: values.guideRating ? parseBoundedNumber("guideRating", values.guideRating) : 4.5,
        experience: values.guideExperience,
        speciality: values.guideSpeciality,
        photo: values.guidePhoto,
        bio: values.guideBio,
      }
      : undefined,
    isActive: parseBoolean(values.isActive),
    offers: buildOffersFromCodes(values.offerCodes),
  };
};

const buildBulkPayload = (entity: InventoryEntity, values: EntityState) => {
  if (entity === "flights") {
    return {
      airline: values.airline || undefined,
      refundable: parseBoolean(values.refundable),
      rating: values.rating ? parseNumber(values.rating) : undefined,
      meals: parseBoolean(values.meals),
      aircraft: values.aircraft || undefined,
    };
  }

  if (entity === "trains") {
    return {
      name: values.name || undefined,
      type: values.type || undefined,
      daysOfWeek: values.daysOfWeek ? parseList(values.daysOfWeek) : undefined,
      rating: values.rating ? parseNumber(values.rating) : undefined,
    };
  }

  if (entity === "hotels") {
    return {
      rating: values.rating ? parseNumber(values.rating) : undefined,
      stars: values.stars ? parseNumber(values.stars) : undefined,
      amenities: values.amenities ? parseList(values.amenities) : undefined,
      wifi: parseBoolean(values.wifi),
      parking: parseBoolean(values.parking),
      pool: parseBoolean(values.pool),
      gym: parseBoolean(values.gym),
      spa: parseBoolean(values.spa),
      petFriendly: parseBoolean(values.petFriendly),
    };
  }

  if (entity === "cabs") {
    return {
      brand: values.brand || undefined,
      type: values.type || undefined,
      features: values.features ? parseList(values.features) : undefined,
      rating: values.rating ? parseNumber(values.rating) : undefined,
      available: parseBoolean(values.available),
      ac: parseBoolean(values.ac),
    };
  }

  return {
    country: values.country || undefined,
    basePrice: values.basePrice ? parseNumber(values.basePrice) : undefined,
    discountPrice: values.discountPrice ? parseNumber(values.discountPrice) : undefined,
    tags: values.tags ? parseList(values.tags) : undefined,
    inclusions: values.inclusions ? parseList(values.inclusions) : undefined,
    exclusions: values.exclusions ? parseList(values.exclusions) : undefined,
  };
};

const prefillFormValues = (entity: InventoryEntity, row: unknown, base: EntityState): EntityState => {
  if (!row || typeof row !== "object") return base;
  const record = row as Record<string, unknown>;
  const next: EntityState = { ...base };

  const getString = (value: unknown) => (value == null ? "" : String(value));
  const getBool = (value: unknown, fallback = "false") => (typeof value === "boolean" ? String(value) : fallback);
  const getList = (value: unknown) => (Array.isArray(value) ? value.map((entry) => String(entry)).join(",") : getString(value));

  if (entity === "flights") {
    next.flightCode = getString(record.flightCode) || next.flightCode;
    next.airline = getString(record.airline) || next.airline;
    next.from = getString(record.from) || next.from;
    next.fromCode = getString(record.fromCode) || next.fromCode;
    next.boardingAirport = getString(record.boardingAirport) || next.boardingAirport;
    next.boardingTerminal = getString(record.boardingTerminal) || next.boardingTerminal;
    next.boardingTime = getString(record.boardingTime) || next.boardingTime;
    next.to = getString(record.to) || next.to;
    next.toCode = getString(record.toCode) || next.toCode;
    next.departureTime = getString(record.departureTime) || next.departureTime;
    next.arrivalTime = getString(record.arrivalTime) || next.arrivalTime;
    next.duration = getString(record.duration) || next.duration;
    next.stops = getString(record.stops) || next.stops;
    next.stopCities = getList(record.stopCities) || next.stopCities;
    next.operatingDays = getList(record.operatingDays) || next.operatingDays;
    next.originalPrice = getString(record.originalPrice) || next.originalPrice;
    next.discountedPrice = getString(record.discountedPrice) || next.discountedPrice;
    const fare = (record.fare as Record<string, unknown>) || {};
    next.fareEconomy = getString(fare.economy) || next.fareEconomy;
    next.farePremiumEconomy = getString(fare.premiumEconomy) || next.farePremiumEconomy;
    next.fareBusiness = getString(fare.business) || next.fareBusiness;
    const baggage = (record.baggage as Record<string, unknown>) || {};
    next.baggageCabin = getString(baggage.cabin) || next.baggageCabin;
    next.baggageCheckin = getString(baggage.checkin) || next.baggageCheckin;
    next.seatsLeft = getString(record.seatsLeft) || next.seatsLeft;
    next.aircraft = getString(record.aircraft) || next.aircraft;
    next.meals = getBool(record.meals, next.meals);
    next.refundable = getBool(record.refundable, next.refundable);
    next.rating = getString(record.rating) || next.rating;
    return next;
  }

  if (entity === "trains") {
    next.trainNumber = getString(record.trainNumber) || next.trainNumber;
    next.name = getString(record.name) || next.name;
    next.from = getString(record.from) || next.from;
    next.fromCode = getString(record.fromCode) || next.fromCode;
    next.fromStationName = getString(record.fromStationName) || next.fromStationName;
    next.fromStationCode = getString(record.fromStationCode) || next.fromStationCode;
    next.to = getString(record.to) || next.to;
    next.toCode = getString(record.toCode) || next.toCode;
    next.toStationName = getString(record.toStationName) || next.toStationName;
    next.toStationCode = getString(record.toStationCode) || next.toStationCode;
    next.platformNumber = getString(record.platformNumber) || next.platformNumber;
    next.departureTime = getString(record.departureTime) || next.departureTime;
    next.arrivalTime = getString(record.arrivalTime) || next.arrivalTime;
    next.duration = getString(record.duration) || next.duration;
    next.daysOfWeek = getList(record.daysOfWeek) || next.daysOfWeek;
    next.pnr = getString(record.pnr) || next.pnr;
    const fare = (record.fare as Record<string, unknown>) || {};
    next.fareSleeper = getString(fare.sleeper) || next.fareSleeper;
    next.fareAc3 = getString(fare.ac3Tier) || next.fareAc3;
    next.fareAc2 = getString(fare.ac2Tier) || next.fareAc2;
    next.fareAc1 = getString(fare.ac1st) || next.fareAc1;
    const seats = (record.seatsAvailable as Record<string, unknown>) || {};
    next.seatsSleeper = getString(seats.sleeper) || next.seatsSleeper;
    next.seatsAc3 = getString(seats.ac3Tier) || next.seatsAc3;
    next.seatsAc2 = getString(seats.ac2Tier) || next.seatsAc2;
    next.seatsAc1 = getString(seats.ac1st) || next.seatsAc1;
    next.type = getString(record.type) || next.type;
    next.stops = getString(record.stops) || next.stops;
    next.rating = getString(record.rating) || next.rating;
    return next;
  }

  if (entity === "hotels") {
    next.name = getString(record.name) || next.name;
    next.city = getString(record.city) || next.city;
    next.address = getString(record.address) || next.address;
    next.image = getString(record.image) || next.image;
    next.images = getList(record.images) || next.images;
    next.rating = getString(record.rating) || next.rating;
    next.reviewCount = getString(record.reviewCount) || next.reviewCount;
    next.stars = getString(record.stars) || next.stars;
    next.pricePerNight = getString(record.pricePerNight) || next.pricePerNight;
    next.originalPrice = getString(record.originalPrice) || next.originalPrice;
    next.amenities = getList(record.amenities) || next.amenities;
    next.foodIncluded = getString(record.foodIncluded) || next.foodIncluded;
    next.wifi = getBool(record.wifi, next.wifi);
    next.parking = getBool(record.parking, next.parking);
    next.pool = getBool(record.pool, next.pool);
    next.gym = getBool(record.gym, next.gym);
    next.spa = getBool(record.spa, next.spa);
    next.petFriendly = getBool(record.petFriendly, next.petFriendly);
    next.refundPolicy = getString(record.refundPolicy) || next.refundPolicy;
    next.refundDescription = getString(record.refundDescription) || next.refundDescription;
    next.checkInTime = getString(record.checkInTime) || next.checkInTime;
    next.checkOutTime = getString(record.checkOutTime) || next.checkOutTime;
    next.description = getString(record.description) || next.description;
    next.tags = getList(record.tags) || next.tags;
    return next;
  }

  if (entity === "cabs") {
    next.carModel = getString(record.carModel) || next.carModel;
    next.brand = getString(record.brand) || next.brand;
    next.type = getString(record.type) || next.type;
    next.image = getString(record.image) || next.image;
    next.seatingCapacity = getString(record.seatingCapacity) || next.seatingCapacity;
    next.fuelType = getString(record.fuelType) || next.fuelType;
    next.ac = getBool(record.ac, next.ac);
    next.baseFare = getString(record.baseFare) || next.baseFare;
    next.pricePerKm = getString(record.pricePerKm) || next.pricePerKm;
    next.rating = getString(record.rating) || next.rating;
    next.reviewCount = getString(record.reviewCount) || next.reviewCount;
    next.driverName = getString(record.driverName) || next.driverName;
    next.driverPhone = getString(record.driverPhone) || next.driverPhone;
    next.cabNumber = getString(record.cabNumber) || next.cabNumber;
    next.driverRating = getString(record.driverRating) || next.driverRating;
    next.city = getString(record.city) || next.city;
    const pickupPoints = Array.isArray(record.pickupPoints) ? record.pickupPoints.map((entry) => String(entry)) : [];
    const dropPoints = Array.isArray(record.dropPoints) ? record.dropPoints.map((entry) => String(entry)) : [];
    const mergedStands = Array.from(new Set([...pickupPoints, ...dropPoints]));
    if (mergedStands.length) {
      next.cabStands = mergedStands.join(",");
    }
    next.features = getList(record.features) || next.features;
    next.luggage = getString(record.luggage) || next.luggage;
    next.available = getBool(record.available, next.available);
    return next;
  }

  next.title = getString(record.title) || next.title;
  next.city = getString(record.city) || next.city;
  next.country = getString(record.country) || next.country;
  next.durationDays = getString(record.durationDays) || next.durationDays;
  next.basePrice = getString(record.basePrice) || next.basePrice;
  next.discountPrice = getString(record.discountPrice) || next.discountPrice;
  next.heroImage = getString(record.heroImage) || next.heroImage;
  next.images = getList(record.images) || next.images;
  next.description = getString(record.description) || next.description;
  next.tags = getList(record.tags) || next.tags;
  next.inclusions = getList(record.inclusions) || next.inclusions;
  next.exclusions = getList(record.exclusions) || next.exclusions;
  const offerCodes = ((record.offers as Array<Record<string, unknown>> | undefined) || [])
    .map((offer) => String(offer?.code || "").trim())
    .filter(Boolean);
  if (offerCodes.length) {
    next.offerCodes = offerCodes.join(",");
  }
  return next;
};

export default function AdminInventoryPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  const [entity, setEntity] = useState<InventoryEntity>("flights");
  const [items, setItems] = useState<unknown[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [processingAction, setProcessingAction] = useState<"create" | "update" | "deactivate" | null>(null);
  const [activeModal, setActiveModal] = useState<"create" | "update" | "deactivate" | "details" | null>(null);
  const [selectedItem, setSelectedItem] = useState<unknown | null>(null);
  const [updateMode, setUpdateMode] = useState<"single" | "bulk">("single");
  const [bulkSelector, setBulkSelector] = useState("");
  const [displayCount, setDisplayCount] = useState(10);
  const [createTagDrafts, setCreateTagDrafts] = useState<EntityState>({});
  const [updateTagDrafts, setUpdateTagDrafts] = useState<EntityState>({});
  const [createValidationErrors, setCreateValidationErrors] = useState<EntityState>({});

  const selectedEntity = useMemo(() => ENTITY_CONFIGS.find((entry) => entry.id === entity)!, [entity]);
  const [createValues, setCreateValues] = useState<EntityState>(selectedEntity.createDefaults);
  const [updateValues, setUpdateValues] = useState<EntityState>(selectedEntity.createDefaults);
  const [targetId, setTargetId] = useState("");
  const [identifier, setIdentifier] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [hydrated, user?.role, router]);

  useEffect(() => {
    setCreateValues(selectedEntity.createDefaults);
    setUpdateValues(selectedEntity.createDefaults);
    setTargetId("");
    setIdentifier("");
    setItems([]);
    setActiveModal(null);
    setSelectedItem(null);
    setUpdateMode("single");
    setBulkSelector("");
    setDisplayCount(10);
    setCreateTagDrafts({});
    setUpdateTagDrafts({});
    setCreateValidationErrors({});
  }, [selectedEntity]);

  const setFieldValue = (kind: "create" | "update", key: string, value: string) => {
    if (kind === "create") {
      setCreateValues((prev) => ({ ...prev, [key]: value }));
      setCreateValidationErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    setUpdateValues((prev) => ({ ...prev, [key]: value }));
  };

  const validateCreateValues = (values: EntityState) => {
    const errors: EntityState = {};

    selectedEntity.createFields.forEach((field) => {
      if (!field.required || field.type === "checkbox") return;
      const rawValue = values[field.key] || "";

      if (isListField(field.key)) {
        if (parseList(rawValue).length === 0) {
          errors[field.key] = `${field.label} is required.`;
        }
        return;
      }

      if (!rawValue.trim()) {
        errors[field.key] = `${field.label} is required.`;
      }
    });

    return errors;
  };

  const refreshList = useCallback(async () => {
    try {
      setLoadingList(true);
      const result = await runWithDelay(listInventory(entity, { page: 1, limit: 60, includeInactive: true }));
      setItems(result.items);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : `Unable to fetch ${entity}.`);
    } finally {
      setLoadingList(false);
    }
  }, [entity]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const getIdentifierLabel = () => (entity === "flights" ? "flight code / id" : entity === "trains" ? "train number / id" : "item id");

  const resolveIdentifierToId = async (value: string): Promise<string> => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^[a-fA-F0-9]{24}$/.test(trimmed)) {
      return trimmed;
    }

    if (entity === "flights") {
      const matched = items.find((row) => {
        if (!row || typeof row !== "object") return false;
        const record = row as Record<string, unknown>;
        return String(record.flightCode ?? "").toLowerCase() === trimmed.toLowerCase();
      });
      const matchedId = extractId(matched);
      if (matchedId) return matchedId;

      const details = await getFlightByIdentifier(trimmed);
      return extractId(details);
    }

    if (entity === "trains") {
      const matched = items.find((row) => {
        if (!row || typeof row !== "object") return false;
        const record = row as Record<string, unknown>;
        return String(record.trainNumber ?? "").toLowerCase() === trimmed.toLowerCase();
      });
      const matchedId = extractId(matched);
      if (matchedId) return matchedId;

      const details = await getTrainByIdentifier(trimmed);
      return extractId(details);
    }

    return trimmed;
  };

  const getBulkHint = () => {
    if (entity === "flights") return "Bulk selector matches airline (example: Indigo)";
    if (entity === "trains") return "Bulk selector matches train type/name (example: Express)";
    if (entity === "hotels") return "Bulk selector matches city/hotel name (example: Goa)";
    if (entity === "cabs") return "Bulk selector matches city/brand/model (example: Mumbai)";
    return "Bulk selector matches city/title/country (example: Goa)";
  };

  const matchesBulk = (row: unknown, query: string): boolean => {
    if (!row || typeof row !== "object") return false;
    const record = row as Record<string, unknown>;
    const q = query.toLowerCase().trim();
    if (!q) return false;

    if (entity === "flights") {
      return String(record.airline ?? "").toLowerCase().includes(q);
    }
    if (entity === "trains") {
      return `${String(record.type ?? "")} ${String(record.name ?? "")}`.toLowerCase().includes(q);
    }
    if (entity === "hotels") {
      return `${String(record.city ?? "")} ${String(record.name ?? "")}`.toLowerCase().includes(q);
    }
    if (entity === "cabs") {
      return `${String(record.city ?? "")} ${String(record.brand ?? "")} ${String(record.carModel ?? "")}`.toLowerCase().includes(q);
    }
    return `${String(record.city ?? "")} ${String(record.title ?? "")} ${String(record.country ?? "")}`.toLowerCase().includes(q);
  };

  const flattenForDetails = (value: unknown, prefix = "", depth = 0): Array<{ label: string; value: string }> => {
    if (value == null) return [];

    if (Array.isArray(value)) {
      if (value.length === 0) return [{ label: prefix || "list", value: "-" }];
      const primitive = value.every((entry) => typeof entry !== "object" || entry == null);
      if (primitive) {
        return [{ label: prefix || "list", value: value.map((entry) => String(entry)).join(", ") }];
      }

      return value.flatMap((entry, index) => flattenForDetails(entry, `${prefix}[${index + 1}]`, depth + 1));
    }

    if (typeof value === "object") {
      return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
        flattenForDetails(nested, prefix ? `${prefix}.${key}` : key, depth + 1),
      );
    }

    return [{ label: prefix || "value", value: String(value) }];
  };

  const isListField = (key: string) => LIST_FIELD_KEYS.has(key);

  const addTagValue = (kind: "create" | "update", key: string, value: string) => {
    const nextValue = value.trim();
    if (!nextValue) return;

    const source = kind === "create" ? createValues : updateValues;
    const current = parseList(source[key] || "");
    if (current.some((entry) => entry.toLowerCase() === nextValue.toLowerCase())) {
      return;
    }

    setFieldValue(kind, key, [...current, nextValue].join(","));
    if (kind === "create") {
      setCreateTagDrafts((prev) => ({ ...prev, [key]: "" }));
    } else {
      setUpdateTagDrafts((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const removeTagValue = (kind: "create" | "update", key: string, value: string) => {
    const source = kind === "create" ? createValues : updateValues;
    const next = parseList(source[key] || "");
    const idx = next.findIndex((entry) => entry.toLowerCase() === value.toLowerCase());
    if (idx >= 0) next.splice(idx, 1);
    setFieldValue(kind, key, next.join(","));
  };

  const renderField = (kind: "create" | "update", field: EntityField, value: string, errorText?: string) => {
    if (field.type === "checkbox") {
      return (
        <label key={field.key} className={styles.checkboxField}>
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => setFieldValue(kind, field.key, e.target.checked ? "true" : "false")}
          />
          <span>{field.label}</span>
        </label>
      );
    }

    if (isListField(field.key)) {
      const tags = parseList(value || "");
      const draftMap = kind === "create" ? createTagDrafts : updateTagDrafts;
      const setDraft = kind === "create" ? setCreateTagDrafts : setUpdateTagDrafts;
      const draft = draftMap[field.key] || "";

      return (
        <div key={field.key} className={styles.field}>
          <span>{field.label}{field.required ? " *" : ""}</span>
          <div className={styles.tagEditor}>
            <div className={styles.tagList}>
              {tags.map((tag) => (
                <button type="button" key={tag} className={styles.tagPill} onClick={() => removeTagValue(kind, field.key, tag)}>
                  {tag} ×
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder={field.placeholder || "Type and press Enter"}
              value={draft}
              onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTagValue(kind, field.key, draft);
                }
              }}
            />
            {errorText ? <small style={{ color: "#b42318" }}>{errorText}</small> : null}
          </div>
        </div>
      );
    }

    return (
      <label key={field.key} className={styles.field}>
        <span>{field.label}{field.required ? " *" : ""}</span>
        <input
          type={field.type === "number" ? "number" : "text"}
          value={value}
          placeholder={field.placeholder}
          min={field.type === "number" ? NUMBER_LIMITS[field.key]?.min : undefined}
          max={field.type === "number" ? NUMBER_LIMITS[field.key]?.max : undefined}
          step={field.type === "number" ? "1" : undefined}
          onChange={(e) => setFieldValue(kind, field.key, e.target.value)}
        />
        {errorText ? <small style={{ color: "#b42318" }}>{errorText}</small> : null}
      </label>
    );
  };

  const summarizeCard = (row: unknown): Array<{ label: string; value: string }> => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;

    if (entity === "flights") {
      return [
        { label: "Code", value: String(record.flightCode ?? "-") },
        { label: "Route", value: `${String(record.from ?? "-")} -> ${String(record.to ?? "-")}` },
        { label: "Fare", value: `Rs ${String(record.discountedPrice ?? record.originalPrice ?? "-")}` },
        { label: "Seats", value: String(record.seatsLeft ?? "-") },
      ];
    }

    if (entity === "trains") {
      return [
        { label: "Number", value: String(record.trainNumber ?? "-") },
        { label: "Route", value: `${String(record.from ?? "-")} -> ${String(record.to ?? "-")}` },
        { label: "Type", value: String(record.type ?? "-") },
        { label: "Rating", value: String(record.rating ?? "-") },
      ];
    }

    if (entity === "hotels") {
      return [
        { label: "City", value: String(record.city ?? "-") },
        { label: "Stars", value: String(record.stars ?? "-") },
        { label: "Nightly", value: `Rs ${String(record.pricePerNight ?? "-")}` },
        { label: "Rating", value: String(record.rating ?? "-") },
      ];
    }

    if (entity === "cabs") {
      return [
        { label: "City", value: String(record.city ?? "-") },
        { label: "Vehicle", value: `${String(record.brand ?? "-")} ${String(record.carModel ?? "")}`.trim() },
        { label: "Fare", value: `Rs ${String(record.baseFare ?? "-")}` },
        { label: "Available", value: String(record.available ?? "-") },
      ];
    }

    return [
      { label: "City", value: String(record.city ?? "-") },
      { label: "Duration", value: `${String(record.durationDays ?? "-")} days` },
      { label: "Price", value: `Rs ${String(record.basePrice ?? "-")}` },
      { label: "Country", value: String(record.country ?? "-") },
    ];
  };

  const createItem = async () => {
    const validationErrors = validateCreateValues(createValues);
    if (Object.keys(validationErrors).length > 0) {
      setCreateValidationErrors(validationErrors);
      showToast.error("Please fix validation errors before creating the item.");
      return;
    }

    try {
      setProcessingAction("create");
      const payload = buildCreatePayload(entity, createValues);
      await runWithDelay(createInventory(entity, payload));
      showToast.success(`${selectedEntity.label.slice(0, -1)} created successfully.`);
      setActiveModal(null);
      await refreshList();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : `Unable to create ${entity}.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const updateItem = async () => {
    try {
      setProcessingAction("update");
      const payload = updateMode === "single"
        ? buildCreatePayload(entity, updateValues)
        : buildBulkPayload(entity, updateValues);
      if (updateMode === "single") {
        const resolvedId = await runWithDelay(resolveIdentifierToId(targetId));
        if (!resolvedId) {
          showToast.error(`Enter a valid ${getIdentifierLabel()} to update.`);
          return;
        }

        await runWithDelay(updateInventory(entity, resolvedId, payload));
        showToast.success(`${selectedEntity.label.slice(0, -1)} updated successfully.`);
      } else {
        const allowed = BULK_ALLOWED_FIELDS[entity];
        if (allowed.length === 0) {
          showToast.error("Bulk update is not configured for this entity.");
          return;
        }

        const targets = items
          .map((row) => ({ id: extractId(row), row }))
          .filter((entry) => Boolean(entry.id) && matchesBulk(entry.row, bulkSelector));

        if (targets.length === 0) {
          showToast.error("No records matched your bulk selector.");
          return;
        }

        const outcomes = await Promise.allSettled(
          targets.map((entry) => runWithDelay(updateInventory(entity, entry.id, payload))),
        );
        const successCount = outcomes.filter((entry) => entry.status === "fulfilled").length;
        showToast.success(`Updated ${successCount}/${targets.length} ${entity}.`);
      }

      setActiveModal(null);
      await refreshList();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : `Unable to update ${entity}.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const deactivateItem = async () => {
    try {
      setProcessingAction("deactivate");
      const resolvedId = await runWithDelay(resolveIdentifierToId(targetId));
      if (!resolvedId) {
        showToast.error(`Enter a valid ${getIdentifierLabel()} to deactivate.`);
        return;
      }

      await runWithDelay(deactivateInventory(entity, resolvedId));
      showToast.success(`${selectedEntity.label.slice(0, -1)} deactivated successfully.`);
      setActiveModal(null);
      await refreshList();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : `Unable to deactivate ${entity}.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const reactivateItem = async (value: string) => {
    try {
      setProcessingAction("update");
      const resolvedId = await runWithDelay(resolveIdentifierToId(value));
      if (!resolvedId) {
        showToast.error(`Enter a valid ${getIdentifierLabel()} to reactivate.`);
        return;
      }

      await runWithDelay(reactivateInventory(entity, resolvedId));
      showToast.success(`${selectedEntity.label.slice(0, -1)} reactivated successfully.`);
      await refreshList();
      setActiveModal(null);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : `Unable to reactivate ${entity}.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const fetchByIdentifier = async () => {
    if (!(entity === "flights" || entity === "trains")) return;

    try {
      setLoadingList(true);
      const item =
        entity === "flights"
          ? await runWithDelay(getFlightByIdentifier(identifier))
          : await runWithDelay(getTrainByIdentifier(identifier));

      setItems([item]);
      showToast.success(`Fetched ${entity.slice(0, -1)} details.`);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : `Unable to fetch ${entity.slice(0, -1)} details.`);
    } finally {
      setLoadingList(false);
    }
  };

  if (!hydrated || user?.role !== "admin") return null;

  const visibleItems = items.slice(0, displayCount);
  const hasMoreItems = displayCount < items.length;
  const updateFieldsForMode = updateMode === "single"
    ? selectedEntity.createFields
    : selectedEntity.createFields.filter((field) => BULK_ALLOWED_FIELDS[entity].includes(field.key));
  const modalRoot = typeof document !== "undefined" ? document.body : null;

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Control Center</p>
          <h1>Premium Inventory Management</h1>
          <p>
            Auto-loaded listings with focused modals for create, update, deactivate, and rich details.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button type="button" onClick={() => setActiveModal("create")} className={styles.primaryBtn}>Create New</button>
          <button type="button" onClick={() => setActiveModal("update")} className={styles.secondaryBtn}>Update</button>
          <button type="button" onClick={() => setActiveModal("deactivate")} className={styles.ghostDangerBtn}>Deactivate</button>
          <button type="button" onClick={refreshList} className={styles.secondaryBtn} disabled={loadingList}>
            {loadingList ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <MediaUploader defaultFolder="inventory/general" />

      <div className={styles.entityTabs}>
        {ENTITY_CONFIGS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setEntity(entry.id)}
            className={entry.id === entity ? styles.activeTab : styles.tab}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {(entity === "flights" || entity === "trains") && (
        <div className={styles.quickFetch}>
          <div>
            <h3>Quick Lookup</h3>
            <p>Fetch a specific {entity.slice(0, -1)} using code/number or id.</p>
          </div>
          <div className={styles.quickFetchForm}>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={entity === "flights" ? "BT-201 or id" : "12999 or id"}
            />
            <button type="button" onClick={fetchByIdentifier} disabled={loadingList || !identifier.trim()} className={styles.secondaryBtn}>
              Fetch Details
            </button>
          </div>
        </div>
      )}

      <div className={styles.listHeader}>
        <h3>Live {selectedEntity.label}</h3>
        <span>{loadingList ? "Loading..." : `${visibleItems.length}/${items.length} records`}</span>
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>No records available right now for {selectedEntity.label}. Try refreshing.</div>
      ) : (
        <div className={styles.cardGrid}>
          {visibleItems.map((item) => {
            const record = item as Record<string, unknown>;
            const id = extractId(item);
            const isInactive = record.isActive === false;
            const title =
              entity === "flights"
                ? String(record.flightCode ?? "Flight")
                : entity === "trains"
                  ? String(record.name ?? record.trainNumber ?? "Train")
                  : entity === "hotels"
                    ? String(record.name ?? "Hotel")
                    : entity === "cabs"
                      ? String(record.carModel ?? "Cab")
                      : String(record.title ?? "Tour");

            const subtitle =
              entity === "flights"
                ? String(record.airline ?? "")
                : entity === "trains"
                  ? String(record.type ?? "")
                  : entity === "hotels"
                    ? String(record.address ?? "")
                    : entity === "cabs"
                      ? String(record.city ?? "")
                      : `${String(record.city ?? "")}, ${String(record.country ?? "")}`;

            return (
              <article key={id || JSON.stringify(item).slice(0, 40)} className={`${styles.card} ${isInactive ? styles.cardInactive : ""}`}>
                <div className={styles.cardTop}>
                  <div>
                    <h4>{title}</h4>
                    <p>{subtitle}</p>
                  </div>
                  <span className={`${styles.cardId} ${isInactive ? styles.cardInactiveTag : ""}`}>
                    {isInactive ? "Inactive" : "Active"} • ID: {id || "N/A"}
                  </span>
                </div>

                <div className={styles.metaGrid}>
                  {summarizeCard(item).map((entry) => (
                    <div key={entry.label} className={styles.metaItem}>
                      <span>{entry.label}</span>
                      <strong>{entry.value}</strong>
                    </div>
                  ))}
                </div>

                <div className={styles.cardActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => {
                    setSelectedItem(item);
                    setActiveModal("details");
                  }}>
                    More Details
                  </button>
                  <button type="button" className={styles.primaryBtn} onClick={() => {
                    setTargetId(id);
                    setUpdateMode("single");
                    setUpdateValues(prefillFormValues(entity, item, selectedEntity.createDefaults));
                    setActiveModal("update");
                  }} disabled={isInactive}>
                    Update
                  </button>
                  {isInactive ? (
                    <button type="button" className={styles.reactivateBtn} onClick={() => void reactivateItem(id)}>
                      Reactivate
                    </button>
                  ) : (
                    <button type="button" className={styles.ghostDangerBtn} onClick={() => {
                      setTargetId(id);
                      setActiveModal("deactivate");
                    }}>
                      Deactivate
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasMoreItems && (
        <div className={styles.loadMoreWrap}>
          <button type="button" className={styles.secondaryBtn} onClick={() => setDisplayCount((prev) => prev + 6)}>
            Load More
          </button>
        </div>
      )}

      {modalRoot && activeModal && createPortal(<div className={styles.backdrop} onClick={() => setActiveModal(null)} />, modalRoot)}

      {modalRoot && activeModal === "create" && createPortal((
        <div className={styles.modal}>
          <div className={styles.modalHead}>
            <h3>Create {selectedEntity.label.slice(0, -1)}</h3>
            <button type="button" onClick={() => setActiveModal(null)}>Close</button>
          </div>
          <div className={styles.formGrid}>
            {selectedEntity.createFields.map((field) => {
              const value = createValues[field.key] ?? "";
              return renderField("create", field, value, createValidationErrors[field.key]);
            })}
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.primaryBtn} onClick={createItem} disabled={processingAction === "create"}>
              {processingAction === "create" ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      ), modalRoot)}

      {modalRoot && activeModal === "update" && createPortal((
        <div className={styles.modal}>
          <div className={styles.modalHead}>
            <h3>Update {selectedEntity.label}</h3>
            <button type="button" onClick={() => setActiveModal(null)}>Close</button>
          </div>

          <div className={styles.modeSwitch}>
            <button type="button" onClick={() => setUpdateMode("single")} className={updateMode === "single" ? styles.modeActive : styles.modeBtn}>Single</button>
            <button type="button" onClick={() => setUpdateMode("bulk")} className={updateMode === "bulk" ? styles.modeActive : styles.modeBtn}>Bulk</button>
          </div>

          {updateMode === "single" ? (
            <label className={styles.field}>
              <span>Target ({getIdentifierLabel()})</span>
              <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Enter id/code/number" />
            </label>
          ) : (
            <label className={styles.field}>
              <span>Bulk selector</span>
              <input value={bulkSelector} onChange={(e) => setBulkSelector(e.target.value)} placeholder={getBulkHint()} />
            </label>
          )}

          {updateMode === "bulk" && (
            <p className={styles.bulkHint}>Bulk edits affect shared brand-level fields only. Capacity/seat-level values stay single-item updates.</p>
          )}

          <div className={styles.formGrid}>
            {updateFieldsForMode.map((field) => {
              const value = updateValues[field.key] ?? "";
              return renderField("update", field, value);
            })}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.primaryBtn} onClick={updateItem} disabled={processingAction === "update"}>
              {processingAction === "update" ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      ), modalRoot)}

      {modalRoot && activeModal === "deactivate" && createPortal((
        <div className={styles.modal}>
          <div className={styles.modalHead}>
            <h3>Deactivate {selectedEntity.label.slice(0, -1)}</h3>
            <button type="button" onClick={() => setActiveModal(null)}>Close</button>
          </div>
          <label className={styles.field}>
            <span>Target ({getIdentifierLabel()})</span>
            <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Enter id/code/number" />
          </label>
          <div className={styles.modalActions}>
            <button type="button" className={styles.ghostDangerBtn} onClick={deactivateItem} disabled={processingAction === "deactivate"}>
              {processingAction === "deactivate" ? "Deactivating..." : "Deactivate"}
            </button>
          </div>
        </div>
      ), modalRoot)}

      {modalRoot && activeModal === "details" && selectedItem !== null && createPortal((
        <div className={styles.modal}>
          <div className={styles.modalHead}>
            <h3>{selectedEntity.label.slice(0, -1)} details</h3>
            <button type="button" onClick={() => setActiveModal(null)}>Close</button>
          </div>
          <div className={styles.detailsGrid}>
            {flattenForDetails(selectedItem).map((entry) => (
              <div key={`${entry.label}-${entry.value}`} className={styles.detailsItem}>
                <span>{entry.label}</span>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={(selectedItem as Record<string, unknown>).isActive === false}
              onClick={() => {
                setTargetId(extractId(selectedItem));
                setUpdateMode("single");
                setUpdateValues(prefillFormValues(entity, selectedItem, selectedEntity.createDefaults));
                setActiveModal("update");
              }}
            >
              Update
            </button>
            {(selectedItem as Record<string, unknown>).isActive === false ? (
              <button type="button" className={styles.reactivateBtn} onClick={() => void reactivateItem(extractId(selectedItem))}>
                Reactivate
              </button>
            ) : (
              <button
                type="button"
                className={styles.ghostDangerBtn}
                onClick={() => {
                  setTargetId(extractId(selectedItem));
                  setActiveModal("deactivate");
                }}
              >
                Deactivate
              </button>
            )}
          </div>
        </div>
      ), modalRoot)}
    </section>
  );
}
