/**
 * Helius DAS API client — fetches the player's cNFT inventory.
 *
 * Pattern: CLAUDE.md §6. Petaland uses cNFTs (compressed NFTs) for tile
 * ownership because regular NFTs cost ~$2.50/mint vs cNFT's ~$0.000005.
 * Helius DAS API gives us reads + proofs without running our own indexer.
 *
 * Free tier is sufficient for hackathon scale.
 */

export interface PetalandAsset {
  /** Unique cNFT id (DAS asset id). Use this as the cell's tile.assetId */
  assetId: string;
  /** Symbolic kind from metadata attributes — 'oak_tree', 'wheat', etc. */
  tileKind: string;
  /** Image URL for inventory thumbnail */
  imageUri: string;
  /** Optional rarity tier (common, rare, etc.) */
  rarity?: string;
  /** Display name from metadata */
  name?: string;
}

export interface AssetProof {
  root: string;
  proof: string[];
  node_index: number;
  leaf: string;
  tree_id: string;
}

interface DasAssetAttribute {
  trait_type: string;
  value: string | number;
}

interface DasAsset {
  id: string;
  content: {
    metadata: {
      name?: string;
      attributes?: DasAssetAttribute[];
    };
    links: { image?: string };
  };
}

// ─── Endpoint resolution ─────────────────────────────────────────────────────

function getHeliusRpc(): string {
  const apiKey = import.meta.env['VITE_HELIUS_API_KEY'];
  const cluster = import.meta.env['VITE_SOLANA_CLUSTER'] ?? 'devnet';
  if (!apiKey) {
    throw new Error('VITE_HELIUS_API_KEY missing in env');
  }
  return `https://${cluster}.helius-rpc.com/?api-key=${apiKey}`;
}

// ─── Inventory fetch ──────────────────────────────────────────────────────────

/**
 * Returns all cNFTs owned by `walletAddress` filtered by Petaland collection.
 * The collection mint is sourced from `VITE_COLLECTION_MINT` env.
 */
export async function getPlayerInventory(
  walletAddress: string,
): Promise<PetalandAsset[]> {
  const collection = import.meta.env['VITE_COLLECTION_MINT'];
  const body = {
    jsonrpc: '2.0',
    id: 'petaland-inv',
    method: 'searchAssets',
    params: {
      ownerAddress: walletAddress,
      ...(collection ? { grouping: ['collection', collection] } : {}),
      page: 1,
      limit: 1000,
    },
  };

  const res = await fetch(getHeliusRpc(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Helius DAS: HTTP ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { result?: { items: DasAsset[] } };
  if (!json.result) {
    throw new Error('Helius DAS: no result field in response');
  }

  return json.result.items.map(toPetalandAsset);
}

function toPetalandAsset(asset: DasAsset): PetalandAsset {
  const attrs = asset.content.metadata.attributes ?? [];
  const findAttr = (key: string): string | undefined => {
    const v = attrs.find((a) => a.trait_type === key)?.value;
    return v === undefined ? undefined : String(v);
  };
  return {
    assetId: asset.id,
    tileKind: findAttr('tile_kind') ?? 'unknown',
    imageUri: asset.content.links.image ?? '',
    ...(findAttr('rarity') !== undefined && { rarity: findAttr('rarity') as string }),
    ...(asset.content.metadata.name !== undefined && {
      name: asset.content.metadata.name,
    }),
  };
}

// ─── Asset proof (for transfers / Bubblegum CPI) ─────────────────────────────

/**
 * Fetches the Merkle proof for a cNFT — required for any on-chain
 * transfer or Bubblegum verify_leaf CPI. Proofs become stale after
 * each tree mutation; do NOT cache long-term.
 */
export async function getAssetProof(assetId: string): Promise<AssetProof> {
  const res = await fetch(getHeliusRpc(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'asset-proof',
      method: 'getAssetProof',
      params: { id: assetId },
    }),
  });

  if (!res.ok) {
    throw new Error(`Helius getAssetProof: HTTP ${res.status}`);
  }
  const json = (await res.json()) as { result?: AssetProof };
  if (!json.result) {
    throw new Error('Helius getAssetProof: no result field');
  }
  return json.result;
}
