import { arbitrumSepolia } from "viem/chains";

export const CHAIN = arbitrumSepolia;
export const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
export const SWAP_ADDRESS = "0xCD0b7d5ECd5279D946F99d98633E1942893C3573";
export const HOOKS_ADDRESS = "0x75c4cD5D01368F89E4957e67867275DDEBE740C0";
export const PAYMASTER_ADDRESS = "0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966";
export const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

export const POOL_CONFIG = {
  token0: "0x6d521a93A3B1fEF995026eBD537405EBD4A1E481",
  token1: "0x00571860bB39C639e8aAD55B4E95D36BE228ae11",
  fee: 5000,
  tickSpacing: 100,
};

export const ROUTER_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"},
      {"internalType": "bool", "name": "zeroForOne", "type": "bool"},
      {"internalType": "tuple", "name": "poolKey", "type": "tuple", "components": [
        {"internalType": "address", "name": "currency0", "type": "address"},
        {"internalType": "address", "name": "currency1", "type": "address"},
        {"internalType": "uint24", "name": "fee", "type": "uint24"},
        {"internalType": "int24", "name": "tickSpacing", "type": "int24"},
        {"internalType": "address", "name": "hooks", "type": "address"}
      ]},
      {"internalType": "bytes", "name": "hookData", "type": "bytes"},
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];