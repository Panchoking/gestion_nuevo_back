import express from "express";

import {
    login,
    logout,
    refreshAccessToken,
    verifyAuth,
} from "./auth.controller.js";

// middleware
import { authenticateToken } from "../../middlewares/authenticateToken.js";

const router = express.Router();

// login
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/verify', authenticateToken, verifyAuth);
router.get('/verify-login', authenticateToken, verifyAuth);
// refrescar token
router.post("/refresh-token", refreshAccessToken);

export default router;