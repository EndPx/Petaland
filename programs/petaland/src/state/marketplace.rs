use anchor_lang::prelude::*;

/// Status of a marketplace listing.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
}

/// On-chain account representing a single P2P marketplace listing.
///
/// Sellers list items for $PETAL. On purchase, 10% of the payment is burned
/// and 90% goes to the seller. The listing PDA is closed on completion.
///
/// PDA: seeds = [LISTING_SEED, seller.key().as_ref(), item_id.to_le_bytes(), &[nonce]]
#[account]
#[derive(Debug)]
pub struct MarketListing {
    /// Wallet pubkey of the seller
    pub seller: Pubkey,

    /// Off-chain item identifier (matches game-server item catalogue)
    pub item_id: u64,

    /// Price per unit in $PETAL lamports
    pub price: u64,

    /// Remaining stock available in this listing
    pub amount: u64,

    /// Current listing state
    pub status: ListingStatus,

    /// Nonce allowing same seller to post multiple listings of the same item
    pub nonce: u8,

    /// PDA bump seed
    pub bump: u8,
}

impl MarketListing {
    /// Space: discriminator(8) + seller(32) + item_id(8) + price(8) +
    ///        amount(8) + status(1+1) + nonce(1) + bump(1) = 68 bytes
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 2 + 1 + 1;
}
