use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::PetalandError;
use crate::state::marketplace::{ListingStatus, MarketListing};
use crate::state::player::{GameConfig, PlayerAccount};

/// Buy items from a marketplace listing.
///
/// The caller must pass seller, item_id, and nonce so that Anchor can
/// derive the listing PDA deterministically in the accounts constraint.
///
/// Payment flow:
///   buyer pays:  amount * listing.price  $PETAL
///   10% burned:  total * MARKETPLACE_FEE_BPS / 10_000
///   90% to seller's ATA
pub fn handler_buy_item(ctx: Context<BuyItem>, amount: u64, _seller: Pubkey, _item_id: u64, _nonce: u8) -> Result<()> {
    let listing = &mut ctx.accounts.market_listing;

    // ── Guards ────────────────────────────────────────────────────────────────
    require!(listing.status == ListingStatus::Active, PetalandError::ListingInactive);
    require!(
        ctx.accounts.buyer.key() != listing.seller,
        PetalandError::CannotBuyOwnListing
    );
    require!(amount > 0, PetalandError::ZeroAmount);
    require!(amount <= listing.amount, PetalandError::InsufficientStock);

    // ── Calculate payment ─────────────────────────────────────────────────────
    let total_payment = (listing.price as u128)
        .checked_mul(amount as u128)
        .ok_or(PetalandError::Overflow)? as u64;

    let fee = (total_payment as u128)
        .checked_mul(MARKETPLACE_FEE_BPS as u128)
        .ok_or(PetalandError::Overflow)?
        .checked_div(10_000)
        .ok_or(PetalandError::Overflow)? as u64;

    let seller_amount = total_payment
        .checked_sub(fee)
        .ok_or(PetalandError::Underflow)?;

    // ── Transfer seller's share: buyer → seller ATA ───────────────────────────
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.buyer_ata.to_account_info(),
            to: ctx.accounts.seller_ata.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, seller_amount)?;

    // ── Burn the 10% fee ──────────────────────────────────────────────────────
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.petal_mint.to_account_info(),
            from: ctx.accounts.buyer_ata.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );
    token::burn(burn_ctx, fee)?;

    // ── Update listing ────────────────────────────────────────────────────────
    listing.amount = listing
        .amount
        .checked_sub(amount)
        .ok_or(PetalandError::Underflow)?;

    if listing.amount == 0 {
        listing.status = ListingStatus::Sold;
    }

    msg!(
        "Bought {} x item {} for {} PETAL total. Burned {} fee. Seller received {}.",
        amount,
        listing.item_id,
        total_payment,
        fee,
        seller_amount
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, seller: Pubkey, item_id: u64, nonce: u8)]
pub struct BuyItem<'info> {
    /// The buyer — pays $PETAL
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// Buyer's PlayerAccount — must exist
    #[account(
        seeds = [PLAYER_SEED, buyer.key().as_ref()],
        bump = buyer_player_account.bump,
        constraint = buyer_player_account.authority == buyer.key() @ PetalandError::Unauthorized,
    )]
    pub buyer_player_account: Account<'info, PlayerAccount>,

    /// The active marketplace listing — PDA derived from instruction args
    #[account(
        mut,
        seeds = [
            LISTING_SEED,
            seller.as_ref(),
            &item_id.to_le_bytes(),
            &[nonce],
        ],
        bump = market_listing.bump,
        constraint = market_listing.status == ListingStatus::Active @ PetalandError::ListingInactive,
        constraint = market_listing.seller == seller @ PetalandError::Unauthorized,
        constraint = market_listing.item_id == item_id @ PetalandError::Unauthorized,
        constraint = market_listing.nonce == nonce @ PetalandError::Unauthorized,
    )]
    pub market_listing: Account<'info, MarketListing>,

    /// Game config — for petal_mint address
    #[account(
        seeds = [CONFIG_SEED],
        bump = game_config.bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    /// $PETAL mint
    #[account(
        mut,
        address = game_config.petal_mint,
    )]
    pub petal_mint: Account<'info, Mint>,

    /// Buyer's $PETAL ATA — source of payment
    #[account(
        mut,
        associated_token::mint = petal_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_ata: Account<'info, TokenAccount>,

    /// Seller's $PETAL ATA — receives 90% of payment
    #[account(
        mut,
        associated_token::mint = petal_mint,
        associated_token::authority = seller_info,
    )]
    pub seller_ata: Account<'info, TokenAccount>,

    /// CHECK: seller identity verified — key must equal the seller instruction arg
    /// which is already validated against market_listing.seller above
    #[account(constraint = seller_info.key() == seller @ PetalandError::Unauthorized)]
    pub seller_info: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
