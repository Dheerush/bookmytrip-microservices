/**
 * Parses a raw User-Agent string into a human-readable browser + OS label.
 * Covers Chrome, Firefox, Safari, Edge, Opera and the most common OS families.
 */
export const parseUserAgent = (ua?: string): string => {
  if (!ua) return 'Unknown device';

  const s = ua;

  // --- Browser detection (order matters – Edge/Opera must come before Chrome) ---
  let browser = 'Unknown browser';
  if (/Edg\/|EdgA\/|Edge\//i.test(s)) {
    browser = 'Microsoft Edge';
  } else if (/OPR\/|Opera\//i.test(s)) {
    browser = 'Opera';
  } else if (/SamsungBrowser\//i.test(s)) {
    browser = 'Samsung Internet';
  } else if (/YaBrowser\//i.test(s)) {
    browser = 'Yandex Browser';
  } else if (/UCBrowser\//i.test(s)) {
    browser = 'UC Browser';
  } else if (/CriOS\//i.test(s)) {
    browser = 'Chrome (iOS)';
  } else if (/FxiOS\//i.test(s)) {
    browser = 'Firefox (iOS)';
  } else if (/Chrome\//i.test(s)) {
    browser = 'Chrome';
  } else if (/Firefox\//i.test(s)) {
    browser = 'Firefox';
  } else if (/Safari\//i.test(s) && /Version\//i.test(s)) {
    browser = 'Safari';
  } else if (/MSIE |Trident\//i.test(s)) {
    browser = 'Internet Explorer';
  } else if (/curl\//i.test(s)) {
    browser = 'cURL';
  } else if (/Postman/i.test(s)) {
    browser = 'Postman';
  }

  // --- OS detection ---
  let os = 'Unknown OS';
  if (/Windows NT 10\.0/i.test(s)) {
    os = 'Windows 10/11';
  } else if (/Windows NT 6\.3/i.test(s)) {
    os = 'Windows 8.1';
  } else if (/Windows NT 6\.1/i.test(s)) {
    os = 'Windows 7';
  } else if (/Windows/i.test(s)) {
    os = 'Windows';
  } else if (/iPhone/i.test(s)) {
    os = 'iPhone (iOS)';
  } else if (/iPad/i.test(s)) {
    os = 'iPad (iOS)';
  } else if (/Android/i.test(s)) {
    const m = s.match(/Android ([0-9.]+)/i);
    os = m ? `Android ${m[1]}` : 'Android';
  } else if (/Macintosh|Mac OS X/i.test(s)) {
    os = 'macOS';
  } else if (/Linux/i.test(s)) {
    os = 'Linux';
  } else if (/CrOS/i.test(s)) {
    os = 'ChromeOS';
  }

  return `${browser} on ${os}`;
};

/**
 * Converts a raw IP address into something human-readable.
 * Localhost variants → "This device (localhost)".
 */
export const formatIp = (ip?: string): string => {
  if (!ip) return 'an unknown location';
  const trimmed = ip.trim();
  if (trimmed === '::1' || trimmed === '127.0.0.1' || trimmed === 'localhost') {
    return 'localhost (this device)';
  }
  // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4 → 1.2.3.4)
  const mapped = trimmed.replace(/^::ffff:/i, '');
  return mapped;
};

/**
 * Formats a login ISO timestamp to a readable local string.
 */
export const formatLoginTime = (iso?: string): string => {
  if (!iso) return 'Unknown time';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return iso;
  }
};
