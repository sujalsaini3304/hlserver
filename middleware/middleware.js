import rateLimit from 'express-rate-limit';

// Create a limiter – e.g., max 5 requests per minute per IP
const LinkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // limit each IP to 5 requests per windowMs
  message: { message: 'Too many requests, please try again after a minute.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});

export {
    LinkLimiter,
}