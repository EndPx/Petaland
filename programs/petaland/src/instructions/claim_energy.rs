use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::PetalandError;
use crate::state::player::PlayerAccount;

/// Regenerate player energy based on elapsed real-world time.
///
/// Energy regen rule: +10 energy per hour since last_action_ts,
/// capped at max_energy. This is a "lazy evaluation" approach —
/// energy is only calculated when the player interacts on-chain,
/// avoiding any cron-style update.
pub fn handler_claim_energy(ctx: Context<ClaimEnergy>) -> Result<()> {
    let player = &mut ctx.accounts.player_account;
    let clock = Clock::get()?;

    let now = clock.unix_timestamp;
    let elapsed_seconds = now.saturating_sub(player.last_action_ts);

    // Guard: nothing to claim if energy already full
    require!(
        player.energy < player.max_energy,
        PetalandError::EnergyAlreadyFull
    );

    // Calculate whole hours elapsed (floor division)
    let hours_elapsed = (elapsed_seconds / SECONDS_PER_HOUR) as u32;

    if hours_elapsed == 0 {
        msg!("Less than 1 hour has passed — no energy to regenerate yet");
        return Ok(());
    }

    // energy_gain = hours_elapsed * ENERGY_REGEN_PER_HOUR, cap at max_energy
    let energy_gain = hours_elapsed
        .checked_mul(ENERGY_REGEN_PER_HOUR)
        .ok_or(PetalandError::Overflow)?;

    let new_energy = player
        .energy
        .saturating_add(energy_gain)
        .min(player.max_energy);

    let actual_gained = new_energy - player.energy;

    player.energy = new_energy;
    // Advance last_action_ts by the hours we consumed (preserve sub-hour remainder)
    player.last_action_ts = player
        .last_action_ts
        .checked_add((hours_elapsed as i64) * SECONDS_PER_HOUR)
        .ok_or(PetalandError::Overflow)?;

    msg!(
        "Energy claimed: +{} (now {}/{}). Hours elapsed: {}",
        actual_gained,
        player.energy,
        player.max_energy,
        hours_elapsed
    );

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimEnergy<'info> {
    /// The player claiming energy
    pub authority: Signer<'info>,

    /// Player's on-chain account
    #[account(
        mut,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        bump = player_account.bump,
        has_one = authority @ PetalandError::Unauthorized,
    )]
    pub player_account: Account<'info, PlayerAccount>,
}
