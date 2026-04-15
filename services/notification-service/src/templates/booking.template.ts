interface BookingPassenger {
  name: string;
  age?: number;
  gender?: string;
  seatNumber?: string;
}

interface BookingContact {
  name: string;
  email: string;
  phone: string;
}

interface BookingTemplateInput {
  bookingRef: string;
  title: string;
  type?: string;
  status: 'confirmed' | 'cancelled';
  amount: number;
  startDate?: string;
  scheduleTime?: string;
  fromCode?: string;
  toCode?: string;
  boardingAirport?: string;
  destinationAirport?: string;
  boardingTerminal?: string;   // flight terminal
  platformNumber?: string;    // train platform
  seatClass?: string;         // economy / sleeper / ac3Tier etc.
  berthPreference?: string;
  trainFromStationName?: string;
  trainFromStationCode?: string;
  trainToStationName?: string;
  trainToStationCode?: string;
  currentLocation?: string;
  destinationCity?: string;
  packageTravelMode?: string;
  packageTravelDetails?: string;
  cabPickup?: string;
  cabDrop?: string;
  cabPickupCity?: string;
  cabDropCity?: string;
  cabDistanceKm?: number;
  cabDriverName?: string;
  cabDriverPhone?: string;
  cabNumber?: string;
  contact?: BookingContact;
  passengers?: BookingPassenger[];
}

const classLabel: Record<string, string> = {
  economy: 'Economy',
  premiumEconomy: 'Premium Economy',
  business: 'Business',
  sleeper: 'Sleeper',
  ac3Tier: 'AC 3-Tier',
  ac2Tier: 'AC 2-Tier',
  ac1st: 'AC First Class',
};

