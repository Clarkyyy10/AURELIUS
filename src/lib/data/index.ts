// The active data layer. Phase 2: export the Supabase implementation here instead.
import { mockRepositories } from "./mock/repos";

export const repos = mockRepositories;
export { UserFacingError } from "./repositories";
export type * from "./repositories";
