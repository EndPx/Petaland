/// Decimal places for the $PETAL SPL token
pub const PETAL_DECIMALS: u8 = 9;

/// One PETAL in lamports (10^9)
pub const PETAL: u64 = 1_000_000_000;

/// Amount of $PETAL emitted to the shared daily pool (10,000 PETAL per day)
pub const DAILY_PETAL_POOL: u64 = 10_000 * PETAL;

// ─── Land prices (in $PETAL lamports) ────────────────────────────────────────

/// Grove (Forest) tile — 50 $PETAL
pub const GROVE_PRICE: u64 = 50 * PETAL;

/// Cliff (Mountain) tile — 50 $PETAL
pub const CLIFF_PRICE: u64 = 50 * PETAL;

/// Lake (Pond) tile — 50 $PETAL
pub const LAKE_PRICE: u64 = 50 * PETAL;

/// Petal Estate (Large) tile — 300 $PETAL
pub const ESTATE_PRICE: u64 = 300 * PETAL;

// ─── Marketplace ─────────────────────────────────────────────────────────────

/// 10% fee on every P2P trade, burned immediately (in basis points)
pub const MARKETPLACE_FEE_BPS: u16 = 1_000;

// ─── Energy ──────────────────────────────────────────────────────────────────

/// Energy regenerated per real-world hour of inactivity
pub const ENERGY_REGEN_PER_HOUR: u32 = 10;

/// Starting max energy for a new player
pub const BASE_MAX_ENERGY: u32 = 100;

// ─── Time helpers ────────────────────────────────────────────────────────────

/// Seconds in one hour (used for energy regen calculation)
pub const SECONDS_PER_HOUR: i64 = 3_600;

/// Seconds in one day (used for daily claim reset)
pub const SECONDS_PER_DAY: i64 = 86_400;

// ─── PDA seeds ───────────────────────────────────────────────────────────────

pub const PLAYER_SEED: &[u8] = b"player";
pub const LAND_SEED: &[u8] = b"land";
pub const LISTING_SEED: &[u8] = b"listing";
pub const CONFIG_SEED: &[u8] = b"config";
pub const POOL_SEED: &[u8] = b"daily_pool";
