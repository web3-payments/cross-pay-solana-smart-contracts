import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { CrossPaySolana } from "../target/types/cross_pay_solana";
import {
  createAssociatedTokenAccount,
  createInitializeMintInstruction,
  createMint, createMintToCheckedInstruction, getAssociatedTokenAddress, getMinimumBalanceForRentExemptMint, mintToChecked, MINT_SIZE, TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { expect } from "chai";

describe("cross_pay_solana", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection

  anchor.setProvider(provider);

  const program = anchor.workspace.CrossPaySolana as Program<CrossPaySolana>;
  const client = anchor.web3.Keypair.generate();
  const customer = anchor.web3.Keypair.generate();

  //PDAs
  const [adminStateAccount, _] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("admin_state"),
    ],
    program.programId
  );
  const [feeAccountSigner, __] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("fee_account_signer"),
    ],
    program.programId
  );

  const [solFeeAccount, ___] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("sol_fee_account"),
      feeAccountSigner.toBuffer(),
    ],
    program.programId
  );

  let tokenFeeAccount: anchor.web3.PublicKey;

  //Token
  let tokenMint: anchor.web3.Keypair;
  let customerATA: anchor.web3.PublicKey;
  let clientATA: anchor.web3.PublicKey;

  //constants
  const amount = 1000 * LAMPORTS_PER_SOL;
  const fee = 0.014 * amount;

  before(async () => {


    // Airdrop 1100 sol to customer acct
    const airdropSignature = await connection.requestAirdrop(
      customer.publicKey,
      1100 * LAMPORTS_PER_SOL
    );
    const latestBlockHash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSignature,
    });

    // create token and mint to customer
    tokenMint = anchor.web3.Keypair.generate();
    let tx1 = new Transaction().add(
      // create mint account
      SystemProgram.createAccount({
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: tokenMint.publicKey,
        space: MINT_SIZE,
        lamports: await getMinimumBalanceForRentExemptMint(provider.connection),
        programId: TOKEN_PROGRAM_ID,
      }),
      // init mint account
      createInitializeMintInstruction(
        tokenMint.publicKey,
        8,
        provider.wallet.publicKey,
        provider.wallet.publicKey
      )
    );
    await provider.sendAndConfirm(tx1, [tokenMint])

    //create associated token accounts
    customerATA = await createAssociatedTokenAccount(
      provider.connection,
      customer,
      tokenMint.publicKey,
      customer.publicKey
    );
    clientATA = await createAssociatedTokenAccount(
      provider.connection,
      customer,
      tokenMint.publicKey,
      client.publicKey
    );

    let mintToCustomerTx = new Transaction().add(
      createMintToCheckedInstruction(
        tokenMint.publicKey,
        customerATA,
        provider.wallet.publicKey,
        1000e8,
        8
      )
    );
    await provider.sendAndConfirm(mintToCustomerTx)
    let tokenAmount = await connection.getTokenAccountBalance(customerATA);
    expect(tokenAmount.value.uiAmount).to.be.equal(1000)

    tokenFeeAccount = await getAssociatedTokenAddress(tokenMint.publicKey, feeAccountSigner, true);

  })

  it("initializes admin_state", async () => {
    // adminStateAccount


    await program.methods
      .initialize(new anchor.BN(140))
      .accounts({
        admin: provider.wallet.publicKey,
        adminState: adminStateAccount
      })
      .rpc()

    const adminStateAfter = await program.account.adminState.fetch(adminStateAccount)
    expect(adminStateAfter.fee.toNumber()).to.be.equal(140)
    expect(adminStateAfter.admin).to.deep.equal(provider.wallet.publicKey)
  })
  it("customer can pay with sol", async () => {
    const connection = provider.connection
    const customerBalanceBefore = await connection.getBalance(customer.publicKey);
    const feeAccountBalanceBefore = await connection.getBalance(solFeeAccount);

    const txn = await program.methods
      .payWithSol(new anchor.BN(amount))
      .accounts({
        client: client.publicKey,
        customer: customer.publicKey,
        feeAccountSigner: feeAccountSigner,
        solFeeAccount: solFeeAccount,
        adminState: adminStateAccount
      })
      .transaction()

    txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    txn.feePayer = customer.publicKey;

    await sendAndConfirmTransaction(connection, txn, [customer])


    const getEstimatedFee = await txn.getEstimatedFee(connection);
    const customerBalanceAfter = await connection.getBalance(customer.publicKey);

    const difference = customerBalanceBefore - customerBalanceAfter - getEstimatedFee;
    expect(difference).to.equal(amount)

    const feeBalanceAfter = await connection.getBalance(solFeeAccount);
    const feeBalDifference = feeBalanceAfter - feeAccountBalanceBefore
    expect(feeBalDifference).to.equal(fee);

  });

  it("customer can pay with Token", async () => {

    const tokenAmount = 1000e8;
    const tokenFee = 0.014 * tokenAmount;

    await program
      .methods
      .payWithToken(new anchor.BN(tokenAmount))
      .accounts({
        client: client.publicKey,
        customer: customer.publicKey,
        tokenMint: tokenMint.publicKey,
        clientTokenAccount: clientATA,
        customerTokenAccount: customerATA,
        tokenFeeAccount,
        feeAccountSigner,
        adminState: adminStateAccount
      })
      .signers([customer])
      .rpc()

    let feeAccountBalance = await connection.getTokenAccountBalance(tokenFeeAccount);
    expect(feeAccountBalance.value.amount).to.equal(tokenFee.toString())

  })

  it("withdraws SOL", async () => {
    const feeBalance = await connection.getBalance(solFeeAccount);

    const solFeeReceiver = anchor.web3.Keypair.generate();

    await program.methods
      .withdrawSol(new anchor.BN(feeBalance))
      .accounts({
        admin: provider.wallet.publicKey,
        adminState: adminStateAccount,
        feeAccountSigner,
        solFeeAccount,
        solFeeReceiverAccount: solFeeReceiver.publicKey
      })
      .rpc()

    const solFeeReceiverBalance = await connection.getBalance(solFeeReceiver.publicKey);
    expect(solFeeReceiverBalance).to.equal(fee)

  })

  it("withdraw tokens", async () => {
    const tokenAmount = 1000e8;
    const tokenFee = 0.014 * tokenAmount;

    let feeTokenBalance = await connection.getTokenAccountBalance(tokenFeeAccount);

    const tokenFeeReceiver = anchor.web3.Keypair.generate();
    const tokenFeeReceiverATA = await createAssociatedTokenAccount(
      connection,
      customer,
      tokenMint.publicKey,
      tokenFeeReceiver.publicKey
    );

    await program.methods
      .withdrawToken(new anchor.BN(feeTokenBalance.value.amount))
      .accounts({
        admin: provider.wallet.publicKey,
        adminState: adminStateAccount,
        feeAccountSigner,
        tokenMint: tokenMint.publicKey,
        tokenFeeAccount,
        tokenFeeReceiver: tokenFeeReceiverATA,
      }).rpc()

    let feeTokenBalanceAfter = await connection.getTokenAccountBalance(tokenFeeAccount);
    expect(feeTokenBalanceAfter.value.uiAmount).to.be.equal(0)
    let tokenFeeReceiverBalance = await connection.getTokenAccountBalance(tokenFeeReceiverATA);
    expect(tokenFeeReceiverBalance.value.amount).to.be.equal(tokenFee.toString())

  })
});
