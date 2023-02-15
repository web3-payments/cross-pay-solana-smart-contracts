"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVersionedTxExamples = exports.extendLookupTable = exports.createLookupTable = exports.createAndSendV0Tx = exports.sleep = exports.getKeypair = exports.getSecretKey = exports.createKeypairFromFile = exports.CLUSTER = void 0;
const fs = __importStar(require("fs"));
const web3_js_1 = require("@solana/web3.js");
exports.CLUSTER = "localnet";
function createKeypairFromFile(path) {
    return web3_js_1.Keypair.fromSecretKey(Buffer.from(JSON.parse(require('fs').readFileSync(path, "utf-8"))));
}
exports.createKeypairFromFile = createKeypairFromFile;
;
const getSecretKey = (name) => Uint8Array.from(JSON.parse(fs.readFileSync(`keys/${name}.json`)));
exports.getSecretKey = getSecretKey;
/**
 * gets KeyPair from file
 * @param name name of secretKey file
 * @returns KeyPair
 */
const getKeypair = (name) => web3_js_1.Keypair.fromSecretKey((0, exports.getSecretKey)(name));
exports.getKeypair = getKeypair;
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
function createAndSendV0Tx({ signer, connection, txInstructions }) {
    return __awaiter(this, void 0, void 0, function* () {
        // Step 1 - Fetch Latest Blockhash
        let latestBlockhash = yield connection.getLatestBlockhash('finalized');
        console.log("   ✅ - Fetched latest blockhash. Last Valid Height:", latestBlockhash.lastValidBlockHeight);
        // Step 2 - Generate Transaction Message
        const messageV0 = new web3_js_1.TransactionMessage({
            payerKey: signer.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: txInstructions
        }).compileToV0Message();
        console.log("   ✅ - Compiled Transaction Message");
        const transaction = new web3_js_1.VersionedTransaction(messageV0);
        // Step 3 - Sign your transaction with the required `Signers`
        transaction.sign([signer]);
        console.log("   ✅ - Transaction Signed");
        // Step 4 - Send our v0 transaction to the cluster
        const txid = yield connection.sendTransaction(transaction, { maxRetries: 5 });
        console.log("   ✅ - Transaction sent to network");
        // Step 5 - Confirm Transaction 
        const confirmation = yield connection.confirmTransaction({
            signature: txid,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        });
        if (confirmation.value.err) {
            throw new Error("   ❌ - Transaction not confirmed.");
        }
        console.log('🎉 Transaction Successfully Confirmed!', '\n', `https://explorer.solana.com/tx/${txid}?cluster=${exports.CLUSTER}`);
    });
}
exports.createAndSendV0Tx = createAndSendV0Tx;
function createLookupTable({ connection, signer, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const slot = yield connection.getSlot();
        const [createLookupTableIx, lookupTableAddress] = web3_js_1.AddressLookupTableProgram.createLookupTable({
            authority: signer.publicKey,
            payer: signer.publicKey,
            recentSlot: slot,
        });
        yield (0, exports.sleep)(500);
        // Step 2 - Generate a transaction and send it to the network
        yield createAndSendV0Tx({ signer, connection, txInstructions: [createLookupTableIx] });
        console.log(`Lookup Table URL: `, `https://explorer.solana.com/address/${lookupTableAddress.toString()}?cluster=${exports.CLUSTER}`);
        return lookupTableAddress;
    });
}
exports.createLookupTable = createLookupTable;
function extendLookupTable({ connection, signer, lookupTableAddress, addresses }) {
    return __awaiter(this, void 0, void 0, function* () {
        // Step 1 - Create Transaction Instruction
        const addAddressesInstruction = web3_js_1.AddressLookupTableProgram.extendLookupTable({
            payer: signer.publicKey,
            authority: signer.publicKey,
            lookupTable: lookupTableAddress,
            addresses
        });
        // Step 2 - Generate a transaction and send it to the network
        yield createAndSendV0Tx({ signer, connection, txInstructions: [addAddressesInstruction] });
        console.log(`Lookup Table URL: `, `https://explorer.solana.com/address/${lookupTableAddress.toString()}?cluster=${exports.CLUSTER}`);
    });
}
exports.extendLookupTable = extendLookupTable;
function createVersionedTxExamples() {
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
exports.createVersionedTxExamples = createVersionedTxExamples;
