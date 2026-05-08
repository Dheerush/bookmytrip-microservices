"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Hotel, Train, Package, Car, Eye, Download, Filter, X, MapPin, Calendar, Users, CreditCard, Ban } from "lucide-react";
import { showToast } from "@/lib/toast";
import { getApiErrorMessage, getAuthHeaders, parseApiResponse } from "@/lib/http";
import styles from "./BookingHistory.module.scss";

type BookingType = "all" | "flight" | "hotel" | "train" | "cab" | "package";
type BookingStatus = "confirmed" | "completed" | "cancelled" | "pending" | "failed";

interface Passenger {
  name: string;
  age?: number;
  gender?: string;
  email?: string;
  seatNumber?: string;
}

interface BookingContact {
  name: string;
  email: string;
  phone: string;
}

interface PackageTravelOption {
  id?: string;
  label?: string;
  amount?: number;
  meta?: string;
}

interface PackageTravelerPlan {
  travelerName?: string;
  travelerEmail?: string;
  currentLocation?: string;
  travelMode?: string;
  selectedOption?: PackageTravelOption | null;
}

interface PackageTravelMetadata {
  currentLocation?: string;
  destinationCity?: string;
  travelMode?: string;
  selectedOption?: PackageTravelOption | null;
  travelerPlans?: PackageTravelerPlan[];
}

interface CabTravelMetadata {
  pickup?: string;
  drop?: string;
  pickupCity?: string;
  dropCity?: string;
  distanceKm?: number;
  driverName?: string;
  driverPhone?: string;
  cabNumber?: string;
}

interface TrainPassengerBerth {
  name?: string;
  seatNumber?: string;
  coach?: string;
  berthNumber?: string;
  berthType?: string;
}

interface TrainTravelMetadata {
  berthPreference?: string;
  seatClass?: string;
  platformNumber?: string;
  trainFromStationName?: string;
  trainFromStationCode?: string;
  trainToStationName?: string;
  trainToStationCode?: string;
  passengerBerths?: TrainPassengerBerth[];
}

interface FlightTravelMetadata {
  boardingAirport?: string;
  destinationAirport?: string;
  boardingTerminal?: string;
}

interface BookingMetadata {
  packageTravel?: PackageTravelMetadata;
  cabTravel?: CabTravelMetadata;
  trainTravel?: TrainTravelMetadata;
  flightTravel?: FlightTravelMetadata;
  berthPreference?: string;
  seatClass?: string;
  platformNumber?: string;
  trainFromStationName?: string;
  trainFromStationCode?: string;
  trainToStationName?: string;
  trainToStationCode?: string;
  passengerBerths?: TrainPassengerBerth[];
  [key: string]: unknown;
}

interface Booking {
  id: string;
  _id?: string;
  type: "flight" | "hotel" | "train" | "cab" | "package" | "tour";
  title: string;
  bookingDate?: string;
  startDate?: string;
  endDate?: string;
  scheduleTime?: string;
  createdAt?: string;
  status: BookingStatus;
  amount: number;
  bookingRef: string;
  fromCode?: string;
  toCode?: string;
  quantity?: number;
  contact?: BookingContact;
  passengers?: Passenger[];
  city?: string;
  metadata?: BookingMetadata;
}

interface BookingApiItem {
  _id?: string;
  id?: string;
  type: Booking["type"];
  title: string;
  bookingDate?: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
  scheduleTime?: string;
  status: BookingStatus;
  amount: number;
  bookingRef: string;
  fromCode?: string;
  toCode?: string;
  quantity?: number;
  contact?: BookingContact;
  passengers?: Passenger[];
  city?: string;
  metadata?: BookingMetadata;
}

