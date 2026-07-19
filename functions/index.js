const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
const cloudinary = require("cloudinary").v2;

admin.initializeApp();

setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});

cloudinary.config({
  cloud_name: "f3zjhg4c",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}); exports.deleteCloudinaryMedia = onCall(async (request) => {
  try {
    const { publicId, resourceType } = request.data;

    if (!publicId) {
      throw new Error("Missing publicId.");
    }

    const result = await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: resourceType || "image",
      }
    );

    return {
      success: true,
      result,
    };
  } catch (error) {
    logger.error(error);

    return {
      success: false,
      message: error.message,
    };
  }
}); 
exports.cleanupExpiredBroadcast = onCall(async (request) => {
  try {
    const { broadcastId } = request.data;

    if (!broadcastId) {
      throw new Error("Missing broadcastId");
    }

    const db = admin.firestore();

    const broadcastRef = db
      .collection("broadcasts")
      .doc(broadcastId);

    const snap = await broadcastRef.get();

    if (!snap.exists) {
      return {
        expired: true,
      };
    }

    const data = snap.data();

    if (!data.createdAt) {
      return {
        expired: false,
      };
    }

    const created =
      data.createdAt.toDate().getTime();

    const now = Date.now();

    const sevenDays =
      7 * 24 * 60 * 60 * 1000;

    if (now - created < sevenDays) {
      return {
        expired: false,
      };
    }

    if (data.media?.publicId) {
      await cloudinary.uploader.destroy(
        data.media.publicId,
        {
          resource_type:
            data.media.resourceType || "image",
        }
      );
    }

    await broadcastRef.delete();

    return {
      expired: true,
    };

  } catch (error) {
    logger.error(error);

    return {
      expired: false,
      message: error.message,
    };
  }
});
 exports.canEditBroadcast = onCall(async (request) => {
  try {
    const { broadcastId } = request.data;

    if (!broadcastId) {
      throw new Error("Missing broadcastId");
    }

    const db = admin.firestore();

    const snap = await db
      .collection("broadcasts")
      .doc(broadcastId)
      .get();

    if (!snap.exists) {
      return {
        canEdit: false,
      };
    }

    const data = snap.data();

    if (!data.createdAt) {
      return {
        canEdit: false,
      };
    }

    const created =
      data.createdAt.toDate().getTime();

    const now = Date.now();

    const thirtyMinutes =
      30 * 60 * 1000;

    return {
      canEdit:
        now - created <= thirtyMinutes,
    };

  } catch (error) {

    logger.error(error);

    return {
      canEdit: false,
      message: error.message,
    };

  }
});