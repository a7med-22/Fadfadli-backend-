export const globalErrorHandling = (err, req, res, next) => {
  res
    .status(err.cause || 500)
    .json({ message: err.message, stack: err.stack, error: err });
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
