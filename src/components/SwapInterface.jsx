import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { arbitrumSepolia } from 'wagmi/chains';
import { useSwap } from '../hooks/useSwap.js';
import { TransactionStatus } from './TransactionStatus.jsx';
import { getExchangeRate, getTokenPriceInUSD } from '../utils/priceOracle.js';

// Token address mapping for Arbitrum Sepolia
const TOKEN_ADDRESSES = {
  'USDC': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  'ETH': '0x6d521a93A3B1fEF995026eBD537405EBD4A1E481',   // Wrapped ETH
  'DAI': '0x00571860bB39C639e8aAD55B4E95D36BE228ae11',
  'WBTC': '0x2297aEbD383787A160DD0d9F71508148769342E3',  // Wrapped BTC (example)
};

// Real-time exchange rate fetching using Chainlink price feeds
const getRealTimeExchangeRate = async (fromToken, toToken) => {
  try {
    // Use Chainlink price oracle for real-time rates
    const rate = await getExchangeRate(fromToken.symbol, toToken.symbol);
    return rate;
  } catch (error) {
    console.error('Error fetching real-time exchange rate:', error);
    // Fallback to default rate
    return 1;
  }
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
  const [fromTokenPrice, setFromTokenPrice] = useState(0);
  const [toTokenPrice, setToTokenPrice] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState(1); // 1%

  const isCorrectNetwork = chainId === arbitrumSepolia.id;

  // Fetch real-time exchange rate and token prices when tokens change
  useEffect(() => {
    const fetchPricesAndRate = async () => {
      setIsLoadingRate(true);
      try {
        // Fetch both token prices and exchange rate in parallel
        const [rate, fromPrice, toPrice] = await Promise.all([
          getRealTimeExchangeRate(fromToken, toToken),
          getTokenPriceInUSD(fromToken.symbol),
          getTokenPriceInUSD(toToken.symbol)
        ]);
        
        setExchangeRate(rate);
        setFromTokenPrice(fromPrice);
        setToTokenPrice(toPrice);
      } catch (error) {
        console.error('Error fetching prices and exchange rate:', error);
        setExchangeRate(0);
        setFromTokenPrice(0);
        setToTokenPrice(0);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchPricesAndRate();
    
    // Set up periodic price updates every 30 seconds
    const interval = setInterval(fetchPricesAndRate, 30000);
    
    return () => clearInterval(interval);
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

    // Validation
    if (!amountIn || parseFloat(amountIn) <= 0) {
      console.error('Please enter a valid amount');
      return;
    }

    try {
      const amount = parseUnits(amountIn, fromToken.decimals); 
      const recipient = address;
      
      // Calculate minimum output with user-defined slippage tolerance
      const expectedOut = parseFloat(amountOut);
      const slippageMultiplier = (100 - slippageTolerance) / 100; // e.g., 99% for 1% slippage
      const minOutWithSlippage = expectedOut * slippageMultiplier;
      const amountOutMinimum = parseUnits(minOutWithSlippage.toString(), toToken.decimals);
      
      // Validate token addresses exist
      const fromAddress = TOKEN_ADDRESSES[fromToken.symbol];
      const toAddress = TOKEN_ADDRESSES[toToken.symbol];
      
      if (!fromAddress || !toAddress) {
        throw new Error(`Token address not found for ${fromToken.symbol} or ${toToken.symbol}`);
      }
      
      // Determine swap direction based on token addresses (lexicographical order)
      const zeroForOne = fromAddress.toLowerCase() < toAddress.toLowerCase();

      await performSwap({
        walletClient,
        amountIn: amount,
        amountOutMin: amountOutMinimum,
        zeroForOne,
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
      { 
        symbol: 'USDC', 
        decimals: 6, 
        address: TOKEN_ADDRESSES.USDC, 
        name: 'USD Coin',
        logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
      },
      { 
        symbol: 'ETH', 
        decimals: 18, 
        address: TOKEN_ADDRESSES.ETH, 
        name: 'Ethereum',
        logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
      },
      { 
        symbol: 'DAI', 
        decimals: 18, 
        address: TOKEN_ADDRESSES.DAI, 
        name: 'Dai Stablecoin',
        logoUrl: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png'
      },
      { 
        symbol: 'WBTC', 
        decimals: 8, 
        address: TOKEN_ADDRESSES.WBTC, 
        name: 'Wrapped Bitcoin',
        logoUrl: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png'
      },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Select a token</h2>
            <button 
              onClick={() => setShowTokenSelector(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or paste address"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
              />
            </div>
          </div>

          {/* Popular tokens */}
          <div className="px-6 pt-4">
            <div className="flex gap-2 mb-4">
              {['ETH', 'USDC', 'DAI'].map(symbol => (
                <button 
                  key={symbol}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-full transition-colors"
                  onClick={() => onSelect(tokens.find(t => t.symbol === symbol))}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Token List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 px-2 pb-6">
              {tokens.map((token) => (
                <button
                  key={token.symbol}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all text-left ${
                    currentToken.symbol === token.symbol 
                      ? 'bg-pink-50 border border-pink-200' 
                      : ''
                  }`}
                  onClick={() => onSelect(token)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-600">
                      {token.symbol.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{token.symbol}</span>
                      {currentToken.symbol === token.symbol && (
                        <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 truncate">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Balance</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-violet-500 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect a wallet</h2>
            <p className="text-gray-500 text-sm mb-6">Get started by connecting your wallet.</p>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-emerald-600 text-sm">⚡</span>
                </div>
                <span className="text-sm text-gray-700">Gasless transactions</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🔒</span>
                </div>
                <span className="text-sm text-gray-700">Powered by Account Abstraction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wrong Network</h3>
            <p className="text-gray-500 text-sm mb-6">Please switch to Arbitrum Sepolia to continue.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-gray-900">Swap</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-b border-gray-100 p-4 bg-gray-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slippage Tolerance
                </label>
                <div className="flex gap-2">
                  {[0.5, 1, 3].map(value => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSlippageTolerance(value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        slippageTolerance === value
                          ? 'bg-pink-100 text-pink-700 border-2 border-pink-200'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <div className="flex-1 max-w-20">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={slippageTolerance}
                      onChange={(e) => setSlippageTolerance(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-pink-300 focus:outline-none"
                      placeholder="Custom"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Swap Form */}
        <form onSubmit={handleSwap} className="p-4 space-y-1">
          {/* From Token Input */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">You pay</span>
              <div className="text-right">
                <div className="text-sm text-gray-500">Balance: 0</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full bg-transparent border-none text-3xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
                {amountIn && fromTokenPrice > 0 && (
                  <div className="text-sm text-gray-500 mt-1">
                    ~${(parseFloat(amountIn) * fromTokenPrice).toFixed(2)}
                  </div>
                )}
              </div>
              <button 
                type="button" 
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-2xl px-4 py-3 font-medium text-gray-900 transition-all"
                onClick={() => setShowTokenSelector('from')}
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  {fromToken.symbol.charAt(0)}
                </div>
                <span>{fromToken.symbol}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center -my-1 relative z-10">
            <button 
              type="button" 
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 border-4 border-white rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all hover:rotate-180 duration-200 shadow-sm"
              onClick={swapTokens}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

          {/* To Token Input */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">You receive</span>
              <div className="text-right">
                <div className="text-sm text-gray-500">Balance: 0</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={isLoadingRate ? '' : amountOut}
                  placeholder={isLoadingRate ? 'Calculating...' : '0'}
                  className="w-full bg-transparent border-none text-3xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                  readOnly
                />
                {amountOut && toTokenPrice > 0 && !isLoadingRate && (
                  <div className="text-sm text-gray-500 mt-1">
                    ~${(parseFloat(amountOut) * toTokenPrice).toFixed(2)}
                  </div>
                )}
              </div>
              <button 
                type="button" 
                className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-2xl px-4 py-3 font-medium text-gray-900 transition-all"
                onClick={() => setShowTokenSelector('to')}
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  {toToken.symbol.charAt(0)}
                </div>
                <span>{toToken.symbol}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Swap Route */}
          {exchangeRate > 0 && !isLoadingRate && amountIn && (
            <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 mx-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Route</span>
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Best route</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                    {fromToken.symbol.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{fromToken.symbol}</span>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-blue-300"></div>
                <div className="text-xs bg-white rounded px-2 py-1 text-blue-600 font-medium">
                  Gasless
                </div>
                <div className="flex-1 border-t-2 border-dashed border-blue-300"></div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                    {toToken.symbol.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{toToken.symbol}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
                {fromTokenPrice > 0 && toTokenPrice > 0 && (
                  <span className="ml-2 opacity-75">
                    (${fromTokenPrice.toFixed(2)} → ${toTokenPrice.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Swap Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSwapping || !amountIn || !walletClient || isLoadingRate}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-lg"
            >
              {isSwapping ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Swapping...</span>
                </>
              ) : !amountIn || parseFloat(amountIn) === 0 ? (
                <span>Enter an amount</span>
              ) : (
                <>
                  <span>Swap</span>
                </>
              )}
            </button>
          </div>

          {/* Gasless Info */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Gasless • Fees paid with USDC</span>
            </div>
            {isLoadingRate && (
              <div className="flex items-center justify-center gap-2 text-xs text-blue-600 mt-3">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                Updating prices...
              </div>
            )}
          </div>
        </form>
      </div>

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

      <TransactionStatus 
        result={swapResult} 
        isLoading={isSwapping} 
        error={error} 
      />

      {error && (
        <div className="text-center mt-4">
          <button 
            onClick={clearError} 
            className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}