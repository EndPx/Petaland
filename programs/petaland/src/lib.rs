use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::land::TileType;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod petaland {
    use super::*;

    // ─── Admin / Setup ────────────────────────────────────────────────────────

    /// One-time initialization of the game config and $PETAL emission pool.
    /// Called by the deployer after the program is deployed.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler_initialize(ctx)
    }

    /// Create a PlayerAccount PDA for a new player.
    /// Players call this once when they first connect their wallet.
    pub fn init_player(ctx: Context<InitPlayer>) -> Result<()> {
        instructions::initialize::handler_init_player(ctx)
    }

    // ─── $PETAL Economy ───────────────────────────────────────────────────────

    /// Claim the player's reputation-weighted share of today's $PETAL pool.
    /// Reverts if pool is drained or player has already claimed today.
    pub fn mint_petal(ctx: Context<MintPetal>) -> Result<()> {
        instructions::mint_petal::handler_mint_petal(ctx)
    }

    // ─── Land ─────────────────────────────────────────────────────────────────

    /// Purchase a land tile (Grove / Cliff / Lake / PetalEstate) with $PETAL.
    /// Burns the required $PETAL and creates the LandTile PDA.
    /// A compressed NFT stub is emitted (full Bubblegum CPI to be wired).
    pub fn buy_land(
        ctx: Context<BuyLand>,
        tile_type: TileType,
        position_x: i32,
        position_y: i32,
    ) -> Result<()> {
        instructions::buy_land::handler_buy_land(ctx, tile_type, position_x, position_y)
    }

    // ─── P2P Marketplace ──────────────────────────────────────────────────────

    /// Create a marketplace listing for an off-chain item.
    /// `nonce` allows the same seller to post multiple listings of the same item.
    pub fn list_item(
        ctx: Context<ListItem>,
        item_id: u64,
        price: u64,
        amount: u64,
        nonce: u8,
    ) -> Result<()> {
        instructions::list_item::handler_list_item(ctx, item_id, price, amount, nonce)
    }

    /// Purchase `amount` units from an active marketplace listing.
    /// Pass seller, item_id, nonce to derive the listing PDA deterministically.
    /// 90% of payment goes to seller; 10% is burned.
    pub fn buy_item(
        ctx: Context<BuyItem>,
        amount: u64,
        seller: Pubkey,
        item_id: u64,
        nonce: u8,
    ) -> Result<()> {
        instructions::buy_item::handler_buy_item(ctx, amount, seller, item_id, nonce)
    }

    // ─── Energy ───────────────────────────────────────────────────────────────

    /// Recalculate and credit energy regenerated since the player's last action.
    /// +10 energy per hour elapsed, capped at max_energy.
    pub fn claim_energy(ctx: Context<ClaimEnergy>) -> Result<()> {
        instructions::claim_energy::handler_claim_energy(ctx)
    }
}
