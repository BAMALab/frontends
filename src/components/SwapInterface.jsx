import { useState } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { arbitrumSepolia } from 'wagmi/chains';
import { useSwap } from '../hooks/useSwap.js';

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { performSwap, isSwapping, error, swapResult, clearError } = useSwap();
  
  const [amountIn, setAmountIn] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  const isCorrectNetwork = chainId === arbitrumSepolia.id;

  const handleSwap = async (e) => {
    e.preventDefault();
    if (!isConnected || !walletClient || !isCorrectNetwork) return;

    try {
      const amount = parseUnits(amountIn, 6); 
      const recipient = recipientAddress || address;

      await performSwap({
        walletClient,
        amountIn: amount,
        amountOutMin: 0n,
        zeroForOne: true,
        recipientAddress: recipient,
      });
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="swap-interface">
        <div className="connect-prompt">
          <h2>Welcome to Gasless Token Swap</h2>
          <p>Connect your wallet to start swapping tokens without gas fees!</p>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <span>No ETH needed for gas</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🔄</span>
              <span>Swap with USDC fees only</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🛡️</span>
              <span>Powered by Account Abstraction</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="swap-interface">
        <div className="network-warning">
          <h3>Please switch to Arbitrum Sepolia</h3>
          <p>This app only works on Arbitrum Sepolia testnet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="swap-interface">
      <div className="swap-header">
        <h2  >Gasless Token Swap</h2>
        <div className="user-info">
          <span className="user-address">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <span className="network-badge">Arbitrum Sepolia</span>
        </div>
      </div>
      
      <form onSubmit={handleSwap} className="swap-form">
        <div className="input-group">
          <label htmlFor="amountIn">
            Amount to Swap
            <span className="token-symbol">USDC</span>
          </label>
          <input
            id="amountIn"
            type="number"
            step="0.000001"
            min="0"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="Enter amount (e.g., 1.5)"
            required
            className="amount-input"
          />
        </div>

        <div className="swap-arrow">
          <span>↓</span>
        </div>

        <div className="input-group">
          <label htmlFor="recipient">
            Recipient Address
            <span className="optional">(optional)</span>
          </label>
          <input
            id="recipient"
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder={address || "Enter recipient address"}
            className="address-input"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSwapping || !amountIn || !walletClient}
          className="swap-button"
        >
          {isSwapping ? (
            <>
              <div className="button-spinner"></div>
              Swapping...
            </>
          ) : (
            <>
              <span className="button-icon">⚡</span>
              Swap Tokens (Gasless)
            </>
          )}
        </button>

        <div className="swap-info">
          <p>💡 No ETH needed for gas - fees paid with USDC</p>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <h4>❌ Swap Failed</h4>
          <p>{error}</p>
          <button onClick={clearError} className="clear-error-btn">
            Try Again
          </button>
        </div>
      )}

      {swapResult && (
        <div className="success-message  ">
          <h4>✅ Swap Successful!</h4>
          <div className="transaction-details">
            <div className="detail">
              <span className="label">User Operation:</span>
              <span className="hash">{swapResult.userOpHash?.slice(0, 10)}...</span>
            </div>
            <div className="detail">
              <span className="label">Transaction:</span>
              <span className="hash">{swapResult.transactionHash?.slice(0, 10)}...</span>
            </div>
          </div>
          <a 
            href={`https://sepolia.arbiscan.io/tx/${swapResult.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            View on Arbitrum Explorer →
          </a>
        </div>
      )}
    </div>
  );
}