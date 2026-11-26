/** Which data layer the app uses: "mock" (Phase 1 demo in the browser) or "api" (Phase 2 server). */
export const DATA_SOURCE: "mock" | "api" = process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "mock";
export const IS_API = DATA_SOURCE === "api";
