/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/prediction_market.json`.
 */
export type PredictionMarket = {
  "address": "6YCUM1AXP5JHFu17Lmjb7sX1zaXa4qtcHbZXyzecPH9K",
  "metadata": {
    "name": "predictionMarket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Pied Piper prediction market with Seeker-gated UBI"
  },
  "instructions": [
    {
      "name": "claimUbi",
      "discriminator": [
        64,
        169,
        95,
        14,
        86,
        53,
        145,
        231
      ],
      "accounts": [
        {
          "name": "ubiPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "verification",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  114,
                  105,
                  102,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "claimWinnings",
      "discriminator": [
        161,
        215,
        24,
        59,
        14,
        236,
        242,
        221
      ],
      "accounts": [
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "market"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true,
          "relations": [
            "position"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "createMarket",
      "discriminator": [
        103,
        226,
        97,
        235,
        200,
        188,
        251,
        254
      ],
      "accounts": [
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "u64"
        },
        {
          "name": "question",
          "type": "string"
        },
        {
          "name": "endTs",
          "type": "i64"
        },
        {
          "name": "geoH3",
          "type": "u64"
        },
        {
          "name": "geoRadiusM",
          "type": "u32"
        }
      ]
    },
    {
      "name": "initializeUbiPool",
      "discriminator": [
        130,
        77,
        185,
        203,
        192,
        106,
        140,
        74
      ],
      "accounts": [
        {
          "name": "ubiPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sgtMint",
          "type": "pubkey"
        },
        {
          "name": "epochSeconds",
          "type": "i64"
        }
      ]
    },
    {
      "name": "placeBet",
      "discriminator": [
        222,
        62,
        67,
        220,
        63,
        166,
        126,
        33
      ],
      "accounts": [
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "market"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "ubiPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "side",
          "type": "bool"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerVerification",
      "discriminator": [
        210,
        43,
        96,
        166,
        146,
        44,
        101,
        235
      ],
      "accounts": [
        {
          "name": "verification",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  114,
                  105,
                  102,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "ubiPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  98,
                  105,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "sgtTokenAccount"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "resolveMarket",
      "discriminator": [
        155,
        23,
        80,
        173,
        46,
        74,
        23,
        239
      ],
      "accounts": [
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_id",
                "account": "market"
              }
            ]
          }
        },
        {
          "name": "resolver",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "outcome",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "market",
      "discriminator": [
        219,
        190,
        213,
        55,
        0,
        227,
        198,
        154
      ]
    },
    {
      "name": "position",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ]
    },
    {
      "name": "ubiPool",
      "discriminator": [
        35,
        227,
        12,
        190,
        242,
        54,
        231,
        187
      ]
    },
    {
      "name": "verificationRecord",
      "discriminator": [
        247,
        14,
        72,
        93,
        184,
        36,
        154,
        215
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "questionTooLong",
      "msg": "Question text too long (max 200 chars)"
    },
    {
      "code": 6001,
      "name": "marketNotOpen",
      "msg": "Market is not open for betting"
    },
    {
      "code": 6002,
      "name": "marketExpired",
      "msg": "Market has expired"
    },
    {
      "code": 6003,
      "name": "zeroAmount",
      "msg": "Bet amount must be > 0"
    },
    {
      "code": 6004,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6005,
      "name": "wrongSgtMint",
      "msg": "Wrong SGT mint"
    },
    {
      "code": 6006,
      "name": "sgtNotOwned",
      "msg": "SGT token account not owned by signer"
    },
    {
      "code": 6007,
      "name": "sgtNotHeld",
      "msg": "Signer does not hold an SGT"
    },
    {
      "code": 6008,
      "name": "marketAlreadySettled",
      "msg": "Market already settled"
    },
    {
      "code": 6009,
      "name": "resolutionTypeNotImplemented",
      "msg": "Resolution type not implemented (Admin only for MVP)"
    },
    {
      "code": 6010,
      "name": "unauthorized",
      "msg": "Unauthorized resolver"
    },
    {
      "code": 6011,
      "name": "marketNotSettled",
      "msg": "Market not yet settled"
    },
    {
      "code": 6012,
      "name": "alreadyClaimed",
      "msg": "Winnings already claimed"
    },
    {
      "code": 6013,
      "name": "notWinner",
      "msg": "No winning position to claim"
    },
    {
      "code": 6014,
      "name": "emptyWinningPool",
      "msg": "Empty winning pool"
    },
    {
      "code": 6015,
      "name": "insufficientPoolBalance",
      "msg": "Insufficient pool balance"
    },
    {
      "code": 6016,
      "name": "notVerified",
      "msg": "UBI not registered for this user"
    },
    {
      "code": 6017,
      "name": "alreadyClaimedEpoch",
      "msg": "UBI already claimed for this epoch"
    },
    {
      "code": 6018,
      "name": "noUbiAvailable",
      "msg": "No UBI available this epoch"
    }
  ],
  "types": [
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketId",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "question",
            "type": "string"
          },
          {
            "name": "endTs",
            "type": "i64"
          },
          {
            "name": "yesLamports",
            "type": "u64"
          },
          {
            "name": "noLamports",
            "type": "u64"
          },
          {
            "name": "feeLamports",
            "type": "u64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "outcome",
            "type": "bool"
          },
          {
            "name": "resolver",
            "type": "pubkey"
          },
          {
            "name": "resolutionType",
            "type": "u8"
          },
          {
            "name": "geoH3",
            "type": "u64"
          },
          {
            "name": "geoRadiusM",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "market",
            "type": "pubkey"
          },
          {
            "name": "yesLamports",
            "type": "u64"
          },
          {
            "name": "noLamports",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ubiPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "sgtMint",
            "type": "pubkey"
          },
          {
            "name": "totalLamports",
            "type": "u64"
          },
          {
            "name": "verifiedCount",
            "type": "u64"
          },
          {
            "name": "currentEpoch",
            "type": "u64"
          },
          {
            "name": "epochStart",
            "type": "i64"
          },
          {
            "name": "perEpochLamports",
            "type": "u64"
          },
          {
            "name": "epochSeconds",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "verificationRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "sgtMint",
            "type": "pubkey"
          },
          {
            "name": "verifiedAt",
            "type": "i64"
          },
          {
            "name": "lastClaimEpoch",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
