import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import route from "./routes/route.js";
import { URI } from "./model/model.js";
import path from "path";
import { fileURLToPath } from "url";
import { decrypt } from "./lib/crypto.js";
import connectDB from "./config/db.js";

const app = express();

dotenv.config({ path: ".env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express server is running",
  });
});

app.get("/:code", async (req, res) => {
    try {
      await connectDB();
    const { code } = req.params;

    const doc = await URI.findOne({ shortCode: code });

    if (!doc) {
      return res.status(404).sendFile(
        path.join(__dirname, "public", "404.html")
      );
    }

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return res.status(410).sendFile(
        path.join(__dirname, "public", "404.html")
      );
    }

    URI.updateOne(
      { shortCode: code },
      { $inc: { clicks: 1 } }
    ).catch(() => {});
    
    let decryptedURL;
    try {
      decryptedURL = decrypt(doc.originalURL);
    } catch {
      return res.status(400).sendFile(
        path.join(__dirname, "public", "404.html")
      );
    }

    return res.redirect(decryptedURL);

  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});


app.use("/api", route);


app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});

