use anchor_lang::prelude::*;

#[error_code]
pub enum PetalandError {
    // ─── Energy ──────────────────────────────────────────────────────────────
    #[msg("Not enough energy to perform this action")]
    InsufficientEnergy,

    #[msg("Energy is already at maximum — nothing to claim")]
    EnergyAlreadyFull,

    // ─── Daily $PETAL pool ───────────────────────────────────────────────────
    #[msg("Daily $PETAL pool has been fully drained for today")]
    DailyPoolDrained,

    #[msg("Player has already claimed their daily $PETAL allocation")]
    AlreadyClaimed,

    #[msg("Daily claim is not available yet — wait until the next day")]
    ClaimNotReady,

    // ─── Land ────────────────────────────────────────────────────────────────
    #[msg("Insufficient $PETAL balance to purchase this land tile")]
    InsufficientPetalBalance,

    #[msg("This land tile type is not purchasable (PetalPlot is free, one per player)")]
    LandNotPurchasable,

    #[msg("Player already owns a Petal Plot")]
    AlreadyOwnsPetalPlot,

    #[msg("Land tile position is already occupied")]
    PositionOccupied,

    // ─── Marketplace ─────────────────────────────────────────────────────────
    #[msg("Listing is no longer active")]
    ListingInactive,

    #[msg("Buyer cannot purchase their own listing")]
    CannotBuyOwnListing,

    #[msg("Offered price does not match the listing price")]
    PriceMismatch,

    #[msg("Item amount must be greater than zero")]
    ZeroAmount,

    #[msg("Listing amount exceeds available stock")]
    InsufficientStock,

    // ─── Authorization ───────────────────────────────────────────────────────
    #[msg("Signer is not the authority for this account")]
    Unauthorized,

    #[msg("Land tile owner mismatch")]
    NotLandOwner,

    // ─── Arithmetic ──────────────────────────────────────────────────────────
    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Arithmetic underflow")]
    Underflow,

    // ─── Config ──────────────────────────────────────────────────────────────
    #[msg("Game configuration has already been initialized")]
    AlreadyInitialized,

    #[msg("Tax rate must be between 0 and 100")]
    InvalidTaxRate,
}
