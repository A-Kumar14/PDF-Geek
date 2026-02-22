const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Proxy UploadThing routes to the UT sidecar in dev
  app.use(
    "/api/uploadthing",
    createProxyMiddleware({
      target: "http://localhost:3001",
      changeOrigin: true,
    })
  );

  // Proxy all backend routes to FastAPI (main.py) on port 8000
  // Port 5001 was Flask (app.py); 8000 is the FastAPI production server.
  const fastapiProxy = createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
  });

  app.use("/upload", fastapiProxy);
  app.use("/ask", fastapiProxy);
  app.use("/health", fastapiProxy);
  app.use("/tts", fastapiProxy);
  app.use("/export", fastapiProxy);
  app.use("/auth", fastapiProxy);
  app.use("/personas", fastapiProxy);
  app.use("/sessions", fastapiProxy);
  app.use("/messages", fastapiProxy);
  app.use("/transcribe", fastapiProxy);
  app.use("/tasks", fastapiProxy);
  app.use("/s3", fastapiProxy);
  app.use("/flashcards", fastapiProxy);
  app.use("/quiz", fastapiProxy);
  app.use("/analytics", fastapiProxy);
  app.use("/workers", fastapiProxy);
};

