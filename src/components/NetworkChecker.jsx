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
      <div className="network-checker">
        <div className="network-status switching">
          <div className="spinner"></div>
          <h3>Switching to Arbitrum Sepolia...</h3>
          <p>Please confirm the network switch in your wallet.</p>
        </div>
      </div>
    );
  }

  // Show error if on wrong network
  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="network-checker">
        <div className="network-status error">
          <h3>⚠️ Wrong Network</h3>
          <p>This app only works on Arbitrum Sepolia testnet.</p>
          <p>Current network: {chainId}</p>
          <p>Required network: Arbitrum Sepolia ({arbitrumSepolia.id})</p>
          
          <button 
            onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
            className="switch-network-btn"
            disabled={isPending}
          >
            Switch to Arbitrum Sepolia
          </button>
          
          <div className="network-info">
            <h4>How to add Arbitrum Sepolia to MetaMask:</h4>
            <ul>
              <li>Network Name: Arbitrum Sepolia</li>
              <li>RPC URL: https://sepolia-rollup.arbitrum.io/rpc</li>
              <li>Chain ID: 421614</li>
              <li>Currency Symbol: ETH</li>
              <li>Block Explorer: https://sepolia.arbiscan.io/</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show correct network status
  if (isConnected && isCorrectNetwork) {
    return (
      <div className="network-checker">
        <div className="network-status success">
          <span className="network-indicator">✅ Arbitrum Sepolia</span>
        </div>
        {children}
      </div>
    );
  }

  // Not connected - just show children (connect button will be visible)
  return <div className="network-checker">{children}</div>;
}