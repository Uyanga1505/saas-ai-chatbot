// This should only be used in contexts where we have server-provided credentials
// For authentication, use server actions from app/actions/auth-actions.ts
export function createClient() {
  throw new Error("Direct client creation is disabled. Please use server actions for authentication.")
}