export const bookingTemplate = ({
  bookingRef,
  title,
  type,
  status,
  amount,
  startDate,
  scheduleTime,
  fromCode,
  toCode,
  boardingAirport,
  destinationAirport,
  boardingTerminal,
  platformNumber,
  seatClass,
  berthPreference,
  trainFromStationName,
  trainFromStationCode,
  trainToStationName,
  trainToStationCode,
  currentLocation,
  destinationCity,
  packageTravelMode,
  packageTravelDetails,
  cabPickup,
  cabDrop,
  cabPickupCity,
  cabDropCity,
  cabDistanceKm,
  cabDriverName,
  cabDriverPhone,
  cabNumber,
  contact,
  passengers = [],
}: BookingTemplateInput): string => {
  const isConfirmed = status === 'confirmed';
  const heading = isConfirmed ? '✈ Booking Confirmed' : '✖ Booking Cancelled';
  const accentColor = isConfirmed ? '#1e90ff' : '#c0392b';
  const badgeBg = isConfirmed ? '#e8f4fd' : '#fde8e8';

  const formattedDate = startDate
    ? new Date(startDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const formattedTime = scheduleTime || null;
  const routeLabel = fromCode && toCode ? `${fromCode} → ${toCode}` : null;
  const terminalLabel = boardingTerminal ? `Terminal ${boardingTerminal}` : platformNumber ? `Platform ${platformNumber}` : null;
  const classLabelStr = seatClass ? (classLabel[seatClass] || seatClass) : null;
  const seatColumnLabel = type === 'train' ? 'Berth' : 'Seat';
  const trainStations = type === 'train'
    ? [
      trainFromStationName && `${trainFromStationName}${trainFromStationCode ? ` (${trainFromStationCode})` : ''}`,
      trainToStationName && `${trainToStationName}${trainToStationCode ? ` (${trainToStationCode})` : ''}`,
    ].filter(Boolean).join(' → ')
    : null;
  const berthPrefLabel = berthPreference
    ? berthPreference.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (ch) => ch.toUpperCase())
    : null;
  const gst = Math.round(amount * 0.05);
  const base = amount - gst;
  const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Travel';

  const passengerRows = passengers.length > 0
    ? passengers.map((p, idx) => `
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:10px 12px;font-size:0.88rem;color:#0f1f2e">${idx + 1}</td>
        <td style="padding:10px 12px;font-size:0.88rem;font-weight:500;color:#0f1f2e">${p.name || '—'}</td>
        <td style="padding:10px 12px;font-size:0.88rem;color:#6b7f93">${p.age ?? '—'}</td>
        <td style="padding:10px 12px;font-size:0.88rem;color:#6b7f93;text-transform:capitalize">${p.gender || '—'}</td>
        <td style="padding:10px 12px;font-size:0.88rem;color:#1e90ff;font-weight:600">${p.seatNumber || '—'}</td>
      </tr>`).join('')
    : `<tr><td colspan="5" style="padding:12px;font-size:0.85rem;color:#6b7f93;text-align:center">No passenger details available</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Booking ${isConfirmed ? 'Confirmed' : 'Cancelled'} — ${bookingRef}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f0f4f8;padding:30px 0">
    <tr><td align="center">
      <table width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#0b1929;padding:28px 36px">
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="color:#ffffff;font-size:1.5rem;font-weight:700;letter-spacing:-0.5px">
                  Book<span style="color:#3b9edd">My</span>Trip
                </td>
                <td align="right" style="color:#8aadc4;font-size:0.8rem;line-height:1.5">
                  ${typeLabel} Booking<br/>#${bookingRef}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Status Banner -->
        <tr>
          <td style="background:${accentColor};padding:16px 36px">
            <p style="margin:0;color:#ffffff;font-size:1.15rem;font-weight:600">${heading}</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:0.85rem">
              ${isConfirmed ? 'Your booking is confirmed. Have a great trip!' : 'Your booking has been cancelled as requested.'}
            </p>
          </td>
        </tr>

        <!-- Trip Summary -->
        <tr>
          <td style="padding:28px 36px 0">
            <p style="margin:0 0 16px;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#6b7f93;font-weight:600">TRIP DETAILS</p>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8edf2;border-radius:10px;overflow:hidden">
              <tr style="background:#f8fafc">
                <td colspan="2" style="padding:14px 18px;font-size:0.95rem;font-weight:600;color:#0f1f2e">${title}</td>
              </tr>
              ${routeLabel ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93;width:140px">Route</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${routeLabel}</td>
              </tr>` : ''}
              ${boardingAirport && type === 'flight' ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Boarding Airport</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${boardingAirport}</td>
              </tr>` : ''}
              ${destinationAirport && type === 'flight' ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Destination Airport</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${destinationAirport}</td>
              </tr>` : ''}
              ${formattedDate ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Travel Date</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${formattedDate}${formattedTime ? ` at ${formattedTime}` : ''}</td>
              </tr>` : ''}
              ${terminalLabel ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">${boardingTerminal ? 'Terminal' : 'Platform'}</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${terminalLabel}</td>
              </tr>` : ''}
              ${classLabelStr ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Class</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${classLabelStr}</td>
              </tr>` : ''}
              ${berthPrefLabel && type === 'train' ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Berth Preference</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${berthPrefLabel}</td>
              </tr>` : ''}
              ${trainStations ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Stations</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${trainStations}</td>
              </tr>` : ''}
              ${currentLocation ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Current Location</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${currentLocation}</td>
              </tr>` : ''}
              ${destinationCity ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Package Destination</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${destinationCity}</td>
              </tr>` : ''}
              ${packageTravelMode ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Commute Mode</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e;text-transform:capitalize">${packageTravelMode}</td>
              </tr>` : ''}
              ${packageTravelDetails ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Commute Option</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${packageTravelDetails}</td>
              </tr>` : ''}
              ${cabPickup ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Cab Pickup</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${cabPickup}${cabPickupCity ? ` (${cabPickupCity})` : ''}</td>
              </tr>` : ''}
              ${cabDrop ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Cab Drop</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${cabDrop}${cabDropCity ? ` (${cabDropCity})` : ''}</td>
              </tr>` : ''}
              ${cabDistanceKm ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Distance</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${cabDistanceKm} km</td>
              </tr>` : ''}
              ${cabDriverName ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Driver Name</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${cabDriverName}</td>
              </tr>` : ''}
              ${cabNumber ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Cab Number</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:700;color:#0f1f2e;letter-spacing:0.05em">${cabNumber}</td>
              </tr>` : ''}
              ${(cabDriverPhone || type === 'cab') ? `<tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Driver Contact</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:600;color:#0f1f2e">${cabDriverPhone || '+91-81XXXXXXX'}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Booking Ref</td>
                <td style="padding:10px 18px;font-size:0.88rem;font-weight:700;color:#1e90ff">${bookingRef}</td>
              </tr>
              <tr>
                <td style="padding:10px 18px;font-size:0.82rem;color:#6b7f93">Status</td>
                <td style="padding:10px 18px">
                  <span style="display:inline-block;background:${badgeBg};color:${accentColor};font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:3px 10px;border-radius:20px">${status}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${passengers.length > 0 ? `
        <!-- Passengers -->
        <tr>
          <td style="padding:24px 36px 0">
            <p style="margin:0 0 12px;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#6b7f93;font-weight:600">TRAVELLERS (${passengers.length})</p>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8edf2;border-radius:10px;overflow:hidden;border-collapse:collapse">
              <thead>
                <tr style="background:#f1f5f9">
                  <th style="padding:10px 12px;text-align:left;font-size:0.72rem;color:#6b7f93;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">#</th>
                  <th style="padding:10px 12px;text-align:left;font-size:0.72rem;color:#6b7f93;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Name</th>
                  <th style="padding:10px 12px;text-align:left;font-size:0.72rem;color:#6b7f93;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Age</th>
                  <th style="padding:10px 12px;text-align:left;font-size:0.72rem;color:#6b7f93;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Gender</th>
                  <th style="padding:10px 12px;text-align:left;font-size:0.72rem;color:#6b7f93;text-transform:uppercase;letter-spacing:0.06em;font-weight:600">${seatColumnLabel}</th>
                </tr>
              </thead>
              <tbody>${passengerRows}</tbody>
            </table>
          </td>
        </tr>` : ''}

        ${contact ? `
        <!-- Contact -->
        <tr>
          <td style="padding:20px 36px 0">
            <p style="margin:0 0 10px;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#6b7f93;font-weight:600">CONTACT DETAILS</p>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8edf2;border-radius:10px;overflow:hidden">
              <tr>
                <td style="padding:12px 18px;font-size:0.88rem;color:#0f1f2e">
                  <strong>${contact.name}</strong> &nbsp;·&nbsp; ${contact.email} &nbsp;·&nbsp; ${contact.phone}
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ''}

        <!-- Amount -->
        <tr>
          <td style="padding:20px 36px 0">
            <p style="margin:0 0 10px;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:#6b7f93;font-weight:600">FARE SUMMARY</p>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8edf2;border-radius:10px;overflow:hidden;border-collapse:collapse">
              <tr style="background:#f8fafc">
                <td style="padding:10px 18px;font-size:0.85rem;color:#6b7f93">Base Fare</td>
                <td align="right" style="padding:10px 18px;font-size:0.85rem;color:#0f1f2e">₹${base.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding:10px 18px;font-size:0.85rem;color:#6b7f93">GST (5%)</td>
                <td align="right" style="padding:10px 18px;font-size:0.85rem;color:#0f1f2e">₹${gst.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="background:#f0f8ff;border-top:2px solid #e8edf2">
                <td style="padding:12px 18px;font-size:0.95rem;font-weight:700;color:#0f1f2e">Total ${isConfirmed ? 'Paid' : 'Amount'}</td>
                <td align="right" style="padding:12px 18px;font-size:1rem;font-weight:700;color:#1e90ff">₹${amount.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer CTA -->
        <tr>
          <td style="padding:28px 36px 32px;text-align:center">
            <p style="margin:0 0 20px;font-size:0.88rem;color:#6b7f93">
              For support, email <a href="mailto:support@bookmytrip.app" style="color:#1e90ff;text-decoration:none">support@bookmytrip.app</a>
            </p>
            <p style="margin:0;font-size:0.78rem;color:#aab7c4">
              This is a computer-generated confirmation. Please carry a copy while travelling.<br/>
              © BookMyTrip — Your trusted travel companion.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

