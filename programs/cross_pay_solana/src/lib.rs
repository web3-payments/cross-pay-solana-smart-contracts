
use anchor_lang::{prelude::*};


pub mod errors;
pub mod instructions;
pub mod state;


use instructions::*;

declare_id!("GLRu4n249vQNpfPdubfiz4kw2AVV1yUyJ9brLB4crvzd");

const DIVISOR: u64 = 10000;
// const FEE: u64 = 140; //1.4%

#[program]
pub mod cross_pay_solana {
    use super::*;

    pub fn initialize(ctx: Context<InitializeContext>, fee: u64) -> Result<()> {
        instructions::admin::initialize(ctx, fee)
    }
    pub fn pay_with_sol(ctx: Context<PayWithSolContext>, amount: u64) -> Result<()> {
        instructions::payment::pay_with_sol(ctx, amount)
    }
    pub fn withdraw_sol(ctx: Context<WithdrawSolContext>, amount: u64) -> Result<()> {
       instructions::admin::withdraw_sol(ctx, amount)
    }

    pub fn withdraw_token(ctx: Context<WithdrawTokenContext>, amount: u64) -> Result<()> {
        instructions::admin::withdraw_token(ctx, amount)
    }
    pub fn pay_with_token(ctx: Context<PayWithTokenContext>, amount: u64) -> Result<()> {
       instructions::payment::pay_with_token(ctx, amount)
    }
}

