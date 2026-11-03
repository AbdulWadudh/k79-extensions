import {
  createSecret,
  deleteSecret,
  getSecret,
  listFolders,
  listProjects,
  listSecrets,
  updateSecret,
} from "../api/client";
import { normalizeThrownError } from "../api/errors";
import type { RpcError, RpcRequest, RpcResponse } from "../messaging/protocol";
import { rpcRequestSchema } from "../messaging/protocol";
import { connect, disconnect, getConnectionStatus, updateRemember, withAuthRetry } from "./auth";
import { addRecentSecret, getPrefs, savePrefs, saveScope } from "./storage";

function toRpcError(error: unknown): RpcError {
  const normalized = normalizeThrownError(error);
  return {
    code: normalized.code,
    message: normalized.message,
    status: normalized.status,
  };
}

async function dispatch(request: RpcRequest): Promise<unknown> {
  switch (request.type) {
    case "connection.status":
      return getConnectionStatus();

    case "connection.connect":
      return connect(request.payload);

    case "connection.disconnect":
      return disconnect();

    case "connection.setRemember":
      return updateRemember(request.payload.remember);

    case "projects.list": {
      const prefs = await getPrefs();
      try {
        const projects = await withAuthRetry((token) => listProjects(prefs.baseUrl, token));
        await savePrefs({ canListProjects: true });
        return projects;
      } catch (error) {
        const normalized = normalizeThrownError(error);
        if (normalized.code === "forbidden") await savePrefs({ canListProjects: false });
        throw normalized;
      }
    }

    case "scope.set": {
      await saveScope(request.payload.scope);
      return getConnectionStatus();
    }

    case "prefs.setTheme": {
      await savePrefs({ theme: request.payload.theme });
      return getConnectionStatus();
    }

    case "folders.list": {
      const prefs = await getPrefs();
      return withAuthRetry((token) => listFolders(prefs.baseUrl, token, request.payload.scope));
    }

    case "secrets.list": {
      const prefs = await getPrefs();
      return withAuthRetry((token) => listSecrets(prefs.baseUrl, token, request.payload.scope));
    }

    case "secrets.get": {
      const prefs = await getPrefs();
      const secret = await withAuthRetry((token) =>
        getSecret(prefs.baseUrl, token, request.payload.scope, request.payload.name),
      );
      await addRecentSecret(secret.key, secret.path);
      return secret;
    }

    case "secrets.create": {
      const prefs = await getPrefs();
      return withAuthRetry((token) =>
        createSecret(prefs.baseUrl, token, request.payload.scope, request.payload.input),
      );
    }

    case "secrets.update": {
      const prefs = await getPrefs();
      return withAuthRetry((token) =>
        updateSecret(prefs.baseUrl, token, request.payload.scope, {
          name: request.payload.name,
          newName: request.payload.input.newName,
          value: request.payload.input.value,
          comment: request.payload.input.comment,
        }),
      );
    }

    case "secrets.delete": {
      const prefs = await getPrefs();
      return withAuthRetry((token) =>
        deleteSecret(prefs.baseUrl, token, request.payload.scope, request.payload.name),
      );
    }
  }
}

export async function handleMessage(message: unknown): Promise<RpcResponse<unknown>> {
  const parsed = rpcRequestSchema.safeParse(message);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation",
        message: "The extension sent an invalid request.",
      },
    };
  }

  try {
    return { ok: true, data: await dispatch(parsed.data) };
  } catch (error) {
    return { ok: false, error: toRpcError(error) };
  }
}
