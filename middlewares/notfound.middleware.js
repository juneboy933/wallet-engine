export const notFoundMiddleware = (req, res) => {
  return res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
};
