import express from 'express';
import passport from '../config/auth.js';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateToken } from '../config/auth.js';

const router = express.Router();

// Local authentication
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);

// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  router.get('/google/callback', 
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` 
    }),
    (req, res) => {
      try {
        const token = generateToken(req.user._id);
        const userData = encodeURIComponent(JSON.stringify(req.user));
        res.redirect(`${process.env.CLIENT_URL}/auth-success?token=${token}&user=${userData}`);
      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }
    }
  );
  console.log('✅ Google OAuth routes enabled');
}

export default router;