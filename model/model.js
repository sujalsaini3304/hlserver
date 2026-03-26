import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },

    originalURL: {
      type: String,
      required: true,
    },

    shortCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    clicks: {
        type: Number,
        default: 0,
    },

    expiresAt: {
        type: Date,
        default: null
    },

    urlHash: {
      type: String,
      required: true,
      index: true,
    },

}, {
    timestamps: true,
});

urlSchema.index({ email: 1, urlHash: 1 }, { unique: true });
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
urlSchema.index({ email: 1, createdAt: -1 });

const URI = mongoose.models.URI || mongoose.model("URI", urlSchema);

export { URI };

