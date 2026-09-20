import { GoogleAuth } from "google-auth-library";

const TELEMETRY_LOGS_ENDPOINT =
  "https://telemetry.googleapis.com/v1/logs";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

export async function sendLogsToGoogle(
  body: ArrayBuffer,
  projectId: string,
  contentType: string,
): Promise<Response> {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken.token) {
    throw new Error("Failed to get Google Cloud access token");
  }

  return fetch(TELEMETRY_LOGS_ENDPOINT, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "X-Goog-User-Project": projectId,
      "Content-Type": contentType,
    },

    body,
  });
}
