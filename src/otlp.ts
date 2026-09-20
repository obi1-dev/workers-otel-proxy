import { gunzip } from "node:zlib";
import { promisify } from "node:util";

const gunzipAsync = promisify(gunzip);

export type OtlpAttribute = {
  key: string;
  value: {
    stringValue?: string;
    boolValue?: boolean;
    intValue?: string;
    doubleValue?: number;
  };
};

export type OtlpLogs = {
  resourceLogs?: Array<{
    resource?: {
      attributes?: OtlpAttribute[];
    };
    scopeLogs?: unknown[];
  }>;
};

export async function decodeOtlpLogs(
  body: ArrayBuffer,
  contentEncoding?: string,
): Promise<OtlpLogs> {
  const buffer = Buffer.from(body);

  let decoded: Buffer;

  switch (contentEncoding?.toLowerCase()) {
    case "gzip":
      decoded = await gunzipAsync(buffer);
      break;

    case undefined:
    case "":
    case "identity":
      decoded = buffer;
      break;

    default:
      throw new Error(
        `Unsupported Content-Encoding: ${contentEncoding}`,
      );
  }

  return JSON.parse(decoded.toString("utf8"));
}
