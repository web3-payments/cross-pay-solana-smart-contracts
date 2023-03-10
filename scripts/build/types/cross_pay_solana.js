"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDL = void 0;
exports.IDL = {
    "version": "0.1.0",
    "name": "cross_pay_solana",
    "instructions": [
        {
            "name": "initialize",
            "accounts": [
                {
                    "name": "adminState",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "admin",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "fee",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "payWithSol",
            "accounts": [
                {
                    "name": "adminState",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "client",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "solFeeAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "feeAccountSigner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "customer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "withdrawSol",
            "accounts": [
                {
                    "name": "feeAccountSigner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "adminState",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "solFeeAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "solFeeReceiverAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "admin",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "withdrawToken",
            "accounts": [
                {
                    "name": "tokenMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "feeAccountSigner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenFeeReceiver",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "admin",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "adminState",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenFeeAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "payWithToken",
            "accounts": [
                {
                    "name": "adminState",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "customerTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "clientTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenFeeAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "feeAccountSigner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "client",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "customer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "adminState",
            "docs": [
                "state"
            ],
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "fee",
                        "type": "u64"
                    },
                    {
                        "name": "admin",
                        "type": "publicKey"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "InsufficientBalance",
            "msg": "Insufficient Balance"
        },
        {
            "code": 6001,
            "name": "NotAdmin",
            "msg": "Only Admin can call function"
        }
    ]
};
