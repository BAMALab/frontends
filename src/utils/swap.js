import {
    createPublicClient,
    http,
    createWalletClient,
    custom,
    encodeAbiParameters,
    encodePacked,
    hexToBigInt,
  } from "viem";
  import {
    createBundlerClient,
    toSimple7702SmartAccount,
  } from "viem/account-abstraction";
  import { signPermit } from "./permit.js";
  import { 
    CHAIN, 
    USDC_ADDRESS, 
    SWAP_ADDRESS, 
    HOOKS_ADDRESS, 
    PAYMASTER_ADDRESS, 
    POOL_CONFIG,
    ROUTER_ABI 
  } from "./constants.js";
  
  export async function executeSwap({
    walletClient,
    amountIn,
    amountOutMin = 0n,
    zeroForOne = true,
    recipientAddress,
  }) {
    try {
      // Create public client
      const client = createPublicClient({ 
        chain: CHAIN, 
        transport: http() 
      });
  
      // Get account from wallet
      const [account] = await walletClient.getAddresses();
      
      // Check if the wallet client supports the required methods
      if (!walletClient.signMessage) {
        throw new Error('Wallet client does not support signMessage');
      }
      
      const smartAccount = await toSimple7702SmartAccount({ 
        client, 
        owner: { 
          address: account, 
          signMessage: async ({ message }) => await walletClient.signMessage({ 
            account, 
            message 
          })
        }
      });
  
      // Create paymaster configuration
      const paymaster = {
        async getPaymasterData() {
          const permitAmount = 10000000n; // 10 USDC
          const permitSignature = await signPermit({
            tokenAddress: USDC_ADDRESS,
            account: smartAccount,
            client,
            spenderAddress: PAYMASTER_ADDRESS,
            permitAmount,
          });
  
          const paymasterData = encodePacked(
            ["uint8", "address", "uint256", "bytes"],
            [0, USDC_ADDRESS, permitAmount, permitSignature]
          );
  
          return {
            paymaster: PAYMASTER_ADDRESS,
            paymasterData,
            paymasterVerificationGasLimit: 300000n,
            paymasterPostOpGasLimit: 20000n,
            isFinal: true,
          };
        },
      };
  
      // Create bundler transport
      const bundlerTransport = http(`https://public.pimlico.io/v2/${CHAIN.id}/rpc`);
      
      // Create bundler client
      const bundlerClient = createBundlerClient({
        account: smartAccount,
        client,
        paymaster,
        userOperation: {
          estimateFeesPerGas: async () => {
            // Create a separate client for gas estimation
            const gasClient = createPublicClient({
              chain: CHAIN,
              transport: bundlerTransport,
            });
            const { standard: fees } = await gasClient.request({
              method: "pimlico_getUserOperationGasPrice",
            });
            return {
              maxFeePerGas: hexToBigInt(fees.maxFeePerGas),
              maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas),
            };
          },
        },
        transport: bundlerTransport,
      });
  
      // Prepare pool key and hook data
      const poolKey = [
        POOL_CONFIG.token0,
        POOL_CONFIG.token1,
        POOL_CONFIG.fee,
        POOL_CONFIG.tickSpacing,
        HOOKS_ADDRESS,
      ];
  
      const hookData = encodeAbiParameters(
        [
          { name: "useGaslessMode", type: "bool" },
          { name: "actualUser", type: "address" },
        ],
        [true, account]
      );
  
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
  
      // Send user operation
      const hash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [
          {
            to: SWAP_ADDRESS,
            abi: ROUTER_ABI,
            functionName: "swapExactTokensForTokens",
            args: [
              amountIn,
              amountOutMin,
              zeroForOne,
              poolKey,
              hookData,
              recipientAddress,
              deadline,
            ],
          },
        ],
      });
  
      // Wait for receipt
      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
      
      return {
        userOpHash: hash,
        transactionHash: receipt.receipt.transactionHash,
        success: true,
      };
    } catch (error) {
      console.error("Swap execution failed:", error);
      throw error;
    }
  }