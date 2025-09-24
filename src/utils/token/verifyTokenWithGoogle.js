import { OAuth2Client } from "google-auth-library";

export const verifyGoogleAccount = async ({ idToken } = {}) => {
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: process.env.GOOGLE_CLIENT_IDS.split(","), // Specify the WEB_CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  // const userid = payload["sub"];
  // If the request specified a Google Workspace domain:
  // const domain = payload['hd'];

  return payload;
};
