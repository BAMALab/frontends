import { useWallet } from '../hooks/useWallet.js';

export function WalletConnection() {
  const { account, isConnecting, connect, disconnect, isConnected } = useWallet();

  if (isConnected) {
    return (
      <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-700 font-medium">
          Connected: <span className="font-mono text-sm">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
        </p>
        <button 
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4">
      <button 
        onClick={connect} 
        disabled={isConnecting}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}