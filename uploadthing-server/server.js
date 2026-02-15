require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createRouteHandler } = require("uploadthing/express");
const { uploadRouter } = require("./src/uploadthing");

const app = express();
const PORT = process.env.UT_PORT || 3001;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://file-geek.vercel.app",
      /\.vercel\.app$/,
      /\.onrender\.com$/,
    ],
  })
);

app.use(
  "/api/uploadthing",
  createRouteHandler({ router: uploadRouter })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "uploadthing-server" });
});

app.listen(PORT, () => {
  console.log(`UploadThing server running on port ${PORT}`);
});
