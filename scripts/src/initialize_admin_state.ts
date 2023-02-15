import { AnchorProvider, Program, Wallet } from "@project-serum/anchor";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { createKeypairFromFile, getKeypair } from "./utils/utils";
import idl from "./idl/cross_pay_solana.json"
import { CrossPaySolana } from "./types/cross_pay_solana";
import * as anchor from "@project-serum/anchor";
require('dotenv').config()

async function main() {
    const adminKeyJSON = process.env.ADMIN_KEY_LOCATION
    const payer = createKeypairFromFile(adminKeyJSON)
    const connection = new Connection(
        clusterApiUrl("mainnet-beta"),
        "confirmed"
    );
    const provider = new AnchorProvider(connection, new Wallet(payer), { commitment: "confirmed", skipPreflight: true })
    const program = new Program<CrossPaySolana>(idl as any, idl.metadata.address, provider);
       
        
    //PDAs
    const [adminStateAccount, _] = anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("admin_state"),
        ],
        program.programId
    );


    await program.methods
        .initialize(new anchor.BN(100))
        .accounts({
            admin: provider.wallet.publicKey,
            adminState: adminStateAccount
        })
        .rpc()

    const adminState = await program.account.adminState.fetch(adminStateAccount)
    console.log("------------------Admin State Initialized------------------");
    console.log(adminState);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});