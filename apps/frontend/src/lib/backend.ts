export const ACCESS_TOKEN = "accessToken";

export function fetchOrigin() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001"
  );
}
