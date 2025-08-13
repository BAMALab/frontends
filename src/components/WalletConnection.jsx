import { useWallet } from '../hooks/useWallet.js';

export function WalletConnection() {
  const { account, isConnecting, connect, disconnect, isConnected } = useWallet();

  if (isConnected) {
    return (
      <div className="wallet-connection connected">
        <p>Connected: {account?.slice(0, 6)}...{account?.slice(-4)}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <div className="wallet-connection">
      <button onClick={connect} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}