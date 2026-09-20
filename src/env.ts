export type Env = {
  ingestToken: string;
  gcpProjectId: string;
}

export function getEnv(): Env {
  const ingestToken = process.env.INGEST_TOKEN
  const gcpProjectId = process.env.GCP_PROJECT_ID

  if (!ingestToken) {
    throw new Error("INGEST_TOKENが設定されていません")
  }

  if (!gcpProjectId) {
    throw new Error("GCP_PROJECT_IDが設定されていません")
  }

  return {
    ingestToken,
    gcpProjectId
  }
}
