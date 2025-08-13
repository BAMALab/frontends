
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { CHAIN } from '../utils/constants.js';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletClient, setWalletClient] = useState(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('No wallet found');
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const client = createWalletClient({
        chain: CHAIN,
        transport: custom(window.ethereum),
      });

      const [address] = await client.getAddresses();
      
      setAccount(address);
      setWalletClient(client);
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setWalletClient(null);
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          const client = createWalletClient({
            chain: CHAIN,
            transport: custom(window.ethereum),
          });
          
          const [address] = await client.getAddresses();
          
          setAccount(address);
          setWalletClient(client);
        }
      } catch (error) {
        console.error('Error checking existing connection:', error);
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setWalletClient(null);
      } else {
        try {
          const client = createWalletClient({
            chain: CHAIN,
            transport: custom(window.ethereum),
          });
          
          const [address] = await client.getAddresses();
          setAccount(address);
          setWalletClient(client);
        } catch (error) {
          console.error('Error handling account change:', error);
        }
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
  }, []);

  const isConnected = Boolean(account && walletClient);

  const value = {
    account,
    walletClient,
    isConnecting,
    connect,
    disconnect,
    isConnected,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

