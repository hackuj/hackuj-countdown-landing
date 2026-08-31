export type AttackBoxStatus = "stopped" | "starting" | "running" | "stopping" | "errored";

export type AttackBoxSessionView = {
  id: string | null;
  roomId: string | null;
  status: AttackBoxStatus;
  provider: string;
  browserUrl: string;
  connectionInfo: string;
  errorMessage: string;
  expiresAt: string | null;
};

export type AttackBoxStartInput = {
  userId: string;
  roomId?: string | null;
};

export type AttackBoxProviderResult = {
  provider: string;
  providerSessionId: string;
  status: AttackBoxStatus;
  browserUrl?: string;
  connectionInfo?: string;
  errorMessage?: string;
  expiresAt?: Date | null;
};

export interface AttackBoxProvider {
  name: string;
  start(input: AttackBoxStartInput): Promise<AttackBoxProviderResult>;
  extend(session: AttackBoxProviderResult & { id?: string | null }): Promise<AttackBoxProviderResult>;
  stop(session: AttackBoxProviderResult & { id?: string | null }): Promise<AttackBoxProviderResult>;
  status(session: AttackBoxProviderResult & { id?: string | null }): Promise<AttackBoxProviderResult>;
}
