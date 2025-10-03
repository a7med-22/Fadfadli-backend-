export const validation = (schema) => {
  return (req, res, next) => {
    console.log(req.files, req.file);

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
      return res.status(400).json({
        error: validationErrors,
      });
    }

    return next();
  };
};

// res.status(400).json({
//   error: data.error.details.map((err) => ({
//     message: err.message,
//   })),
// });
