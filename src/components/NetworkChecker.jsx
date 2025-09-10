import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { useEffect } from 'react';

export function NetworkChecker({ children }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isCorrectNetwork = chainId === arbitrumSepolia.id;

  // Automatically switch to Arbitrum Sepolia when connected
  useEffect(() => {
    if (isConnected && !isCorrectNetwork && switchChain) {
      switchChain({ chainId: arbitrumSepolia.id });
    }
  }, [isConnected, isCorrectNetwork, switchChain]);

  // Show loading while switching
  if (isPending) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center mb-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500 mx-auto mb-3"></div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Switching to Arbitrum Sepolia...</h3>
          <p className="text-yellow-700">Please confirm the network switch in your wallet.</p>
        </div>
      </div>
    );
  }

  // Show error if on wrong network
  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center mb-8">
          <h3 className="text-xl font-semibold text-red-700 mb-4">⚠️ Wrong Network</h3>
          <p className="text-red-600 mb-2">This app only works on Arbitrum Sepolia testnet.</p>
          <p className="text-sm text-red-500 mb-1">Current network: {chainId}</p>
          <p className="text-sm text-red-500 mb-4">Required network: Arbitrum Sepolia ({arbitrumSepolia.id})</p>
          
          <button 
            onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-6"
            disabled={isPending}
          >
            Switch to Arbitrum Sepolia
          </button>
          
          <div className="bg-black/10 p-4 rounded-lg text-left">
            <h4 className="font-semibold text-yellow-800 mb-3">How to add Arbitrum Sepolia to MetaMask:</h4>
            <ul className="space-y-1 text-sm">
              <li className="font-mono"><span className="font-sans font-medium">Network Name:</span> Arbitrum Sepolia</li>
              <li className="font-mono"><span className="font-sans font-medium">RPC URL:</span> https://sepolia-rollup.arbitrum.io/rpc</li>
              <li className="font-mono"><span className="font-sans font-medium">Chain ID:</span> 421614</li>
              <li className="font-mono"><span className="font-sans font-medium">Currency Symbol:</span> ETH</li>
              <li className="font-mono"><span className="font-sans font-medium">Block Explorer:</span> https://sepolia.arbiscan.io/</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show correct network status
  if (isConnected && isCorrectNetwork) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center mb-8">
          <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
            ✅ Arbitrum Sepolia
          </span>
        </div>
        {children}
      </div>
    );
  }

  // Not connected - just show children (connect button will be visible)
  return <div className="max-w-2xl mx-auto">{children}</div>;
}