// The active data layer: the Phase 1 mock (demo data in the browser) or the Phase 2 API,
// chosen with NEXT_PUBLIC_DATA_SOURCE. Pages only use `repos`, so they work with either.
import { mockRepositories } from "./mock/repos";
import { apiRepositories } from "./api";
import { IS_API } from "./source";

export const repos = IS_API ? apiRepositories : mockRepositories;
export { UserFacingError } from "./repositories";
export type * from "./repositories";
