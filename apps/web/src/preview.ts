/** Read-only fictional snapshot. No authentication, network or clinical execution. */
import snapshot from "./preview-data.json";
export async function previewApi(
  url: string,
  body?: unknown,
  method = "GET",
): Promise<any> {
  if (body || method !== "GET")
    throw new Error(
      "Read-only fixture preview. Start the separate local backend for interactive demonstrations.",
    );
  if (url === "/me") return { name: "Fixture preview", roles: ["read-only"] };
  if (url === "/cases") return snapshot.cases;
  if (url === "/reports") return snapshot.reports;
  if (url === "/services")
    return {
      Medplum: "disconnected",
      CQF: "disconnected",
      Keycloak: "disconnected",
      localModel: "disconnected",
    };
  if (url === "/fixtures") return [];
  if (url === "/audit") return snapshot.audit;
  const match = url.match(/^\/cases\/([^/]+)\/audit$/);
  if (match)
    return (
      snapshot.caseAudits[match[1] as keyof typeof snapshot.caseAudits] || []
    );
  throw new Error("This operation requires the separate local backend.");
}
