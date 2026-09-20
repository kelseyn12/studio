export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: { role?: "CREATOR" | "EDITOR" | "OPERATOR" };
  }

  interface UserPublicMetadata {
    role?: "CREATOR" | "EDITOR" | "OPERATOR";
  }
}
