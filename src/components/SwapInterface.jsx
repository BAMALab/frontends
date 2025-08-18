import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { arbitrumSepolia } from 'wagmi/chains';
import { useSwap } from '../hooks/useSwap.js';

const getExchangeRate = async (fromToken, toToken) => {
  // These are mock rates - replace with actual rate fetching logic
  const rates = {
    'USDC-ETH': 0.0005, // 1 USDC = 0.0005 ETH
    'ETH-USDC': 2000,    // 1 ETH = 2000 USDC
    'USDC-DAI': 1,       // 1:1 peg
    'DAI-USDC': 1,
    'USDC-WBTC': 0.00002,
    'WBTC-USDC': 50000,
    'ETH-DAI': 2000,
    'DAI-ETH': 0.0005,
    // Add other token pairs as needed
  };

  const pair = `${fromToken.symbol}-${toToken.symbol}`;
  return rates[pair] || 1; // Default to 1:1 if pair not found
};

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { performSwap, isSwapping, error, swapResult, clearError } = useSwap();
  
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [fromToken, setFromToken] = useState({ symbol: 'USDC', decimals: 6 });
  const [toToken, setToToken] = useState({ symbol: 'ETH', decimals: 18 });
  const [showTokenSelector, setShowTokenSelector] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  const isCorrectNetwork = chainId === arbitrumSepolia.id;

  // Fetch exchange rate when tokens change
  useEffect(() => {
    const fetchRate = async () => {
      setIsLoadingRate(true);
      try {
        const rate = await getExchangeRate(fromToken, toToken);
        setExchangeRate(rate);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        setExchangeRate(0);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchRate();
  }, [fromToken, toToken]);

  // Calculate "to" amount when "from" amount or exchange rate changes
  useEffect(() => {
    if (amountIn && exchangeRate > 0) {
      const amount = parseFloat(amountIn) * exchangeRate;
      // Adjust for token decimals difference
      const adjustedAmount = amount * (10 ** fromToken.decimals / 10 ** toToken.decimals);
      setAmountOut(adjustedAmount.toFixed(6)); // Show 6 decimal places
    } else {
      setAmountOut('');
    }
  }, [amountIn, exchangeRate, fromToken.decimals, toToken.decimals]);

  const handleSwap = async (e) => {
    e.preventDefault();
    if (!isConnected || !walletClient || !isCorrectNetwork) return;

    try {
      const amount = parseUnits(amountIn, fromToken.decimals); 
      const recipient = address;

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

  const handleTokenSelect = (token, type) => {
    if (type === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowTokenSelector(null);
  };

  const swapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  const TokenSelector = ({ onSelect, currentToken }) => {
    const tokens = [
      { symbol: 'USDC', decimals: 6 },
      { symbol: 'ETH', decimals: 18 },
      { symbol: 'DAI', decimals: 18 },
      { symbol: 'WBTC', decimals: 8 },
    ];

    return (
      <div className="token-selector-modal">
        <div className="token-selector-content">
          <h3>Select a token</h3>
          <div className="token-list">
            {tokens.map((token) => (
              <button
                key={token.symbol}
                className={`token-item ${currentToken.symbol === token.symbol ? 'selected' : ''}`}
                onClick={() => onSelect(token)}
              >
                {token.symbol}
              </button>
            ))}
          </div>
          <button 
            className="close-selector"
            onClick={() => setShowTokenSelector(null)}
          >
            Close
          </button>
        </div>
      </div>
    );
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
        <h2>Gasless Token Swap</h2>
        <div className="user-info">
          <span className="user-address">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <span className="network-badge">Arbitrum Sepolia</span>
        </div>
      </div>
      
      <form onSubmit={handleSwap} className="swap-form">
        <div className="swap-section">
          <div className="section-header">
            <span>You pay</span>
            <span>Balance: 0 {fromToken.symbol}</span>
          </div>
          <div className="token-input-container">
            <input
              type="number"
              step="0.000001"
              min="0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              required
              className="amount-input"
            />
            <button 
              type="button" 
              className="token-select-button"
              onClick={() => setShowTokenSelector('from')}
            >
              {fromToken.symbol}
              <span>▼</span>
            </button>
          </div>
        </div>

        <div className="swap-arrow">
          <button 
            type="button" 
            className="swap-direction-button"
            onClick={swapTokens}
          >
            ↓
          </button>
        </div>

        <div className="swap-section">
          <div className="section-header">
            <span>You receive</span>
            <span>Balance: 0 {toToken.symbol}</span>
          </div>
          <div className="token-input-container">
            <input
              type="number"
              step="0.000001"
              min="0"
              value={isLoadingRate ? 'Loading...' : amountOut}
              placeholder="0.0"
              className="amount-input"
              readOnly
            />
            <button 
              type="button" 
              className="token-select-button"
              onClick={() => setShowTokenSelector('to')}
            >
              {toToken.symbol}
              <span>▼</span>
            </button>
          </div>
          {exchangeRate > 0 && !isLoadingRate && (
            <div className="rate-info">
              1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSwapping || !amountIn || !walletClient || isLoadingRate}
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

      {showTokenSelector === 'from' && (
        <TokenSelector 
          onSelect={(token) => handleTokenSelect(token, 'from')} 
          currentToken={fromToken}
        />
      )}

      {showTokenSelector === 'to' && (
        <TokenSelector 
          onSelect={(token) => handleTokenSelect(token, 'to')} 
          currentToken={toToken}
        />
      )}

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
        <div className="success-message">
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