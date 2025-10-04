export const globalErrorHandling = (err, req, res, next) => {
  let statusCode = err.cause || 500;

  // Handle Multer errors specifically
  if (err.name === "MulterError") {
    statusCode = 400; // All Multer errors should be 400 (client errors)

    // Customize Multer error messages
    switch (err.code) {
      case "LIMIT_FILE_COUNT":
        err.message = `Too many files. Maximum ${err.field} files allowed.`;
        break;
      case "LIMIT_FILE_SIZE":
        err.message = "File too large";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        err.message = "Unexpected field name or too many files";
        break;
      case "MISSING_FIELD_NAME":
        err.message = "Missing field name";
        break;
      default:
        // Keep original message for other multer errors
        break;
    }
  }

  // Base error response structure
  const errorResponse = {
    message: err.message || "Internal Server Error",
    success: false,
    statusCode: statusCode,
  };

  // Add validation errors if they exist
  if (err.validationErrors) {
    errorResponse.validationErrors = err.validationErrors;
  }

  // Add stack trace in development environment
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const successResponse = ({
  res,
  data = {},
  message = "success",
  status = 200,
}) => {
  return res.status(status).json({
    message,
    data,
  });
};
