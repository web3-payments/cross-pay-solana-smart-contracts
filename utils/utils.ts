import * as fs from "fs";
import { AddressLookupTableProgram, Keypair, TransactionInstruction, TransactionMessage, VersionedTransaction, } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

export const CLUSTER = "localnet"
export const getSecretKey = (name: string) =>
    Uint8Array.from(
        JSON.parse(fs.readFileSync(`keys/${name}.json`) as unknown as string)
    );

/**
 * gets KeyPair from file
 * @param name name of secretKey file
 * @returns KeyPair
 */
export const getKeypair = (name: string) =>
    Keypair.fromSecretKey(getSecretKey(name));

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};



export async function createAndSendV0Tx({ signer, connection, txInstructions }: { signer: Keypair, connection: anchor.web3.Connection, txInstructions: TransactionInstruction[] }) {
    // Step 1 - Fetch Latest Blockhash
    let latestBlockhash = await connection.getLatestBlockhash('finalized');
    console.log("   ✅ - Fetched latest blockhash. Last Valid Height:", latestBlockhash.lastValidBlockHeight);

    // Step 2 - Generate Transaction Message
    const messageV0 = new TransactionMessage({
        payerKey: signer.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: txInstructions
    }).compileToV0Message();
    console.log("   ✅ - Compiled Transaction Message");
    const transaction = new VersionedTransaction(messageV0);

    // Step 3 - Sign your transaction with the required `Signers`
    transaction.sign([signer]);
    console.log("   ✅ - Transaction Signed");

    // Step 4 - Send our v0 transaction to the cluster
    const txid = await connection.sendTransaction(transaction, { maxRetries: 5 });
    console.log("   ✅ - Transaction sent to network");

    // Step 5 - Confirm Transaction 
    const confirmation = await connection.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    });
    if (confirmation.value.err) { throw new Error("   ❌ - Transaction not confirmed.") }
    console.log('🎉 Transaction Successfully Confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=${CLUSTER}`);
}
export async function createLookupTable({ connection, signer, }: { connection: anchor.web3.Connection, signer: Keypair, }) {
    const slot = await connection.getSlot();

    const [createLookupTableIx, lookupTableAddress] =
        AddressLookupTableProgram.createLookupTable({
            authority: signer.publicKey,
            payer: signer.publicKey,
            recentSlot: slot,
        });

    await sleep(500) 

    // Step 2 - Generate a transaction and send it to the network
    await createAndSendV0Tx({ signer, connection, txInstructions: [createLookupTableIx] });
    console.log(`Lookup Table URL: `, `https://explorer.solana.com/address/${lookupTableAddress.toString()}?cluster=${CLUSTER}`)
    return lookupTableAddress
}

export async function extendLookupTable({ connection, signer, lookupTableAddress, addresses }: { connection: anchor.web3.Connection, signer: Keypair, lookupTableAddress: anchor.web3.PublicKey, addresses: anchor.web3.PublicKey[] }) {
    // Step 1 - Create Transaction Instruction
    const addAddressesInstruction = AddressLookupTableProgram.extendLookupTable({
        payer: signer.publicKey,
        authority: signer.publicKey,
        lookupTable: lookupTableAddress,
        addresses
    });
    // Step 2 - Generate a transaction and send it to the network
    await createAndSendV0Tx({ signer, connection, txInstructions: [addAddressesInstruction] });
    console.log(`Lookup Table URL: `, `https://explorer.solana.com/address/${lookupTableAddress.toString()}?cluster=${CLUSTER}`)
}


export function createVersionedTxExamples() {
    // const connection = new anchor.web3.Connection("http://127.0.0.1:8899/", "confirmed")

    // const feeBalance = await connection.getBalance(solFeeAccount);

    // const solFeeReceiver = anchor.web3.Keypair.generate();


    // create an array with your desires `instructions`
    // const instructions = [

    //     new TransactionInstruction({
    //       programId: program.programId,
    //       keys: [],
    //       data: program.coder.instruction.encode("withdraw_sol", {
    //         amount: new anchor.BN(feeBalance),
    //       },)
    //     })
    //   ];
    // const lookupTableAddress = await createLookupTable({ connection, signer: admin })


    // console.log("lookup table address:", lookupTableAddress.toBase58());

    // await extendLookupTable({
    //   connection,
    //   signer: admin,
    //   lookupTableAddress,
    //   addresses: [
    //     anchor.web3.SystemProgram.programId,
    //     admin.publicKey,
    //     feeAccountSigner,
    //     adminStateAccount,
    //     solFeeAccount,
    //     solFeeReceiver.publicKey,
    //   ]
    // })
    // // create v0 compatible message
    // const lookupTable = (await connection.getAddressLookupTable(lookupTableAddress)).value;

    // let latestBlockhash = await connection.getLatestBlockhash('finalized');

    // const messageV0 = new web3.TransactionMessage({
    //   payerKey: provider.wallet.publicKey,
    //   recentBlockhash: latestBlockhash.blockhash,
    //   instructions,
    // }).compileToV0Message([lookupTable]);

    // const transaction = new web3.VersionedTransaction(messageV0);

    // // sign your transaction with the required `Signers`
    // transaction.sign([admin]);
    // const txid = await connection.sendTransaction(transaction,);


}