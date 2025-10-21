export interface ManualIvPayload {
  ticker: string;
  ivPct: number;
  ivTermDays?: number;
}

export interface ManualIvResponse {
  success: boolean;
  data?: {
    ticker: string;
    iv: number;
    ivTermDays: number;
    ivAt: string;
    tradesAffected: number;
  };
  error?: {
    message: string;
    field?: string;
  };
}

export interface IvDisplayData {
  ivPct: number;
  ivTermDays: number;
  ivAt: Date;
  source: string;
}