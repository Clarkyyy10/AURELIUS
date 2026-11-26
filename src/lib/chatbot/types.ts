// Chatbot interface — frontend-spec §5.9. Phase 2's Gemini API route returns the same ChatResult.

import type { CustomizationOptions, DesignConfig, FaqEntry, Product, ServiceCatalogItem, ServiceRequest, StoreSettings } from "@/types";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type ChatDraft =
  | { kind: "custom_order"; config: Partial<DesignConfig>; notes?: string }
  | { kind: "service_request"; fields: Partial<Pick<ServiceRequest, "itemType" | "itemDescription" | "brandModel" | "material" | "serviceIds" | "details">> };

export interface ChatResult {
  reply: string;
  quickReplies?: string[];
  draft?: ChatDraft;
  referToOwner?: boolean;
}

export interface ChatContext {
  isSignedIn: boolean;
}

/** Store knowledge the assistant may use (FR-38). Contains no customer personal data (FR-40, privacy). */
export interface KnowledgeBase {
  options: CustomizationOptions;
  services: ServiceCatalogItem[];
  faqs: FaqEntry[];
  products: Product[];
  settings: StoreSettings;
  policies: string;
}
