interface ApiRouteSpec {
  method: string;
  path: string;
  summary: string;
  tags: string[];
}

const API_ROUTES: ApiRouteSpec[] = [
  { method: "get", path: "/health", summary: "Platform health status", tags: ["Health"] },
  { method: "get", path: "/health/{service}", summary: "Dependency health status", tags: ["Health"] },
  { method: "post", path: "/search", summary: "Universal workspace search", tags: ["Search"] },
  { method: "post", path: "/access/session", summary: "Create buyer access session", tags: ["Access"] },
  { method: "get", path: "/access/resolve/{token}", summary: "Resolve property access token", tags: ["Access"] },
  { method: "get", path: "/admin/dashboard", summary: "Platform admin dashboard", tags: ["Administration"] },
  { method: "get", path: "/ai-ops/{propertyId}", summary: "AI operations queue", tags: ["AI Operations"] },
  { method: "post", path: "/ai-ops/{propertyId}", summary: "Analyze a conversation", tags: ["AI Operations"] },
  { method: "get", path: "/commerce/subscription", summary: "Subscription and usage summary", tags: ["Commerce"] },
  { method: "post", path: "/commerce/subscription", summary: "Create checkout session", tags: ["Commerce"] },
  { method: "post", path: "/commerce/webhooks/stripe", summary: "Stripe webhook receiver", tags: ["Commerce"] },
  { method: "get", path: "/crm/status", summary: "CRM connection status", tags: ["CRM"] },
  { method: "post", path: "/crm/status", summary: "Connect CRM", tags: ["CRM"] },
  { method: "post", path: "/crm/sync", summary: "Sync lead to CRM", tags: ["CRM"] },
  { method: "get", path: "/enterprise/organization", summary: "Current organization", tags: ["Organizations"] },
  { method: "post", path: "/enterprise/organization", summary: "Create organization", tags: ["Organizations"] },
  { method: "get", path: "/intelligence/dashboard", summary: "Intelligence dashboard", tags: ["Intelligence"] },
  { method: "get", path: "/knowledge/{propertyId}", summary: "Knowledge health and suggestions", tags: ["Knowledge"] },
  { method: "get", path: "/knowledge/{propertyId}/search", summary: "Search property knowledge", tags: ["Knowledge"] },
  { method: "get", path: "/marketing-assets/{propertyId}", summary: "List generated marketing assets", tags: ["Marketing"] },
  { method: "post", path: "/marketing-assets/{propertyId}", summary: "Generate marketing assets", tags: ["Marketing"] },
  { method: "get", path: "/product/version-1", summary: "Version 1 readiness", tags: ["Product"] },
];

function standardResponseRef(description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          oneOf: [
            { $ref: "#/components/schemas/ApiSuccess" },
            { $ref: "#/components/schemas/ApiError" },
          ],
        },
      },
    },
  };
}

export function buildOpenApiDocument() {
  const paths = API_ROUTES.reduce<Record<string, Record<string, unknown>>>((acc, route) => {
    const pathItem = acc[route.path] ?? {};
    pathItem[route.method] = {
      summary: route.summary,
      tags: route.tags,
      responses: {
        "200": standardResponseRef("Success"),
        "400": standardResponseRef("Bad request"),
        "401": standardResponseRef("Unauthorized"),
        "403": standardResponseRef("Forbidden"),
        "404": standardResponseRef("Not found"),
        "500": standardResponseRef("Internal error"),
      },
    };
    acc[route.path] = pathItem;
    return acc;
  }, {});

  return {
    openapi: "3.1.0",
    info: {
      title: "PropertyPilot API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "/api/v1",
        description: "Development",
      },
      {
        url: "https://api.propertypilot.app/v1",
        description: "Production",
      },
    ],
    paths,
    components: {
      schemas: {
        ApiSuccess: {
          type: "object",
          required: ["success", "data", "meta", "requestId", "timestamp", "error"],
          properties: {
            success: { const: true },
            data: {},
            meta: { type: "object" },
            requestId: { type: "string", format: "uuid" },
            timestamp: { type: "string", format: "date-time" },
            error: { type: "null" },
          },
        },
        ApiError: {
          type: "object",
          required: ["success", "data", "error", "requestId", "timestamp"],
          properties: {
            success: { const: false },
            data: { type: "null" },
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
            requestId: { type: "string", format: "uuid" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      },
    },
  };
}
