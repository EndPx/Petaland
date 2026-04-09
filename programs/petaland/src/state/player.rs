use anchor_lang::prelude::*;

/// On-chain account tracking a player's core stats.
/// PDA: seeds = [PLAYER_SEED, authority.key().as_ref()]
#[account]
#[derive(Debug)]
pub struct PlayerAccount {
    /// The wallet that owns this player account
    pub authority: Pubkey,

    /// Current energy points (actions cost energy)
    pub energy: u32,

    /// Maximum energy — increases as player levels up
    pub max_energy: u32,

    /// Unix timestamp of the last energy-consuming action
    /// Used to calculate regenerated energy since that moment
    pub last_action_ts: i64,

    /// Reputation score — determines priority in daily $PETAL pool
    pub reputation: u32,

    /// True if the player already claimed their daily $PETAL today
    pub daily_petal_claimed: bool,

    /// Day number (Unix timestamp / SECONDS_PER_DAY) of the last claim
    pub last_claim_day: u64,

    /// PDA bump seed
    pub bump: u8,
}

impl PlayerAccount {
    /// Space: discriminator(8) + authority(32) + energy(4) + max_energy(4)
    ///        + last_action_ts(8) + reputation(4) + daily_petal_claimed(1)
    ///        + last_claim_day(8) + bump(1) = 70 bytes
    pub const LEN: usize = 8 + 32 + 4 + 4 + 8 + 4 + 1 + 8 + 1;
}

/// On-chain account tracking game-wide configuration.
/// PDA: seeds = [CONFIG_SEED]
#[account]
#[derive(Debug)]
pub struct GameConfig {
    /// The admin authority (deployer / multisig)
    pub authority: Pubkey,

    /// SPL Mint address for the $PETAL token
    pub petal_mint: Pubkey,

    /// Remaining $PETAL in today's emission pool (resets each day)
    pub daily_pool_remaining: u64,

    /// Day number when the pool was last reset
    pub last_pool_day: u64,

    /// Total $PETAL minted across all time (informational)
    pub total_minted: u64,

    /// PDA bump seed
    pub bump: u8,
}

impl GameConfig {
    /// Space: discriminator(8) + authority(32) + petal_mint(32) +
    ///        daily_pool_remaining(8) + last_pool_day(8) + total_minted(8) + bump(1) = 97 bytes
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1;
}
