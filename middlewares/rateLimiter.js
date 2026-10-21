/**
 * Lightweight, zero-dependency sliding-window rate limiter for Express
 */
const rateLimit = ({ windowMs = 60 * 1000, max = 60, message = 'Too many requests. Please try again later.' } = {}) => {
  const requests = new Map();

  // Periodic cleanup of expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = (req.userId || req.docId || ip) + ':' + (req.originalUrl || req.baseUrl);
    const now = Date.now();

    const timestamps = requests.get(key) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

    if (validTimestamps.length >= max) {
      const oldest = validTimestamps[0];
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ success: false, message });
    }

    validTimestamps.push(now);
    requests.set(key, validTimestamps);
    next();
  };
};

// 1. Strict Authentication Limiter (10 attempts per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login or registration attempts. Please try again in 15 minutes.'
});

// 2. Appointment Booking Limiter (10 booking attempts per minute)
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many booking requests. Please wait a moment.'
});

// 3. Public Doctor Directory Limiter (60 requests per minute)
export const doctorListLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many requests for doctor directory. Please slow down.'
});

export default rateLimit;
