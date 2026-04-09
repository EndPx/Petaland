use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::PetalandError;
use crate::state::land::{LandTile, TileType};
use crate::state::player::{GameConfig, PlayerAccount};

/// Purchase a land tile with $PETAL.
///
/// Flow:
/// 1. Validate tile type is purchasable (not PetalPlot)
/// 2. Burn the required $PETAL from buyer's ATA
/// 3. Initialize the LandTile PDA at (position_x, position_y)
/// 4. Stub: emit a log for the cNFT mint (full Bubblegum CPI wired separately)
pub fn handler_buy_land(
    ctx: Context<BuyLand>,
    tile_type: TileType,
    position_x: i32,
    position_y: i32,
) -> Result<()> {
    // ── Validate tile type ────────────────────────────────────────────────────
    let price = tile_type
        .price()
        .ok_or(PetalandError::LandNotPurchasable)?;

    // ── Burn $PETAL from buyer ────────────────────────────────────────────────
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.petal_mint.to_account_info(),
            from: ctx.accounts.buyer_ata.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );
    token::burn(cpi_ctx, price)?;

    // ── Initialize LandTile PDA ───────────────────────────────────────────────
    let land = &mut ctx.accounts.land_tile;
    land.owner = ctx.accounts.buyer.key();
    land.tile_type = tile_type.clone();
    land.tax_rate = 50; // default 50% tax; owner can update later
    land.position_x = position_x;
    land.position_y = position_y;
    land.bump = ctx.bumps.land_tile;

    // ── cNFT stub (Bubblegum CPI) ─────────────────────────────────────────────
    // TODO: Wire full mpl-bubblegum CPI here.
    // The compressed NFT represents the land deed and is tradeable on-chain.
    // Required additional accounts: tree_authority, merkle_tree, bubblegum_program,
    // log_wrapper, compression_program.
    msg!(
        "[cNFT stub] Mint {:?} land at ({}, {}) for {} PETAL lamports. Owner: {}",
        tile_type,
        position_x,
        position_y,
        price,
        ctx.accounts.buyer.key()
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(tile_type: TileType, position_x: i32, position_y: i32)]
pub struct BuyLand<'info> {
    /// The buyer — pays rent and $PETAL cost
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// Buyer's PlayerAccount — must exist (created via init_player)
    /// Constraint: the player_account.authority must equal the buyer's key
    #[account(
        mut,
        seeds = [PLAYER_SEED, buyer.key().as_ref()],
        bump = player_account.bump,
        constraint = player_account.authority == buyer.key() @ PetalandError::Unauthorized,
    )]
    pub player_account: Account<'info, PlayerAccount>,

    /// Game config — holds petal_mint address
    #[account(
        seeds = [CONFIG_SEED],
        bump = game_config.bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    /// $PETAL mint — tokens will be burned from buyer_ata
    #[account(
        mut,
        address = game_config.petal_mint,
    )]
    pub petal_mint: Account<'info, Mint>,

    /// Buyer's $PETAL token account — source of burn
    #[account(
        mut,
        associated_token::mint = petal_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_ata: Account<'info, TokenAccount>,

    /// LandTile PDA — keyed by owner + position
    #[account(
        init,
        payer = buyer,
        space = LandTile::LEN,
        seeds = [
            LAND_SEED,
            buyer.key().as_ref(),
            &position_x.to_le_bytes(),
            &position_y.to_le_bytes(),
        ],
        bump
    )]
    pub land_tile: Account<'info, LandTile>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
