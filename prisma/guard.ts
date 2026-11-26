/** Stops a destructive or demo-only script unless DATABASE_URL points at the TEST Supabase project. */
export function assertTestProject() {
  const ref = process.env.SUPABASE_TEST_PROJECT_REF?.trim();
  const url = process.env.DATABASE_URL ?? "";
  if (!ref || !url.includes(ref) || !(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").includes(ref)) {
    throw new Error(
      "Refusing to run: this only works on the test project. Set SUPABASE_TEST_PROJECT_REF and point DATABASE_URL and NEXT_PUBLIC_SUPABASE_URL at that project.",
    );
  }
}
