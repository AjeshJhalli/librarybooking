const kv = await Deno.openKv();

export type Asset = {
  name: string;
  type: "Desk" | "Room";
  quantity: number;
  daily_rate: number;
};

// If an asset with the name doesn't exist, it will create a new one
export async function setAsset(asset: Asset) {
  await kv.set(["assets", asset.name], asset);
}

export async function deleteAsset(name: string) {
  await kv.delete(["assets", name]);
}

// Checks how many of an asset is available within a date range
export async function assetAvailability(startDate, endDate): number {
  return 1;
}
