import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";
import { URI } from "../model/model.js";
import { encrypt } from "../lib/crypto.js";
import { snowflake } from "../utils/snowflake.js";
import { encodeBase62 } from "../utils/base62.js";
import connectDB from '../config/db.js'
import { LinkLimiter } from "../middleware/middleware.js";

dotenv.config({ path: ".env" });

const route = express.Router();

route.post("/add/link", LinkLimiter ,  async (req, res) => {
  try {
    await connectDB();
    const { email, originalURL } = req.body;

    if (!email || !originalURL) {
      return res.status(400).json({ message: "Missing fields" });
    }

    let normalizedURL;
    try {
      normalizedURL = new URL(originalURL).toString();
    } catch {
      return res.status(400).json({ message: "Invalid URL" });
    }

    const urlHash = crypto
      .createHash("sha256")
      .update(normalizedURL)
      .digest("hex");

    const existing = await URI.findOne({ urlHash, email });
    if (existing) {
      return res.status(200).json({
        shortURL: `${process.env.BASE_URL}/${existing.shortCode}`,
      });
    }

    // Single write, zero collision, no retry needed
    const id = snowflake.generate();
    const shortCode = encodeBase62(id); // e.g. "a3Kp9xZ2mN"

    await URI.create({
      email,
      originalURL: encrypt(normalizedURL),
      urlHash,
      shortCode,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return res.status(201).json({
      shortURL: `${process.env.BASE_URL}/${shortCode}`,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default route;