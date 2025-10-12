import { userRoles } from "../../DB/models/user.model.js";

export const endpointsAuthorization = {
  getProfile: [userRoles.user],
  deleteAccount: [userRoles.admin],
};
