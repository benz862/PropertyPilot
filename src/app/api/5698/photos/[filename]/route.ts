import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const PHOTO_DIRECTORY = path.join(
  process.cwd(),
  "output/zillow-listings/5698-lamplighter-dr-girard-oh-44420/photos",
);

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/5698/photos/[filename]">,
) {
  const { filename } = await params;

  if (!/^\d{2}\.jpg$/.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const photo = await readFile(path.join(PHOTO_DIRECTORY, filename));
    return new Response(photo, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
