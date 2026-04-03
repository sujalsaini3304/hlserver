import rateLimit from 'express-rate-limit';
import { adminAuth } from '../config/firebaseAdmin.js';

// Create a limiter – e.g., max 5 requests per minute per IP
const LinkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // limit each IP to 5 requests per windowMs
  message: { message: 'Too many requests, please try again after a minute.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing auth token' });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();

  if (!idToken) {
    return res.status(401).json({ success: false, message: 'Invalid auth token' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (!decoded?.email) {
      return res.status(403).json({ success: false, message: 'Email not available in token' });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

export {
    LinkLimiter,
    verifyFirebaseToken,
}


