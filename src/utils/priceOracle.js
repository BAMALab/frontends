import { createPublicClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// Chainlink Price Feed Addresses on Arbitrum Sepolia
const PRICE_FEEDS = {
  'ETH/USD': '0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165', // ETH/USD
  'BTC/USD': '0x56a43EB56Da12C0dc1972ACb089c06a5dF9E3093', // BTC/USD
  // USDC/USD is typically 1.00, but we can add feed if needed
  'USDC/USD': '0x0153002d20B96532C639313c2d54c3dA09109309', // USDC/USD
};

// Chainlink Aggregator ABI (minimal)
const AGGREGATOR_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  }
];

// Create public client for price feeds
const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http()
});

/**
 * Get price from Chainlink price feed
 * @param {string} symbol - Token symbol (ETH, BTC, etc.)
 * @returns {Promise<number>} Price in USD
 */
export async function getTokenPriceInUSD(symbol) {
  try {
    const feedAddress = PRICE_FEEDS[`${symbol}/USD`];
    if (!feedAddress) {
      console.warn(`No price feed found for ${symbol}, using fallback`);
      return getFallbackPrice(symbol);
    }

    // Get latest price data
    const [, answer, , updatedAt] = await client.readContract({
      address: feedAddress,
      abi: AGGREGATOR_ABI,
      functionName: 'latestRoundData'
    });

    // Get decimals for proper formatting
    const decimals = await client.readContract({
      address: feedAddress,
      abi: AGGREGATOR_ABI,
      functionName: 'decimals'
    });

    // Convert to USD price
    const price = Number(answer) / Math.pow(10, Number(decimals));
    
    // Check if price is stale (older than 1 hour)
    const now = Math.floor(Date.now() / 1000);
    if (now - Number(updatedAt) > 3600) {
      console.warn(`Price feed for ${symbol} is stale, using fallback`);
      return getFallbackPrice(symbol);
    }

    return price;
  } catch (error) {
    console.error(`Error fetching ${symbol} price from Chainlink:`, error);
    return getFallbackPrice(symbol);
  }
}

/**
 * Fallback prices in case Chainlink feeds are unavailable
 * @param {string} symbol 
 * @returns {number}
 */
function getFallbackPrice(symbol) {
  const fallbackPrices = {
    'ETH': 2000,  // Fallback ETH price
    'BTC': 45000, // Fallback BTC price  
    'WBTC': 45000, // Same as BTC
    'USDC': 1.0,  // USDC should be $1
    'DAI': 1.0,   // DAI should be $1
  };
  
  return fallbackPrices[symbol] || 1.0;
}

/**
 * Get exchange rate between two tokens via USD
 * @param {string} fromSymbol - From token symbol
 * @param {string} toSymbol - To token symbol
 * @returns {Promise<number>} Exchange rate
 */
export async function getExchangeRate(fromSymbol, toSymbol) {
  try {
    // If same token, rate is 1
    if (fromSymbol === toSymbol) {
      return 1.0;
    }

    // Get USD prices for both tokens
    const [fromPrice, toPrice] = await Promise.all([
      getTokenPriceInUSD(fromSymbol),
      getTokenPriceInUSD(toSymbol)
    ]);

    // Calculate exchange rate
    const rate = fromPrice / toPrice;
    
    console.log(`Exchange rate: 1 ${fromSymbol} = ${rate.toFixed(6)} ${toSymbol}`);
    console.log(`${fromSymbol} price: $${fromPrice}, ${toSymbol} price: $${toPrice}`);
    
    return rate;
  } catch (error) {
    console.error('Error calculating exchange rate:', error);
    // Return fallback rate
    return getFallbackExchangeRate(fromSymbol, toSymbol);
  }
}

/**
 * Fallback exchange rates
 * @param {string} fromSymbol 
 * @param {string} toSymbol 
 * @returns {number}
 */
function getFallbackExchangeRate(fromSymbol, toSymbol) {
  const rates = {
    'USDC-ETH': 0.0005,   // 1 USDC = 0.0005 ETH
    'ETH-USDC': 2000,     // 1 ETH = 2000 USDC
    'USDC-DAI': 1,        // 1:1 peg
    'DAI-USDC': 1,
    'USDC-WBTC': 0.000022, // 1 USDC = 0.000022 WBTC
    'WBTC-USDC': 45000,   // 1 WBTC = 45000 USDC
    'ETH-DAI': 2000,
    'DAI-ETH': 0.0005,
    'ETH-WBTC': 0.044,    // 1 ETH = 0.044 WBTC
    'WBTC-ETH': 22.5,     // 1 WBTC = 22.5 ETH
  };

  const pair = `${fromSymbol}-${toSymbol}`;
  return rates[pair] || 1.0;
}

/**
 * Convert amount to USDC value using current prices
 * @param {string} symbol - Token symbol
 * @param {number} amount - Amount of token
 * @returns {Promise<number>} Value in USDC
 */
export async function convertToUSDC(symbol, amount) {
  if (symbol === 'USDC') {
    return amount; // Already USDC
  }

  const rate = await getExchangeRate(symbol, 'USDC');
  return amount * rate;
}

/**
 * Convert USDC amount to target token
 * @param {number} usdcAmount - Amount in USDC
 * @param {string} targetSymbol - Target token symbol
 * @returns {Promise<number>} Amount in target token
 */
export async function convertFromUSDC(usdcAmount, targetSymbol) {
  if (targetSymbol === 'USDC') {
    return usdcAmount; // Already USDC
  }

  const rate = await getExchangeRate('USDC', targetSymbol);
  return usdcAmount * rate;
}