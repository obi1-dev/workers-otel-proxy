import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";

import { getEnv } from "./env.js";
import { sendLogsToGoogle } from "./telemetry.js";

const env = getEnv();

const app = new Hono();

app.get("/healthz", (c) => {
  return c.json({
    status: "ok",
  });
});

app.post(
  "/v1/logs",
  bearerAuth({
    token: env.ingestToken,
  }),
  async (c) => {
    const contentType = c.req.header("Content-Type");

    if (!contentType?.startsWith("application/json")) {
      return c.json(
        {
          error: "unsupported_content_type",
        },
        415,
      );
    }

    try {
      const body = await c.req.arrayBuffer();

      const response = await sendLogsToGoogle(
        body,
        env.gcpProjectId,
        contentType,
      );

      if (!response.ok) {
        const responseBody = await response.text();

        console.error(
          JSON.stringify({
            severity: "ERROR",
            message: "Google Telemetry API request failed",
            status: response.status,
            response: responseBody,
          }),
        );

        return c.json(
          {
            error: "telemetry_api_error",
          },
          502,
        );
      }

      return c.json({});
    } catch (error) {
      console.error(
        JSON.stringify({
          severity: "ERROR",
          message: "Failed to ingest Cloudflare logs",
          error:
            error instanceof Error
              ? error.message
              : String(error),
        }),
      );

      return c.json(
        {
          error: "internal_server_error",
        },
        500,
      );
    }
  },
);

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 8080),
});