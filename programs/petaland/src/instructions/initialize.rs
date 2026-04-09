use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::constants::*;
use crate::errors::PetalandError;
use crate::state::player::{GameConfig, PlayerAccount};

// ─── Initialize Game Config ───────────────────────────────────────────────────

/// One-time instruction called by the deployer to bootstrap the on-chain
/// game config and create the $PETAL mint authority PDA.
pub fn handler_initialize(ctx: Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.game_config;

    // Guard: only callable once — config.authority is default (zero) before init
    require!(config.authority == Pubkey::default(), PetalandError::AlreadyInitialized);

    let clock = Clock::get()?;
    let today = (clock.unix_timestamp / SECONDS_PER_DAY) as u64;

    config.authority = ctx.accounts.authority.key();
    config.petal_mint = ctx.accounts.petal_mint.key();
    config.daily_pool_remaining = DAILY_PETAL_POOL;
    config.last_pool_day = today;
    config.total_minted = 0;
    config.bump = ctx.bumps.game_config;

    msg!(
        "Petaland initialized. Daily pool: {} PETAL. Mint: {}",
        DAILY_PETAL_POOL,
        ctx.accounts.petal_mint.key()
    );

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The deployer / admin wallet — pays for account rent
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Global game config PDA (created once)
    #[account(
        init,
        payer = authority,
        space = GameConfig::LEN,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub game_config: Account<'info, GameConfig>,

    /// The $PETAL SPL token mint.
    /// Must be a new mint whose mint authority will be set to game_config PDA.
    pub petal_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

// ─── Initialize Player Account ────────────────────────────────────────────────

/// Creates a PlayerAccount PDA for a new player's wallet.
/// Anyone can call this for their own wallet — pays their own rent.
pub fn handler_init_player(ctx: Context<InitPlayer>) -> Result<()> {
    let player = &mut ctx.accounts.player_account;
    let clock = Clock::get()?;

    player.authority = ctx.accounts.authority.key();
    player.energy = BASE_MAX_ENERGY;
    player.max_energy = BASE_MAX_ENERGY;
    player.last_action_ts = clock.unix_timestamp;
    player.reputation = 0;
    player.daily_petal_claimed = false;
    player.last_claim_day = 0;
    player.bump = ctx.bumps.player_account;

    msg!("Player account initialized for {}", ctx.accounts.authority.key());
    Ok(())
}

#[derive(Accounts)]
pub struct InitPlayer<'info> {
    /// The player's wallet — pays rent and is the authority
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Player's on-chain account PDA
    #[account(
        init,
        payer = authority,
        space = PlayerAccount::LEN,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
