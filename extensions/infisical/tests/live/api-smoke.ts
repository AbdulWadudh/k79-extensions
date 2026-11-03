import assert from "node:assert/strict";

const baseUrl = process.env.INFISICAL_BASE_URL ?? "https://us.infisical.com";
const clientId = process.env.INFISICAL_CLIENT_ID;
const clientSecret = process.env.INFISICAL_CLIENT_SECRET;
const key = `K79_API_SMOKE_${Date.now()}`;
const value = `synthetic_do_not_use_${Date.now()}`;

if (!clientId || !clientSecret) {
  throw new Error("INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET are required in the local env.");
}

type Json = Record<string, unknown>;

async function json<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = (await response.json()) as T;
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path} failed (${response.status})`);
  return body;
}

let token = "";
let projectId = "";
let environment = "";
let created = false;

try {
  const auth = await json<{ accessToken: string }>("/api/v1/auth/universal-auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  token = auth.accessToken;
  assert.ok(token, "login did not return an access token");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const projects = await json<{ projects: Json[] }>("/api/v1/projects?type=secret-manager", {
    headers,
  });
  const project = projects.projects[0] as
    | { id: string; orgId?: string; environments?: Array<{ slug: string }> }
    | undefined;
  assert.ok(project, "no Secret Manager project is available");
  assert.ok(project.orgId, "the project response is missing orgId");
  console.log("project_org_id=present");
  projectId = project.id;
  environment = project.environments?.[0]?.slug ?? "";
  assert.ok(environment, "the project has no environment");

  const scope = { projectId, environment, secretPath: "/", type: "shared" };
  await json(`/api/v4/secrets/${encodeURIComponent(key)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...scope, secretValue: value, secretComment: "synthetic smoke test" }),
  });
  created = true;

  const detail = await json<{ secret: { secretValue: string } }>(
    `/api/v4/secrets/${encodeURIComponent(key)}?projectId=${encodeURIComponent(projectId)}&environment=${encodeURIComponent(environment)}&secretPath=%2F&viewSecretValue=true`,
    { headers },
  );
  assert.equal(detail.secret.secretValue, value);

  await json(`/api/v4/secrets/${encodeURIComponent(key)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      ...scope,
      secretValue: value,
      secretComment: "synthetic smoke test, updated",
    }),
  });

  await json(`/api/v4/secrets/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers,
    body: JSON.stringify(scope),
  });
  created = false;

  console.log("live_api_smoke=passed");
} finally {
  if (created && token && projectId && environment) {
    try {
      await fetch(`${baseUrl}/api/v4/secrets/${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, environment, secretPath: "/", type: "shared" }),
      });
      console.log("cleanup=attempted");
    } catch {
      console.log("cleanup=failed");
    }
  }
}
