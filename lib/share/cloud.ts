export type CloudShareCard = {
  id: string;
  shareUrl: string;
  imageUrl: string;
  expiresAt: string;
  capabilities: { threadsOAuth: boolean };
};

const apiBase = process.env.NEXT_PUBLIC_SHARE_API_URL?.replace(/\/$/, "") ?? "";

export function cloudSharingConfigured() {
  return Boolean(apiBase);
}

export function cloudShareUrl(card: CloudShareCard, source: string) {
  const url = new URL(card.shareUrl);
  url.searchParams.set("ref", source);
  return url.toString();
}

export function threadsOAuthUrl(card: CloudShareCard) {
  return `${apiBase}/v1/threads/start?shareId=${encodeURIComponent(card.id)}`;
}

export async function uploadCloudShareCard(input: {
  image: Blob;
  title: string;
  caption: string;
  returnUrl: string;
}) {
  if (!apiBase) return null;
  const form = new FormData();
  form.set("image", input.image, "result.png");
  form.set("title", input.title);
  form.set("caption", input.caption);
  form.set("returnUrl", input.returnUrl);
  const response = await fetch(`${apiBase}/v1/share-cards`, { method: "POST", body: form });
  if (!response.ok) throw new Error(`Cloud share unavailable (${response.status})`);
  return response.json() as Promise<CloudShareCard>;
}
