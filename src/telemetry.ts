import { GoogleAuth } from "google-auth-library";

const TELEMETRY_LOGS_ENDPOINT =
  "https://telemetry.googleapis.com/v1/logs";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

type OtlpAttribute = {
  key: string;
  value: {
    stringValue?: string;
  };
};

type OtlpLogs = {
  resourceLogs?: Array<{
    resource?: {
      attributes?: OtlpAttribute[];
    };
  }>;
};

function setResourceAttribute(
  attributes: OtlpAttribute[],
  key: string,
  value: string,
) {
  const existing = attributes.find(
    (attribute) => attribute.key === key,
  );

  if (existing) {
    existing.value = {
      stringValue: value,
    };
    return;
  }

  attributes.push({
    key,
    value: {
      stringValue: value,
    },
  });
}

function enrichLogs(
  payload: OtlpLogs,
  projectId: string,
): OtlpLogs {
  for (const resourceLog of payload.resourceLogs ?? []) {
    resourceLog.resource ??= {};
    resourceLog.resource.attributes ??= [];

    setResourceAttribute(
      resourceLog.resource.attributes,
      "gcp.project_id",
      projectId,
    );

    setResourceAttribute(
      resourceLog.resource.attributes,
      "gcp.resource_type",
      "global",
    );
  }

  return payload;
}

export async function sendLogsToGoogle(
  payload: OtlpLogs,
  projectId: string,
): Promise<Response> {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken.token) {
    throw new Error(
      "Failed to get Google Cloud access token",
    );
  }

  const enrichedPayload = enrichLogs(
    payload,
    projectId,
  );

  return fetch(TELEMETRY_LOGS_ENDPOINT, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "X-Goog-User-Project": projectId,
      "Content-Type": "application/json",
    },

    body: JSON.stringify(enrichedPayload),
  });
}
