use crate::errors::ErrorCode;
use crate::state::AdminState;

use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, Transfer as TokenTransfer},
};

pub fn initialize(ctx: Context<InitializeContext>, fee: u64) -> Result<()> {
    //initialize admin & fee
    let admin_state = &mut ctx.accounts.admin_state;
    admin_state.admin = ctx.accounts.admin.key();
    admin_state.fee = fee;
    Ok(())
}

pub fn withdraw_sol(ctx: Context<WithdrawSolContext>, amount: u64) -> Result<()> {
    let fee_account_signer = &ctx.accounts.fee_account_signer.key();

    let admin_state = &ctx.accounts.admin_state;

    require!(
        ctx.accounts.admin.key() == admin_state.admin,
        ErrorCode::NotAdmin
    );

    let bump = *ctx.bumps.get("sol_fee_account").unwrap();
    let pda_seeds = &[b"sol_fee_account", fee_account_signer.as_ref(), &[bump]];
    let sol_balance = ctx.accounts.sol_fee_account.lamports();
    transfer(
        ctx.accounts
            .withdraw_sol()
            .with_signer(&[pda_seeds.as_ref()]),
        std::cmp::min(sol_balance, amount),
    )?;

    Ok(())
}

pub fn withdraw_token(ctx: Context<WithdrawTokenContext>, amount: u64) -> Result<()> {
    let admin_state = &ctx.accounts.admin_state;

    require!(
        ctx.accounts.admin.key() == admin_state.admin,
        ErrorCode::NotAdmin
    );
    let bump = *ctx.bumps.get("fee_account_signer").unwrap();
    let pda_seeds = &["fee_account_signer".as_bytes(), &[bump]];
    let token_balance = ctx.accounts.token_fee_account.amount;

    anchor_spl::token::transfer(
        ctx.accounts
            .withdraw_token()
            .with_signer(&[pda_seeds.as_ref()]),
        std::cmp::min(token_balance, amount),
    )?;

    Ok(())
}


#[derive(Accounts)]
pub struct WithdrawTokenContext<'info> {
    token_mint: Account<'info, Mint>,
    /// CHECK:
    #[account(
        seeds = [b"fee_account_signer",],
        bump,
    )]
    fee_account_signer: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    token_fee_receiver: AccountInfo<'info>,
    #[account(mut)]
    admin: Signer<'info>,
    #[account(
        seeds = [
            b"admin_state",
        ],
        bump,
    )]
    admin_state: Box<Account<'info, AdminState>>,
    #[account(
            mut,
            associated_token::mint=token_mint,
            associated_token::authority=fee_account_signer,
        )]
    token_fee_account: Box<Account<'info, TokenAccount>>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}
impl<'info> WithdrawTokenContext<'info> {
    pub fn withdraw_token(&self) -> CpiContext<'_, '_, '_, 'info, TokenTransfer<'info>> {
        let transfer_acct = TokenTransfer {
            to: self.token_fee_receiver.to_account_info().clone(),
            from: self.token_fee_account.to_account_info().clone(),
            authority: self.fee_account_signer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), transfer_acct)
    }
}
#[derive(Accounts)]
pub struct WithdrawSolContext<'info> {
    /// CHECK:
    #[account(
            seeds = [b"fee_account_signer"],
            bump,
        )]
    fee_account_signer: AccountInfo<'info>,
    #[account(
        seeds = [
            b"admin_state",
        ],
        bump,
    )]
    admin_state: Box<Account<'info, AdminState>>,
    /// CHECK:
    #[account(
        mut,
        seeds = [
            b"sol_fee_account",
            fee_account_signer.key().as_ref()
        ],
        bump
    )]
    sol_fee_account: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    sol_fee_receiver_account: AccountInfo<'info>,
    #[account(mut)]
    admin: Signer<'info>,
    system_program: Program<'info, System>,
}

impl<'info> WithdrawSolContext<'info> {
    pub fn withdraw_sol(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let transfer_acct = Transfer {
            from: self.sol_fee_account.to_account_info().clone(),
            to: self.sol_fee_receiver_account.to_account_info().clone(),
        };
        CpiContext::new(self.system_program.to_account_info(), transfer_acct)
    }
}

#[derive(Accounts)]
pub struct InitializeContext<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + AdminState::MAX_SIZE,
        seeds = [
            b"admin_state",
        ],
        bump,
    )]
    admin_state: Box<Account<'info, AdminState>>,
    #[account(mut)]
    admin: Signer<'info>,
    system_program: Program<'info, System>,
}
