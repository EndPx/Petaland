use anchor_lang::prelude::*;

/// The five tile types in the Petaland world map.
///
/// - PetalPlot  : Free starter land, off-chain (not tradeable as NFT)
/// - Grove      : Forest tile, 50 $PETAL, cNFT
/// - Cliff      : Mountain tile, 50 $PETAL, cNFT
/// - Lake       : Pond tile, 50 $PETAL, cNFT
/// - PetalEstate: Large tile with all resources, 300 $PETAL, cNFT
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum TileType {
    PetalPlot,
    Grove,
    Cliff,
    Lake,
    PetalEstate,
}

impl TileType {
    /// Returns the $PETAL price (in lamports) for purchasable tile types.
    /// PetalPlot is free and handled separately.
    pub fn price(&self) -> Option<u64> {
        use crate::constants::*;
        match self {
            TileType::Grove => Some(GROVE_PRICE),
            TileType::Cliff => Some(CLIFF_PRICE),
            TileType::Lake => Some(LAKE_PRICE),
            TileType::PetalEstate => Some(ESTATE_PRICE),
            TileType::PetalPlot => None, // free, one per player
        }
    }

    /// Returns true for tiles that are minted as compressed NFTs (tradeable).
    pub fn is_nft(&self) -> bool {
        !matches!(self, TileType::PetalPlot)
    }
}

/// On-chain account representing a single land tile on the world map.
/// PDA: seeds = [LAND_SEED, owner.key().as_ref(), position_x.to_le_bytes(), position_y.to_le_bytes()]
#[account]
#[derive(Debug)]
pub struct LandTile {
    /// Current owner's wallet pubkey
    pub owner: Pubkey,

    /// The tile variant
    pub tile_type: TileType,

    /// Tax rate applied when other players craft on this tile (0–100 %)
    /// Land owners can adjust this to attract foot traffic (0 = free access)
    pub tax_rate: u8,

    /// X coordinate on the infinite world grid
    pub position_x: i32,

    /// Y coordinate on the infinite world grid
    pub position_y: i32,

    /// PDA bump seed
    pub bump: u8,
}

impl LandTile {
    /// Space: discriminator(8) + owner(32) + tile_type(1+1 enum variant) +
    ///        tax_rate(1) + position_x(4) + position_y(4) + bump(1) = 52 bytes
    /// Using 64 bytes for safety margin.
    pub const LEN: usize = 8 + 32 + 2 + 1 + 4 + 4 + 1;
}
