export const authorization = (accessRoles) => {
  return (req, res, next) => {
    const userRole = req?.user?.role;
    if (!accessRoles.includes(userRole)) {
      throw new Error("You are not authorized to access this resource", {
        cause: 403,
      });
    }

    return next();
  };
};
