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

  // Proxy Flask backend routes
  const flaskProxy = createProxyMiddleware({
    target: "http://localhost:5000",
    changeOrigin: true,
  });

  app.use("/upload", flaskProxy);
  app.use("/ask", flaskProxy);
  app.use("/health", flaskProxy);
  app.use("/tts", flaskProxy);
  app.use("/export", flaskProxy);
  app.use("/auth", flaskProxy);
  app.use("/personas", flaskProxy);
  app.use("/sessions", flaskProxy);
  app.use("/messages", flaskProxy);
  app.use("/transcribe", flaskProxy);
};
