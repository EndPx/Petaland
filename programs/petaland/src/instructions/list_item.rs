use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::PetalandError;
use crate::state::marketplace::{ListingStatus, MarketListing};
use crate::state::player::PlayerAccount;

/// List an item on the P2P marketplace for $PETAL.
///
/// The seller specifies an off-chain item_id, price per unit, and amount.
/// Items are held off-chain (game server); the listing is purely a price
/// commitment on-chain. The game server verifies inventory before allowing
/// the buyer to finalize via buy_item.
pub fn handler_list_item(
    ctx: Context<ListItem>,
    item_id: u64,
    price: u64,
    amount: u64,
    nonce: u8,
) -> Result<()> {
    require!(amount > 0, PetalandError::ZeroAmount);
    require!(price > 0, PetalandError::ZeroAmount);

    let listing = &mut ctx.accounts.market_listing;
    listing.seller = ctx.accounts.seller.key();
    listing.item_id = item_id;
    listing.price = price;
    listing.amount = amount;
    listing.status = ListingStatus::Active;
    listing.nonce = nonce;
    listing.bump = ctx.bumps.market_listing;

    msg!(
        "Listed item {} x{} at {} PETAL/unit. Listing nonce: {}",
        item_id,
        amount,
        price,
        nonce
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(item_id: u64, price: u64, amount: u64, nonce: u8)]
pub struct ListItem<'info> {
    /// The seller — pays listing account rent
    #[account(mut)]
    pub seller: Signer<'info>,

    /// Seller's PlayerAccount — must exist
    #[account(
        seeds = [PLAYER_SEED, seller.key().as_ref()],
        bump = player_account.bump,
        constraint = player_account.authority == seller.key() @ PetalandError::Unauthorized,
    )]
    pub player_account: Account<'info, PlayerAccount>,

    /// Marketplace listing PDA
    #[account(
        init,
        payer = seller,
        space = MarketListing::LEN,
        seeds = [
            LISTING_SEED,
            seller.key().as_ref(),
            &item_id.to_le_bytes(),
            &[nonce],
        ],
        bump
    )]
    pub market_listing: Account<'info, MarketListing>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
