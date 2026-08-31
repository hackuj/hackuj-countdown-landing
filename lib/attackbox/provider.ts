import "server-only";
import { randomUUID } from "node:crypto";
import type { AttackBoxProvider, AttackBoxProviderResult, AttackBoxStartInput } from "./types";

export type AttackBoxMode = "off" | "mock" | "external";

const DEFAULT_TTL_MINUTES = 60;

function ttlDate(minutes = Number(process.env.ATTACKBOX_TTL_MINUTES || DEFAULT_TTL_MINUTES)) {
  const safeMinutes = Math.max(5, Math.min(8 * 60, Math.round(Number.isFinite(minutes) ? minutes : DEFAULT_TTL_MINUTES)));
  return new Date(Date.now() + safeMinutes * 60 * 1000);
}

export function attackBoxMode(): AttackBoxMode {
  const value = (process.env.ATTACKBOX_MODE ?? "mock").toLowerCase();
  if (value === "off" || value === "disabled") return "off";
  if (value === "external") return "external";
  return "mock";
}

function fillTemplate(template: string, input: { sessionId: string; userId: string; roomId: string }) {
  return template
    .replaceAll("{sessionId}", encodeURIComponent(input.sessionId))
    .replaceAll("{userId}", encodeURIComponent(input.userId))
    .replaceAll("{roomId}", encodeURIComponent(input.roomId));
}

class DisabledAttackBoxProvider implements AttackBoxProvider {
  name = "off";
  async start(): Promise<AttackBoxProviderResult> {
    return {
      provider: this.name,
      providerSessionId: "",
      status: "errored",
      errorMessage: "AttackBox runtime is disabled. Set ATTACKBOX_MODE=mock or ATTACKBOX_MODE=external.",
      expiresAt: null,
    };
  }
  async extend(session: AttackBoxProviderResult) { return { ...session, provider: this.name, status: "errored" as const }; }
  async stop(session: AttackBoxProviderResult) { return { ...session, provider: this.name, status: "stopped" as const, expiresAt: null }; }
  async status(session: AttackBoxProviderResult) { return { ...session, provider: this.name }; }
}

class MockAttackBoxProvider implements AttackBoxProvider {
  name = "mock";

  async start(input: AttackBoxStartInput): Promise<AttackBoxProviderResult> {
    const sessionId = `mock-${randomUUID()}`;
    return {
      provider: this.name,
      providerSessionId: sessionId,
      status: "running",
      browserUrl: `/api/attackbox/mock/${encodeURIComponent(sessionId)}`,
      connectionInfo: input.roomId ? `Mock AttackBox attached to room ${input.roomId}.` : "Mock AttackBox ready.",
      expiresAt: ttlDate(),
    };
  }

  async extend(session: AttackBoxProviderResult): Promise<AttackBoxProviderResult> {
    return { ...session, provider: this.name, status: "running", expiresAt: ttlDate() };
  }

  async stop(session: AttackBoxProviderResult): Promise<AttackBoxProviderResult> {
    return { ...session, provider: this.name, status: "stopped", expiresAt: null };
  }

  async status(session: AttackBoxProviderResult): Promise<AttackBoxProviderResult> {
    const expired = session.expiresAt ? new Date(session.expiresAt).getTime() <= Date.now() : false;
    return expired ? { ...session, provider: this.name, status: "stopped", expiresAt: null } : { ...session, provider: this.name };
  }
}

class ExternalAttackBoxProvider implements AttackBoxProvider {
  name = "external";

  async start(input: AttackBoxStartInput): Promise<AttackBoxProviderResult> {
    const sessionId = `external-${randomUUID()}`;
    const template = process.env.ATTACKBOX_BROWSER_URL_TEMPLATE || process.env.ATTACKBOX_BROWSER_URL || "";
    if (!template) {
      return {
        provider: this.name,
        providerSessionId: sessionId,
        status: "errored",
        errorMessage: "ATTACKBOX_BROWSER_URL_TEMPLATE is required when ATTACKBOX_MODE=external.",
        expiresAt: null,
      };
    }
    const browserUrl = fillTemplate(template, { sessionId, userId: input.userId, roomId: input.roomId ?? "" });
    return {
      provider: this.name,
      providerSessionId: sessionId,
      status: "running",
      browserUrl,
      connectionInfo: process.env.ATTACKBOX_CONNECTION_INFO || "External AttackBox session ready.",
      expiresAt: ttlDate(),
    };
  }

  async extend(session: AttackBoxProviderResult): Promise<AttackBoxProviderResult> {
    return { ...session, provider: this.name, status: "running", expiresAt: ttlDate() };
  }

  async stop(session: AttackBoxProviderResult): Promise<AttackBoxProviderResult> {
    return { ...session, provider: this.name, status: "stopped", expiresAt: null };
  }

  async status(session: AttackBoxProviderResult): Promise<AttackBoxProviderResult> {
    const expired = session.expiresAt ? new Date(session.expiresAt).getTime() <= Date.now() : false;
    return expired ? { ...session, provider: this.name, status: "stopped", expiresAt: null } : { ...session, provider: this.name };
  }
}

export function getAttackBoxProvider(): AttackBoxProvider {
  const mode = attackBoxMode();
  if (mode === "off") return new DisabledAttackBoxProvider();
  if (mode === "external") return new ExternalAttackBoxProvider();
  return new MockAttackBoxProvider();
}
