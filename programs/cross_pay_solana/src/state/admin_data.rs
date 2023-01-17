use anchor_lang::prelude::*;

/// state
#[account]
pub struct AdminState {
    pub fee: u64,
    pub admin: Pubkey,
}

impl AdminState {
    pub const MAX_SIZE: usize = 8 + 32;
}
