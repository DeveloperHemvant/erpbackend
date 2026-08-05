import { Injectable } from "@nestjs/common";

export interface AiInferenceResult {
  status: "not_configured" | "ok";
  task: string;
  output?: unknown;
}

/**
 * AI Layer (IA §16 #10, Appendix A.2) — "does not exist... a model-agnostic
 * inference boundary is what keeps this swappable as the underlying
 * model/vendor changes. The architectural commitment is to the interface,
 * not to a specific provider." This service IS that interface, deliberately
 * with no model wired behind it — it returns an honest "not configured"
 * result rather than fabricating an AI response. docs/PHASE9_AI_LAYER.md
 * documents the intended call sites (search relevance, 360-page
 * summarization, transport-expense anomaly flagging) as extension points,
 * not built features.
 */
@Injectable()
export class AiService {
  async infer(task: string, _payload: unknown): Promise<AiInferenceResult> {
    return { status: "not_configured", task };
  }
}
