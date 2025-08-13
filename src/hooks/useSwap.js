import { useState, useCallback } from 'react';
import { executeSwap } from '../utils/swap.js';

export function useSwap() {
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState(null);
  const [error, setError] = useState(null);

  const performSwap = useCallback(async ({
    walletClient,
    amountIn,
    amountOutMin,
    zeroForOne,
    recipientAddress,
  }) => {
    setIsSwapping(true);
    setError(null);
    setSwapResult(null);

    try {
      const result = await executeSwap({
        walletClient,
        amountIn,
        amountOutMin,
        zeroForOne,
        recipientAddress,
      });

      setSwapResult(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsSwapping(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setSwapResult(null);
  }, []);

  return {
    isSwapping,
    swapResult,
    error,
    performSwap,
    clearError,
    clearResult,
  };
}