const SAMPLE_BOOKINGS: Booking[] = [
  { id: "1", type: "flight", title: "Delhi (DEL) → Goa (GOI)", bookingDate: "15 Mar 2026", status: "confirmed", amount: 8500, bookingRef: "BMT-FL-2026031501", fromCode: "DEL", toCode: "GOI", quantity: 1, passengers: [{ name: "Rahul Sharma", age: 28, gender: "male" }], contact: { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210" } },
  { id: "2", type: "hotel", title: "Taj Vivanta, Panaji, Goa", bookingDate: "15 Mar 2026", status: "confirmed", amount: 22000, bookingRef: "BMT-HT-2026031502", quantity: 2, passengers: [{ name: "Rahul Sharma", age: 28 }, { name: "Priya Sharma", age: 26 }], contact: { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210" } },
  { id: "3", type: "flight", title: "Mumbai (BOM) → Jaipur (JAI)", bookingDate: "28 Feb 2026", status: "completed", amount: 5200, bookingRef: "BMT-FL-2026022801", fromCode: "BOM", toCode: "JAI", quantity: 1, passengers: [{ name: "Rahul Sharma", age: 28 }], contact: { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210" } },
  { id: "4", type: "train", title: "Rajdhani Express – Delhi to Mumbai", bookingDate: "20 Jan 2026", status: "completed", amount: 2800, bookingRef: "BMT-TR-2026012001", fromCode: "NDLS", toCode: "BCT", quantity: 2, passengers: [{ name: "Rahul Sharma", age: 28 }, { name: "Ankur Gupta", age: 32 }], contact: { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210" } },
  { id: "5", type: "package", title: "Manali Adventure (3N/4D)", bookingDate: "10 Dec 2025", status: "completed", amount: 35000, bookingRef: "BMT-PK-2025121001", quantity: 3, contact: { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210" } },
  { id: "6", type: "hotel", title: "The Oberoi, Jaipur", bookingDate: "01 Nov 2025", status: "cancelled", amount: 18500, bookingRef: "BMT-HT-2025110101", quantity: 1, contact: { name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210" } },
];

const TYPE_FILTERS: { label: string; value: BookingType; icon: React.ReactNode }[] = [
  { label: "All", value: "all", icon: <Filter size={13} strokeWidth={1.6} /> },
  { label: "Flights", value: "flight", icon: <Plane size={13} strokeWidth={1.6} /> },
  { label: "Cabs", value: "cab", icon: <Car size={13} strokeWidth={1.6} /> },
  { label: "Hotels", value: "hotel", icon: <Hotel size={13} strokeWidth={1.6} /> },
  { label: "Trains", value: "train", icon: <Train size={13} strokeWidth={1.6} /> },
  { label: "Packages", value: "package", icon: <Package size={13} strokeWidth={1.6} /> },
];

const typeIcon = (type: string) => {
  switch (type) {
    case "flight": return <Plane size={16} strokeWidth={1.5} />;
    case "cab": return <Car size={16} strokeWidth={1.5} />;
    case "hotel": return <Hotel size={16} strokeWidth={1.5} />;
    case "train": return <Train size={16} strokeWidth={1.5} />;
    case "tour": return <Package size={16} strokeWidth={1.5} />;
    case "package": return <Package size={16} strokeWidth={1.5} />;
    default: return <Plane size={16} strokeWidth={1.5} />;
  }
};

const REFUND_PCTS: Record<string, number> = { flight: 60, train: 70, cab: 80, hotel: 65, tour: 50, package: 50 };

const getRefundPct = (type: string, startDate?: string): number => {
  if (!startDate) return 0;
  const hoursUntil = (new Date(startDate).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 24) return 0;
  return REFUND_PCTS[type] ?? 60;
};

const parseTrainBerth = (seatNumber?: string) => {
  const seat = (seatNumber || "").trim();
  const match = seat.match(/^([A-Za-z]\d+)\/(\d+)$/);
  if (!match) {
    return { coach: "", berthNumber: "", berthType: "" };
  }
  const coach = match[1] || "";
  const berthNumber = match[2] || "";
  const berth = Number(berthNumber);
  const berthType = [1, 4, 7].includes(berth)
    ? "Lower"
    : [2, 5, 8].includes(berth)
      ? "Middle"
      : [3, 6].includes(berth)
        ? "Upper"
        : "";
  return { coach, berthNumber, berthType };
};

const titleCase = (value?: string) => {
  if (!value) return "";
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (ch) => ch.toUpperCase());
};

export default function BookingHistoryPage() {
  const [filter, setFilter] = useState<BookingType>("all");
  const [bookings, setBookings] = useState<Booking[]>(SAMPLE_BOOKINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null); // bookingId being cancelled

  const cancelBookingWithRefund = async (booking: Booking) => {
    const bookingId = booking._id || booking.id;
    const refundPct = getRefundPct(booking.type, booking.startDate);
    const refundAmount = Math.floor(booking.amount * refundPct / 100);
    const confirmMsg = refundPct > 0
      ? `Cancel this booking?\nYou will receive a refund of ₹${refundAmount.toLocaleString('en-IN')} (${refundPct}% of ₹${booking.amount.toLocaleString('en-IN')}).`
      : `Cancel this booking?\nNo refund will be issued as travel is within 24 hours.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setCancelling(bookingId);

      // 1. Cancel the booking
      const cancelRes = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by customer' }),
      });
      if (!cancelRes.ok) throw new Error('Failed to cancel booking');

      // 2. If eligible for refund, find the payment and trigger refund
      if (refundAmount > 0) {
        try {
          const paymentsRes = await fetch(`/api/payments/booking/${bookingId}`, { headers: getAuthHeaders() });
          if (paymentsRes.ok) {
            const paymentsData = await paymentsRes.json();
            const items: Array<{ _id: string; status: string }> = paymentsData?.data?.payments ?? paymentsData?.data?.items ?? [];
            const succeeded = items.find((p) => p.status === 'succeeded');
            if (succeeded) {
              await fetch(`/api/payments/${succeeded._id}/refund`, {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Cancelled by customer' }),
              });
            }
          }
        } catch { /* refund best-effort — booking is already cancelled */ }
      }

      // 3. Update local state
      setBookings((prev) => prev.map((b) =>
        (b._id || b.id) === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b
      ));
      if (detailBooking && (detailBooking._id || detailBooking.id) === bookingId) {
        setDetailBooking((prev) => prev ? { ...prev, status: 'cancelled' as BookingStatus } : prev);
      }

      showToast.success(
        refundAmount > 0
          ? `Booking cancelled. Refund of ₹${refundAmount.toLocaleString('en-IN')} will be processed in 5–7 business days.`
          : 'Booking cancelled successfully. No refund applicable.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel booking.';
      showToast.error(msg);
    } finally {
      setCancelling(null);
    }
  };

  const openBookingDetail = async (booking: Booking) => {
    // If we already have full details (passengers/contact), open directly
    if (booking.passengers !== undefined || booking.contact !== undefined) {
      setDetailBooking(booking);
      return;
    }

    // Otherwise fetch from API
    const bookingId = booking._id || booking.id;
    if (!bookingId) { setDetailBooking(booking); return; }

    try {
      setDetailLoading(true);
      setDetailBooking(booking); // open modal with partial data while loading
      const res = await fetch(`/api/bookings/${bookingId}`, { headers: getAuthHeaders() });
      const parsed = await parseApiResponse<BookingApiItem>(res, 'Unable to load booking details.');
      if (parsed.ok && parsed.payload?.data) {
        const b = parsed.payload.data;
        setDetailBooking((prev) => prev ? {
          ...prev,
          fromCode: b.fromCode,
          toCode: b.toCode,
          startDate: b.startDate,
          endDate: b.endDate,
          scheduleTime: b.scheduleTime,
          quantity: b.quantity,
          contact: b.contact,
          passengers: b.passengers,
          city: b.city,
          metadata: b.metadata,
        } : prev);
      }
    } catch { /* keep partial data */ } finally {
      setDetailLoading(false);
    }
  };

  const downloadInvoice = (booking: Booking) => {
    const win = window.open("", "_blank");
    if (!win) {
      showToast.error("Please allow pop-ups to download the invoice.");
      return;
    }
    const dateStr = booking.startDate
      ? new Date(booking.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) +
        (booking.scheduleTime ? ` at ${booking.scheduleTime}` : "")
      : booking.bookingDate || "—";
    const issuedOn = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const gst = Math.round(booking.amount * 0.05);
    const baseAmount = booking.amount - gst;
    const routeInfo = [booking.fromCode, booking.toCode].filter(Boolean).join(" → ") || booking.city || "N/A";
    const packageTravel = booking.metadata?.packageTravel;
    const cabTravel = booking.metadata?.cabTravel;
    const flightTravel = booking.metadata?.flightTravel;
    const hotelStay = booking.metadata?.hotelStay;
    const trainStationFrom = booking.metadata?.trainFromStationName
      ? `${booking.metadata.trainFromStationName}${booking.metadata.trainFromStationCode ? ` (${booking.metadata.trainFromStationCode})` : ""}`
      : "";
    const trainStationTo = booking.metadata?.trainToStationName
      ? `${booking.metadata.trainToStationName}${booking.metadata.trainToStationCode ? ` (${booking.metadata.trainToStationCode})` : ""}`
      : "";
    const trainStations = [trainStationFrom, trainStationTo].filter(Boolean).join(" → ");
    const showCabNumber = booking.status === "confirmed" || booking.status === "completed";
    const packageTravelInfo = packageTravel
      ? [
          packageTravel.currentLocation && `From ${packageTravel.currentLocation}`,
          packageTravel.destinationCity && `To ${packageTravel.destinationCity}`,
          packageTravel.travelMode && `By ${packageTravel.travelMode}`,
          packageTravel.selectedOption?.label,
          packageTravel.selectedOption?.meta,
        ].filter(Boolean).join(" • ")
      : "";
    const cabRouteInfo = cabTravel
      ? [
          cabTravel.pickup && `Pickup: ${cabTravel.pickup}${cabTravel.pickupCity ? ` (${cabTravel.pickupCity})` : ""}`,
          cabTravel.drop && `Drop: ${cabTravel.drop}${cabTravel.dropCity ? ` (${cabTravel.dropCity})` : ""}`,
        ].filter(Boolean).join(" • ")
      : "";
    const cabTravelBullets = cabTravel
      ? [
          cabTravel.pickup && `Pickup: ${cabTravel.pickup}${cabTravel.pickupCity ? ` (${cabTravel.pickupCity})` : ""}`,
          cabTravel.drop && `Drop: ${cabTravel.drop}${cabTravel.dropCity ? ` (${cabTravel.dropCity})` : ""}`,
          cabTravel.distanceKm && `Distance: ${cabTravel.distanceKm} km`,
          cabTravel.driverName && `Driver: ${cabTravel.driverName}`,
          showCabNumber && cabTravel.cabNumber && `Cab Number: ${cabTravel.cabNumber}`,
          (cabTravel.driverPhone || booking.type === "cab") && `Driver Contact: ${cabTravel.driverPhone || "+91-81XXXXXXX"}`,
        ].filter(Boolean)
      : [];
    const seatColumnTitle = booking.type === "train" ? "Berth" : "Seat";
    const showSeatColumn = booking.type !== "hotel";
    const hotelPerks = [
      ...(Array.isArray(hotelStay?.amenities) ? hotelStay.amenities : []),
      ...(Array.isArray(hotelStay?.perks) ? hotelStay.perks : []),
      ...(Array.isArray(booking.metadata?.hotelPerks) ? booking.metadata.hotelPerks : []),
    ].map((item) => String(item).trim()).filter(Boolean);
    const hotelDetails = booking.type === "hotel"
      ? [
          hotelStay?.roomType && `Room Type: ${hotelStay.roomType}`,
          hotelStay?.roomNumber && `Room Number: ${hotelStay.roomNumber}`,
          hotelStay?.address && `Hotel Address: ${hotelStay.address}`,
          booking.startDate && `Check-in: ${new Date(booking.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}${hotelStay?.checkInTime ? `, ${hotelStay.checkInTime}` : ""}`,
          booking.endDate && `Check-out: ${new Date(booking.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}${hotelStay?.checkOutTime ? `, ${hotelStay.checkOutTime}` : ""}`,
          (hotelStay?.nights || booking.quantity) && `Nights: ${hotelStay?.nights || booking.quantity}`,
          hotelStay?.roomsBooked && `Rooms: ${hotelStay.roomsBooked}`,
        ].filter(Boolean)
      : [];
    const flightDetails = booking.type === "flight"
      ? [
          flightTravel?.boardingAirport && `Boarding: ${flightTravel.boardingAirport}`,
          flightTravel?.destinationAirport && `Destination: ${flightTravel.destinationAirport}`,
          (flightTravel?.boardingTerminal || booking.metadata?.boardingTerminal) && `Terminal: ${flightTravel?.boardingTerminal || booking.metadata?.boardingTerminal}`,
        ].filter(Boolean).join(" • ")
      : "";
    const travelerRows = (booking.passengers || []).length > 0
      ? (booking.passengers || []).map((p, idx) => {
        const travelerPlan = booking.metadata?.packageTravel?.travelerPlans?.[idx];
        const travelerCommute = travelerPlan
          ? [
              travelerPlan.currentLocation ? `From ${travelerPlan.currentLocation}` : "",
              travelerPlan.travelMode ? `By ${travelerPlan.travelMode}` : "",
              travelerPlan.selectedOption?.label || "",
              travelerPlan.selectedOption?.meta || "",
            ].filter(Boolean).join(" • ")
          : "";
        const parsed = parseTrainBerth(p.seatNumber);
        const seatValue = booking.type === "train"
          ? [
              p.seatNumber || "—",
              parsed.coach ? `Coach ${parsed.coach}` : "",
              parsed.berthType || "",
            ].filter(Boolean).join(" · ")
          : p.seatNumber || "—";
        return `<tr><td>${idx + 1}</td><td>${p.name || "—"}</td>${showSeatColumn ? `<td>${seatValue}</td>` : ""}<td>${p.age ?? "—"}</td><td style="text-transform:capitalize">${p.gender || "—"}</td><td>${p.email || "—"}</td>${booking.type === "tour" ? `<td>${travelerCommute || "—"}</td>` : ""}</tr>`;
      }).join("")
      : `<tr><td>1</td><td>${booking.contact?.name || "Primary traveler"}</td>${showSeatColumn ? "<td>—</td>" : ""}<td>—</td><td>—</td><td>${booking.contact?.email || "—"}</td>${booking.type === "tour" ? "<td>—</td>" : ""}</tr>`;

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice — ${booking.bookingRef}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; background: #f7f8fc; color: #0f1f2e; }
    .page { max-width: 720px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 32px rgba(0,0,0,0.10); overflow: hidden; }
    .header { background: #0b1929; color: #fff; padding: 32px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.5px; }
    .brand span { color: #3b9edd; }
    .invoice-label { text-align: right; }
    .invoice-label h2 { font-size: 1.1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; }
    .invoice-label p { font-size: 0.85rem; opacity: 0.6; margin-top: 4px; }
    .body { padding: 36px 40px; }
    .meta-row { display: flex; gap: 40px; margin-bottom: 32px; flex-wrap: wrap; }
    .meta-block label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7f93; display: block; margin-bottom: 4px; }
    .meta-block p { font-weight: 600; color: #0f1f2e; }
    .status { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; text-transform: capitalize;
      background: ${booking.status === "confirmed" || booking.status === "completed" ? "#d1fae5" : booking.status === "cancelled" ? "#fee2e2" : "#fef3c7"};
      color: ${booking.status === "confirmed" || booking.status === "completed" ? "#065f46" : booking.status === "cancelled" ? "#991b1b" : "#92400e"}; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    thead tr { background: #f1f5f9; }
    th { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7f93; padding: 10px 14px; text-align: left; }
    td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .amount-col { text-align: right; }
    .total-row td { border-top: 2px solid #e2e8f0; border-bottom: none; font-weight: 700; font-size: 1rem; }
    .traveler-table th, .traveler-table td { font-size: 0.82rem; }
    .footer { background: #f8fafc; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #6b7f93; }
    @media print { body { background: #fff; } .page { box-shadow: none; margin: 0; border-radius: 0; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">Book<span>My</span>Trip</div>
    <div class="invoice-label">
      <h2>Tax Invoice</h2>
      <p>Issued: ${issuedOn}</p>
    </div>
  </div>
  <div class="body">
    <div class="meta-row">
      <div class="meta-block"><label>Booking Reference</label><p>${booking.bookingRef}</p></div>
      <div class="meta-block"><label>Type</label><p style="text-transform:capitalize">${booking.type}</p></div>
      ${booking.type === "tour" ? `<div class="meta-block"><label>Package</label><p>${booking.title}</p></div>` : ""}
      <div class="meta-block"><label>Travel Date</label><p>${dateStr}</p></div>
      <div class="meta-block"><label>Route / City</label><p>${cabRouteInfo || routeInfo}</p></div>
      <div class="meta-block"><label>Status</label><span class="status">${booking.status}</span></div>
    </div>
    ${booking.contact ? `<div class="meta-row"><div class="meta-block"><label>Billed To</label><p>${booking.contact.name}</p><p style="font-weight:400;font-size:0.85rem">${booking.contact.email} · ${booking.contact.phone}</p></div></div>` : ""}
    ${booking.type === "train" ? `<div class="meta-row"><div class="meta-block"><label>Train Details</label><p style="font-weight:500;font-size:0.88rem">${[
      trainStations && `Stations: ${trainStations}`,
      booking.metadata?.platformNumber && `Platform: ${booking.metadata.platformNumber}`,
      booking.metadata?.seatClass && `Class: ${titleCase(String(booking.metadata.seatClass))}`,
      booking.metadata?.berthPreference && `Preference: ${titleCase(String(booking.metadata.berthPreference))}`,
    ].filter(Boolean).join(" • ") || "—"}</p></div></div>` : ""}
    ${flightDetails ? `<div class="meta-row"><div class="meta-block"><label>Flight Details</label><p style="font-weight:500;font-size:0.88rem">${flightDetails}</p></div></div>` : ""}
    ${hotelDetails.length > 0 ? `<div class="meta-row"><div class="meta-block"><label>Hotel Stay Details</label><ul style="margin:0;padding-left:18px;font-size:0.88rem;line-height:1.55;color:#0f1f2e;font-weight:500">${hotelDetails.map((item) => `<li>${item}</li>`).join("")}</ul></div></div>` : ""}
    ${hotelPerks.length > 0 ? `<div class="meta-row"><div class="meta-block"><label>Perks & Amenities</label><p style="font-weight:500;font-size:0.88rem">${hotelPerks.join(" • ")}</p></div></div>` : ""}
    ${packageTravelInfo ? `<div class="meta-row"><div class="meta-block"><label>Package Commute</label><p style="font-weight:500;font-size:0.88rem">${packageTravelInfo}</p></div></div>` : ""}
    ${cabTravelBullets.length > 0 ? `<div class="meta-row"><div class="meta-block"><label>Cab Details</label><ul style="margin:0;padding-left:18px;font-size:0.88rem;line-height:1.55;color:#0f1f2e;font-weight:500">${cabTravelBullets.map((item) => `<li>${item}</li>`).join("")}</ul></div></div>` : ""}
    <table>
      <thead><tr><th>Description</th><th>Qty</th><th class="amount-col">Amount</th></tr></thead>
      <tbody>
        <tr><td>${booking.title}</td><td>${booking.quantity ?? 1}</td><td class="amount-col">₹${baseAmount.toLocaleString("en-IN")}</td></tr>
        <tr><td>GST (5%)</td><td>—</td><td class="amount-col">₹${gst.toLocaleString("en-IN")}</td></tr>
      </tbody>
      <tfoot>
        <tr class="total-row"><td colspan="2">Total Paid</td><td class="amount-col">₹${booking.amount.toLocaleString("en-IN")}</td></tr>
      </tfoot>
    </table>
    <div class="meta-row" style="margin-top:8px;margin-bottom:8px">
      <div class="meta-block"><label>Traveler Details</label></div>
    </div>
    <table class="traveler-table">
      <thead><tr><th>#</th><th>Name</th>${showSeatColumn ? `<th>${seatColumnTitle}</th>` : ""}<th>Age</th><th>Gender</th><th>Email</th>${booking.type === "tour" ? "<th>Commute</th>" : ""}</tr></thead>
      <tbody>${travelerRows}</tbody>
    </table>
    <p style="font-size:0.78rem;color:#6b7f93">This is a computer-generated invoice and does not require a signature.</p>
  </div>
  <div class="footer">
    <span>BookMyTrip · support@bookmytrip.app</span>
    <span>Thank you for travelling with us.</span>
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`);
    win.document.close();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const pendingRef = params.get("pending");
    const errParam = params.get("error");

    if (success) {
      showToast.success(`Booking confirmed! Ref: ${success}`);
      params.delete("success");
    }
    if (pendingRef) {
      showToast.info(`Booking created (payment pending): ${pendingRef}`);
      params.delete("pending");
    }
    if (errParam) {
      showToast.error(`Payment failed for: ${errParam}`);
      params.delete("error");
    }
    if (success || pendingRef || errParam) {
      const next = params.toString();
      window.history.replaceState({}, "", next ? `?${next}` : window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/bookings/me', { headers: getAuthHeaders() });
        const parsed = await parseApiResponse<{ bookings?: BookingApiItem[] }>(
          res,
          'Unable to load bookings right now.',
        );

        if (!parsed.ok || !parsed.payload) {
          throw new Error(getApiErrorMessage(parsed));
        }

        const data = parsed.payload;
        // Transform API response to match component interface
        const transformedBookings = (data.data?.bookings || []).map((b) => ({
          id: b._id || b.id || b.bookingRef,
          _id: b._id,
          type: b.type,
          title: b.title,
          bookingDate: b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-IN') : '',
          startDate: b.startDate,
          endDate: b.endDate,
          scheduleTime: b.scheduleTime,
          createdAt: b.createdAt,
          status: b.status,
          amount: b.amount,
          bookingRef: b.bookingRef,
          fromCode: b.fromCode,
          toCode: b.toCode,
          quantity: b.quantity,
          contact: b.contact,
          passengers: b.passengers,
          city: b.city,
          metadata: b.metadata,
        }));
        setBookings(transformedBookings.length > 0 ? transformedBookings : SAMPLE_BOOKINGS);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load bookings.';
        showToast.error(message);
        setBookings(SAMPLE_BOOKINGS);
        setError(message);
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filtered =
    filter === "all"
      ? bookings
      : bookings.filter((booking) => {
        if (filter === "package") {
          return booking.type === "package" || booking.type === "tour";
        }
        return booking.type === filter;
      });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Booking History</h1>
        <p className={styles.subtitle}>View and manage all your past and upcoming bookings</p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {TYPE_FILTERS.map((f) => (
          <motion.button
            key={f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.active : ""}`}
            onClick={() => setFilter(f.value)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            {f.icon}
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span className={styles.colType}>Type</span>
          <span className={styles.colTitle}>Booking</span>
          <span className={styles.colDate}>Date</span>
          <span className={styles.colRef}>Reference</span>
          <span className={styles.colStatus}>Status</span>
          <span className={styles.colAmount}>Amount</span>
          <span className={styles.colActions}>Actions</span>
        </div>
        {loading ? (
          <div className={styles.empty}>Loading bookings...</div>
        ) : error ? (
          <div className={styles.empty}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No bookings found for this category.</div>
        ) : (
          filtered.map((booking, i) => (
            <motion.div
              key={booking.id}
              className={styles.row}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <span className={styles.colType}>
                <span className={styles.typeIcon}>{typeIcon(booking.type)}</span>
              </span>
              <span className={styles.colTitle}>{booking.title}</span>
              <span className={styles.colDate}>{booking.bookingDate || 'N/A'}</span>
              <span className={styles.colRef}>{booking.bookingRef}</span>
              <span className={styles.colStatus}>
                <span className={`${styles.statusBadge} ${styles[booking.status]}`}>{booking.status}</span>
              </span>
              <span className={styles.colAmount}>₹{booking.amount.toLocaleString('en-IN')}</span>
              <span className={styles.colActions}>
                <button className={styles.actionBtn} title="View Details" onClick={() => openBookingDetail(booking)}><Eye size={14} strokeWidth={1.6} /></button>
                {booking.status !== 'failed' && booking.status !== 'pending' && (
                  <button className={styles.actionBtn} title="Download Invoice" onClick={() => downloadInvoice(booking)}><Download size={14} strokeWidth={1.6} /></button>
                )}
                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <button
                    className={`${styles.actionBtn} ${styles.cancelBtn}`}
                    title="Cancel Booking"
                    onClick={() => cancelBookingWithRefund(booking)}
                    disabled={cancelling === (booking._id || booking.id)}
                  >
                    <Ban size={14} strokeWidth={1.6} />
                  </button>
                )}
              </span>
            </motion.div>
          ))
        )}
      </div>

      {/* ── Booking Detail Modal ── */}
      <AnimatePresence>
        {detailBooking && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailBooking(null)}
          >
            <motion.div
              className={styles.modalPanel}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>Booking Details</h2>
                  <p className={styles.modalRef}>{detailBooking.bookingRef}</p>
                </div>
                <button className={styles.modalClose} onClick={() => setDetailBooking(null)} aria-label="Close">
                  <X size={16} strokeWidth={1.6} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {detailLoading && <p className={styles.modalLoading}>Loading details...</p>}

                {/* Title + Status */}
                <div className={styles.modalRow}>
                  <span className={styles.typeIcon} style={{ flexShrink: 0 }}>{typeIcon(detailBooking.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className={styles.modalBookingTitle}>{detailBooking.title}</p>
                    <span className={`${styles.statusBadge} ${styles[detailBooking.status]}`}>{detailBooking.status}</span>
                  </div>
                </div>

                {/* Route */}
                {(detailBooking.fromCode || detailBooking.toCode || detailBooking.city) && (
                  <div className={styles.modalSection}>
                    <p className={styles.modalSectionLabel}><MapPin size={12} /> Route / Location</p>
                    <p className={styles.modalSectionValue}>
                      {detailBooking.type === "cab" && detailBooking.metadata?.cabTravel
                        ? [
                            detailBooking.metadata.cabTravel.pickup && `Pickup: ${detailBooking.metadata.cabTravel.pickup}${detailBooking.metadata.cabTravel.pickupCity ? ` (${detailBooking.metadata.cabTravel.pickupCity})` : ""}`,
                            detailBooking.metadata.cabTravel.drop && `Drop: ${detailBooking.metadata.cabTravel.drop}${detailBooking.metadata.cabTravel.dropCity ? ` (${detailBooking.metadata.cabTravel.dropCity})` : ""}`,
                          ].filter(Boolean).join(" • ")
                        : detailBooking.fromCode && detailBooking.toCode
                        ? `${detailBooking.fromCode} → ${detailBooking.toCode}`
                        : detailBooking.city || "—"}
                    </p>
                  </div>
                )}

                {detailBooking.metadata?.packageTravel && (
                  <div className={styles.modalSection}>
                    <p className={styles.modalSectionLabel}><MapPin size={12} /> Package Commute</p>
                    <p className={styles.modalSectionValue}>
                      {[
                        detailBooking.metadata.packageTravel.currentLocation && `From ${detailBooking.metadata.packageTravel.currentLocation}`,
                        detailBooking.metadata.packageTravel.destinationCity && `To ${detailBooking.metadata.packageTravel.destinationCity}`,
                        detailBooking.metadata.packageTravel.travelMode && `By ${detailBooking.metadata.packageTravel.travelMode}`,
                        detailBooking.metadata.packageTravel.selectedOption?.label,
                        detailBooking.metadata.packageTravel.selectedOption?.meta,
                      ].filter(Boolean).join(" • ") || "—"}
                    </p>
                  </div>
                )}

                {detailBooking.metadata?.cabTravel && (
                  <div className={styles.modalSection}>
                    <p className={styles.modalSectionLabel}><MapPin size={12} /> Cab Details</p>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                      {detailBooking.metadata.cabTravel.pickup ? (
                        <li>{`Pickup: ${detailBooking.metadata.cabTravel.pickup}${detailBooking.metadata.cabTravel.pickupCity ? ` (${detailBooking.metadata.cabTravel.pickupCity})` : ""}`}</li>
                      ) : null}
                      {detailBooking.metadata.cabTravel.drop ? (
                        <li>{`Drop: ${detailBooking.metadata.cabTravel.drop}${detailBooking.metadata.cabTravel.dropCity ? ` (${detailBooking.metadata.cabTravel.dropCity})` : ""}`}</li>
                      ) : null}
                      {detailBooking.metadata.cabTravel.distanceKm ? <li>{`Distance: ${detailBooking.metadata.cabTravel.distanceKm} km`}</li> : null}
                      {detailBooking.metadata.cabTravel.driverName ? <li>{`Driver: ${detailBooking.metadata.cabTravel.driverName}`}</li> : null}
                      {(detailBooking.status === "confirmed" || detailBooking.status === "completed") && detailBooking.metadata.cabTravel.cabNumber ? (
                        <li>{`Cab Number: ${detailBooking.metadata.cabTravel.cabNumber}`}</li>
                      ) : null}
                      {(detailBooking.metadata.cabTravel.driverPhone || detailBooking.type === "cab") ? (
                        <li>{`Driver Contact: ${detailBooking.metadata.cabTravel.driverPhone || "+91-81XXXXXXX"}`}</li>
                      ) : null}
                    </ul>
                  </div>
                )}

                {detailBooking.type === "train" && (
                  <div className={styles.modalSection}>
                    <p className={styles.modalSectionLabel}><MapPin size={12} /> Train Details</p>
                    <p className={styles.modalSectionValue}>
                      {[
                        detailBooking.metadata?.trainFromStationName
                          ? `${detailBooking.metadata.trainFromStationName}${detailBooking.metadata.trainFromStationCode ? ` (${detailBooking.metadata.trainFromStationCode})` : ""}`
                          : "",
                        detailBooking.metadata?.trainToStationName
                          ? `${detailBooking.metadata.trainToStationName}${detailBooking.metadata.trainToStationCode ? ` (${detailBooking.metadata.trainToStationCode})` : ""}`
                          : "",
                      ].filter(Boolean).join(" → ") || "—"}
                    </p>
                    <p className={styles.modalSectionValue} style={{ marginTop: 4 }}>
                      {[
                        detailBooking.metadata?.platformNumber ? `Platform ${detailBooking.metadata.platformNumber}` : "",
                        detailBooking.metadata?.seatClass ? `Class ${titleCase(String(detailBooking.metadata.seatClass))}` : "",
                        detailBooking.metadata?.berthPreference ? `Preference ${titleCase(String(detailBooking.metadata.berthPreference))}` : "",
                      ].filter(Boolean).join(" • ") || "—"}
                    </p>
                  </div>
                )}

                {detailBooking.type === "flight" && (
                  <div className={styles.modalSection}>
                    <p className={styles.modalSectionLabel}><MapPin size={12} /> Flight Details</p>
                    <p className={styles.modalSectionValue}>
                      {[
                        detailBooking.metadata?.flightTravel?.boardingAirport
                          ? `Boarding: ${detailBooking.metadata.flightTravel.boardingAirport}`
                          : "",
                        detailBooking.metadata?.flightTravel?.destinationAirport
                          ? `Destination: ${detailBooking.metadata.flightTravel.destinationAirport}`
                          : "",
                        (detailBooking.metadata?.flightTravel?.boardingTerminal || detailBooking.metadata?.boardingTerminal)
                          ? `Terminal ${detailBooking.metadata?.flightTravel?.boardingTerminal || detailBooking.metadata?.boardingTerminal}`
                          : "",
                      ].filter(Boolean).join(" • ") || "—"}
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className={styles.modalSection}>
                  <p className={styles.modalSectionLabel}><Calendar size={12} /> Travel Date</p>
                  <p className={styles.modalSectionValue}>
                    {detailBooking.startDate
                      ? new Date(detailBooking.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : detailBooking.bookingDate || "—"}
                    {detailBooking.scheduleTime ? ` at ${detailBooking.scheduleTime}` : ""}
                    {detailBooking.endDate
                      ? ` → ${new Date(detailBooking.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                      : ""}
                  </p>
                </div>

                {/* Travellers */}
                {detailBooking.passengers && detailBooking.passengers.length > 0 && (
                  <div className={styles.modalSection}>
                    <p className={styles.modalSectionLabel}><Users size={12} /> Traveller{detailBooking.passengers.length > 1 ? "s" : ""}</p>
                    <div className={styles.passengerList}>
                      {detailBooking.passengers.map((p, idx) => (
                        (() => {
                          const travelerPlan = detailBooking.metadata?.packageTravel?.travelerPlans?.[idx];
                          const travelerCommute = travelerPlan
                            ? [
                                travelerPlan.currentLocation ? `From ${travelerPlan.currentLocation}` : "",
                                travelerPlan.travelMode ? `By ${travelerPlan.travelMode}` : "",
                                travelerPlan.selectedOption?.label || "",
                                travelerPlan.selectedOption?.meta || "",
                              ].filter(Boolean).join(" • ")
                            : "";
                          return (
                        <div key={idx} className={styles.passengerRow}>
                          <span className={styles.passengerNum}>{idx + 1}</span>
                          <span className={styles.passengerName}>{p.name}</span>
                          {p.seatNumber && (
                            <span className={styles.passengerMeta}>
                              {detailBooking.type === "train" ? "Berth" : "Seat"} {p.seatNumber}
                            </span>
                          )}
                          {detailBooking.type === "train" && p.seatNumber ? (() => {
                            const parsed = parseTrainBerth(p.seatNumber);
                            const meta = [parsed.coach ? `Coach ${parsed.coach}` : "", parsed.berthType].filter(Boolean).join(" · ");
                            return meta ? <span className={styles.passengerMeta}>{meta}</span> : null;
                          })() : null}
                          {p.age != null && <span className={styles.passengerMeta}>Age {p.age}</span>}
                          {p.gender && <span className={styles.passengerMeta}>{p.gender}</span>}
                          {p.email && <span className={styles.passengerEmail}>{p.email}</span>}
                          {detailBooking.type === "tour" && travelerCommute && <span className={styles.passengerMeta}>{travelerCommute}</span>}
                        </div>
                          );
                        })()
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                {detailBooking.contact && (
                  <div className={styles.modalSection}>
                    <p className={styles.modalSectionLabel}>Contact Details</p>
                    <p className={styles.modalSectionValue}>{detailBooking.contact.name} · {detailBooking.contact.email} · {detailBooking.contact.phone}</p>
                  </div>
                )}

                {/* Amount */}
                <div className={styles.modalSection}>
                  <p className={styles.modalSectionLabel}><CreditCard size={12} /> {detailBooking.status === 'failed' ? 'Payment Status' : 'Amount Paid'}</p>
                  {detailBooking.status === 'failed'
                    ? <p className={styles.modalSectionValue} style={{ color: '#b85c5c', fontWeight: 600 }}>Payment Failed — no charge</p>
                    : <p className={styles.modalAmountValue}>₹{detailBooking.amount.toLocaleString("en-IN")}</p>
                  }
                </div>

                {/* Refund info for eligible bookings */}
                {(detailBooking.status === 'confirmed' || detailBooking.status === 'pending') && (() => {
                  const pct = getRefundPct(detailBooking.type, detailBooking.startDate);
                  const amt = Math.floor(detailBooking.amount * pct / 100);
                  return (
                    <div className={styles.modalRefundRow}>
                      <span className={styles.modalRefundLabel}>
                        {pct > 0 ? `Cancellation refund: ₹${amt.toLocaleString('en-IN')} (${pct}%)` : 'No refund — travel within 24 hours'}
                      </span>
                      <button
                        className={styles.modalCancelBtn}
                        onClick={() => { setDetailBooking(null); cancelBookingWithRefund(detailBooking); }}
                        disabled={cancelling === (detailBooking._id || detailBooking.id)}
                      >
                        <Ban size={13} strokeWidth={1.6} />
                        {cancelling === (detailBooking._id || detailBooking.id) ? 'Cancelling…' : 'Cancel Booking'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
