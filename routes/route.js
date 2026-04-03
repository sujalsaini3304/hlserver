import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";
import { URI } from "../model/model.js";
import { decrypt, encrypt } from "../lib/crypto.js";
import { snowflake } from "../utils/snowflake.js";
import { encodeBase62 } from "../utils/base62.js";
import connectDB from '../config/db.js'
import { LinkLimiter, verifyFirebaseToken } from "../middleware/middleware.js";

dotenv.config({ path: ".env" });

const route = express.Router();



route.delete("/delete", verifyFirebaseToken, async (req, res) => {
  try {
    await connectDB();
    const { id } = req.body;
    const email = req.user.email;

    if (!id) {
      return res.status(400).json({ success: false, message: "Missing id" });
    }

    const deleted = await URI.findOneAndDelete({
      _id: id,
      email: email,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});


route.post("/fetch", verifyFirebaseToken, async (req, res) => {
  try {
    await connectDB();
    const { page = 1, limit = 10 } = req.body || {};
    const email = req.user.email;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const skip = (parsedPage - 1) * parsedLimit;

    const urls = await URI.find({ email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    const total = await URI.countDocuments({ email });

    const decryptedUrls = urls.map((item) => {
      try {
        return {
          ...item,
          originalURL: decrypt(item.originalURL),
        };
      } catch {
        return {
          ...item,
          originalURL: "Decryption Failed",
        };
      }
    });

    res.json({
      success: true,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      total,
      data: decryptedUrls,
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});



route.post("/add/link", verifyFirebaseToken, LinkLimiter, async (req, res) => {
  try {
    await connectDB();
    const { originalURL } = req.body;
    const email = req.user.email;

    if (!originalURL) {
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