import { readFileSync } from "node:fs";
/** Local test fixture credentials never enter the frontend build. */
export function demonstrationPassword(role = "reviewer"): string {
  const realm = JSON.parse(readFileSync("infra/realm.json", "utf8"));
  const value =
    process.env.DEMO_PASSWORD ||
    realm.users
      .find((u: { username: string }) => u.username === role)
      ?.credentials.find((c: { type: string }) => c.type === "password")?.value;
  if (!value)
    throw new Error(
      "Provide DEMO_PASSWORD for the isolated local test account",
    );
  return value;
}
