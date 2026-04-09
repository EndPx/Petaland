use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::constants::*;
use crate::errors::PetalandError;
use crate::state::player::{GameConfig, PlayerAccount};

/// Mint the player's daily $PETAL allocation from the shared emission pool.
///
/// Rules:
/// - Pool must not be drained for today
/// - Player must not have already claimed today
/// - Allocation is reputation-weighted:
///     share = DAILY_PETAL_POOL * (player_rep + 1) / (total_rep_estimate + active_players)
///   For simplicity on-chain, we use a fixed base amount plus a reputation bonus,
///   capped at what remains in the pool.
/// - Marks daily_petal_claimed = true after minting
pub fn handler_mint_petal(ctx: Context<MintPetal>) -> Result<()> {
    let config = &mut ctx.accounts.game_config;
    let player = &mut ctx.accounts.player_account;
    let clock = Clock::get()?;

    let today = (clock.unix_timestamp / SECONDS_PER_DAY) as u64;

    // ── Reset pool at the start of a new day ──────────────────────────────────
    if today > config.last_pool_day {
        config.daily_pool_remaining = DAILY_PETAL_POOL;
        config.last_pool_day = today;
    }

    // ── Guards ────────────────────────────────────────────────────────────────
    require!(config.daily_pool_remaining > 0, PetalandError::DailyPoolDrained);

    // Reset player's daily claim flag if it's a new day
    if today > player.last_claim_day {
        player.daily_petal_claimed = false;
    }
    require!(!player.daily_petal_claimed, PetalandError::AlreadyClaimed);

    // ── Reputation-weighted allocation ───────────────────────────────────────
    // Base allocation: 1 PETAL per player
    // Bonus: +1 PETAL per 100 reputation points (capped to keep economy healthy)
    let base: u64 = PETAL;                                           // 1 PETAL
    let reputation_bonus: u64 = (player.reputation as u64 / 100)
        .saturating_mul(PETAL);
    let max_bonus: u64 = 99 * PETAL; // cap at 100 PETAL total
    let allocation = base
        .checked_add(reputation_bonus.min(max_bonus))
        .ok_or(PetalandError::Overflow)?
        .min(config.daily_pool_remaining);

    // ── Mint via CPI (game_config PDA is mint authority) ─────────────────────
    let config_seeds: &[&[u8]] = &[CONFIG_SEED, &[config.bump]];
    let signer_seeds = &[config_seeds];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.petal_mint.to_account_info(),
            to: ctx.accounts.player_ata.to_account_info(),
            authority: ctx.accounts.game_config.to_account_info(),
        },
        signer_seeds,
    );
    token::mint_to(cpi_ctx, allocation)?;

    // ── Update state ──────────────────────────────────────────────────────────
    config.daily_pool_remaining = config
        .daily_pool_remaining
        .checked_sub(allocation)
        .ok_or(PetalandError::Underflow)?;
    config.total_minted = config.total_minted.saturating_add(allocation);

    player.daily_petal_claimed = true;
    player.last_claim_day = today;

    msg!(
        "Minted {} PETAL lamports to player {}. Pool remaining: {}",
        allocation,
        player.authority,
        config.daily_pool_remaining
    );

    Ok(())
}

#[derive(Accounts)]
pub struct MintPetal<'info> {
    /// The player claiming their daily PETAL
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Player's on-chain account — must belong to signer
    #[account(
        mut,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        bump = player_account.bump,
        has_one = authority @ PetalandError::Unauthorized,
    )]
    pub player_account: Account<'info, PlayerAccount>,

    /// Global game config — holds pool state and is mint authority
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = game_config.bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    /// The $PETAL mint — authority must be game_config PDA
    #[account(
        mut,
        address = game_config.petal_mint,
    )]
    pub petal_mint: Account<'info, Mint>,

    /// Player's associated token account for $PETAL (created if needed)
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = petal_mint,
        associated_token::authority = authority,
    )]
    pub player_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
