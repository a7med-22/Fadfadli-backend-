export const validation = (schema) => {
  return (req, res, next) => {
    console.log("Validation Schema:", schema);
    let validationErrors = [];

    for (const key of Object.keys(schema)) {
      const data = schema[key].validate(req[key], { abortEarly: false });

      if (data?.error) {
        data?.error?.details.map((err) => {
          validationErrors.push({
            key,
            message: err.message,
          });
        });
      }
    }

    if (validationErrors.length) {
      const errorMessage = validationErrors
        .map((err) => `${err.key}: ${err.message}`)
        .join(", ");
      const error = new Error(`Validation failed: ${errorMessage}`);
      error.cause = 400;
      error.validationErrors = validationErrors; // Keep detailed errors for debugging
      throw error;
    }

    return next();
  };
};

// res.status(400).json({
//   error: data.error.details.map((err) => ({
//     message: err.message,
//   })),
// });
