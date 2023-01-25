use crate::errors::ErrorCode;
use crate::DIVISOR;
use anchor_lang::system_program::Transfer;
use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, Transfer as TokenTransfer},
};

use crate::state::AdminState;

pub fn pay_with_sol(ctx: Context<PayWithSolContext>, amount: u64) -> Result<()> {
    let admin_state = &ctx.accounts.admin_state;
    //ensure customer has up to ``amount``
    let sol_balance = ctx.accounts.customer.lamports();
    require!(sol_balance >= amount, ErrorCode::InsufficientBalance);
    // calculate fees

    let fee = amount
        .checked_mul(admin_state.fee)
        .unwrap()
        .checked_div(DIVISOR)
        .unwrap();
    let client_amount = amount - fee;
    assert_eq!(client_amount + fee, amount);
    // transfer amount - fees to client
    system_program::transfer(ctx.accounts.transfer_payment_to_client(), client_amount)?;
    //transfer fees to fees_Account
    system_program::transfer(ctx.accounts.transfer_fee_to_fee_account(), fee)?;

    Ok(())
}
pub fn pay_with_token(ctx: Context<PayWithTokenContext>, amount: u64) -> Result<()> {
    let admin_state = &ctx.accounts.admin_state;

    let token_balance = ctx.accounts.customer_token_account.amount;

    require!(token_balance >= amount, ErrorCode::InsufficientBalance);

    // calculate fees
    let fee = amount
        .checked_mul(admin_state.fee)
        .unwrap()
        .checked_div(DIVISOR)
        .unwrap();
    let client_amount = amount - fee;
    assert_eq!(client_amount + fee, amount);

    // transfer amount - fees to client
    anchor_spl::token::transfer(ctx.accounts.transfer_payment_to_client(), client_amount)?;
    //transfer fees to fees_Account
    anchor_spl::token::transfer(ctx.accounts.transfer_fee_to_fee_account(), fee)?;

    Ok(())
}

#[derive(Accounts)]
pub struct PayWithTokenContext<'info> {
    #[account(
        seeds = [
            b"admin_state",
        ],
        bump,
    )]
    admin_state: Box<Account<'info, AdminState>>,
    token_mint: Account<'info, Mint>,
    #[account(
        mut,
        token::mint=token_mint,
        token::authority=customer,
    )]
    customer_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint=token_mint,
        token::authority=client,
    )]
    client_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = customer,
        associated_token::mint=token_mint,
        associated_token::authority=fee_account_signer,
    )]
    token_fee_account: Box<Account<'info, TokenAccount>>,
    /// CHECK:
    #[account(
        seeds = [b"fee_account_signer",],
        bump,
    )]
    fee_account_signer: AccountInfo<'info>,
    /// CHECK:
    client: AccountInfo<'info>,
    #[account(mut)]
    customer: Signer<'info>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

impl<'info> PayWithTokenContext<'info> {
    pub fn transfer_payment_to_client(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, TokenTransfer<'info>> {
        let transfer_acct = TokenTransfer {
            to: self.client_token_account.to_account_info().clone(),
            from: self.customer_token_account.to_account_info().clone(),
            authority: self.customer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), transfer_acct)
    }

    pub fn transfer_fee_to_fee_account(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, TokenTransfer<'info>> {
        let transfer_acct = TokenTransfer {
            to: self.token_fee_account.to_account_info().clone(),
            from: self.customer_token_account.to_account_info().clone(),
            authority: self.customer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), transfer_acct)
    }
}

#[derive(Accounts)]
pub struct PayWithSolContext<'info> {
    #[account(
        seeds = [
            b"admin_state",
        ],
        bump,
    )]
    admin_state: Box<Account<'info, AdminState>>,
    /// CHECK:
    #[account(mut)]
    client: AccountInfo<'info>,
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
    #[account(
        seeds = [b"fee_account_signer"],
        bump,
    )]
    fee_account_signer: AccountInfo<'info>,
    #[account(mut)]
    customer: Signer<'info>,
    system_program: Program<'info, System>,
}
impl<'info> PayWithSolContext<'info> {
    pub fn transfer_payment_to_client(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let transfer_acct = Transfer {
            from: self.customer.to_account_info().clone(),
            to: self.client.to_account_info().clone(),
        };
        CpiContext::new(self.system_program.to_account_info(), transfer_acct)
    }

    pub fn transfer_fee_to_fee_account(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let transfer_acct = Transfer {
            from: self.customer.to_account_info().clone(),
            to: self.sol_fee_account.to_account_info().clone(),
        };
        CpiContext::new(self.system_program.to_account_info(), transfer_acct)
    }
}
