const { createUploadthing } = require("uploadthing/express");
const jwt = require("jsonwebtoken");

const f = createUploadthing();

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

/**
 * Middleware: verify JWT from Authorization header.
 * Extracts user_id for metadata.
 */
function authMiddleware(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { userId: payload.user_id };
  } catch {
    throw new Error("Invalid or expired token");
  }
}

const uploadRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "10MB", maxFileCount: 3 },
    image: { maxFileSize: "10MB", maxFileCount: 3 },
    text: { maxFileSize: "10MB", maxFileCount: 3 },
    blob: { maxFileSize: "10MB", maxFileCount: 3 },
  })
    .middleware(({ req }) => authMiddleware(req))
    .onUploadComplete(({ metadata, file }) => {
      console.log(`Upload complete for user ${metadata.userId}: ${file.name}`);
      return { url: file.url, key: file.key, name: file.name };
    }),
};

module.exports = { uploadRouter };
