import express from "express";
import dotenv from "dotenv";
import { URI } from "../model/model.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import {encrypt} from "../lib/crypto.js"
import crypto from "crypto";

const route = express.Router();

dotenv.config({ path: ".env" });

// Base62
const base62 = process.env.TEXT;

const encode = (hex) => {
  let num = BigInt("0x" + hex);
  let short = "";

  while (num > 0) {
    short = base62[Number(num % 62n)] + short;
    num = num / 62n;
  }

  return short.slice(0, 7);
};


route.post("/add/link", async (req, res) => {
  try {
    await connectDB();

    const {
      email,
      originalURL,
    } = req.body;

    if (!email || !originalURL) {
      return res.status(400).json({ message: "Missing fields" });
    }

    try {
      new URL(originalURL);
    } catch {
      return res.status(400).json({ message: "Invalid URL" });
    }

    const encryptedURL = encrypt(originalURL);

    const urlHash = crypto
      .createHash("sha256")
      .update(originalURL)
      .digest("hex");

    const existing = await URI.findOne({ urlHash , email });
    if (existing) {
      return res.status(200).json({
        shortURL: `${process.env.BASE_URL}/${existing.shortCode}`,
      });
    }

    const _id = new mongoose.Types.ObjectId();
    const shortCode = encode(_id.toString());

    const result = await URI.create({
      _id,
      email,
      originalURL : encryptedURL ,
      urlHash,
      shortCode,
      expiresAt : new Date(Date.now() + 60 * 60 * 1000),
    });

    return res.status(201).json({
      message: "Short URL created",
      shortURL: `${process.env.BASE_URL}/${shortCode}`,
      data: result,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

export default route;


