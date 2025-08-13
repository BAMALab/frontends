import { useState, useCallback, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { CHAIN } from '../utils/constants.js';

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletClient, setWalletClient] = useState(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      console.error('No wallet found');
      throw new Error('No wallet found');
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected accounts:', accounts);
      
      // Create wallet client
      const client = createWalletClient({
        chain: CHAIN,
        transport: custom(window.ethereum),
      });

      const [address] = await client.getAddresses();
      console.log('Wallet client address:', address);
      
      setAccount(address);
      setWalletClient(client);
      
      return { address, client };
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

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) {
        console.error('No wallet found');
        return;
      }
      
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log('Existing accounts on mount:', accounts);
        
        if (accounts.length > 0) {
          const client = createWalletClient({
            chain: CHAIN,
            transport: custom(window.ethereum),
          });
          
          const [address] = await client.getAddresses();
          console.log('Auto-connected to:', address);
          
          setAccount(address);
          setWalletClient(client);
        }
      } catch (error) {
        console.error('Error checking existing connection:', error);
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      console.log('Accounts changed:', accounts);
      
      if (accounts.length === 0) {
        // User disconnected
        setAccount(null);
        setWalletClient(null);
      } else {
        // User switched accounts
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

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const isConnected = Boolean(account && walletClient);

  // Debug logging
  useEffect(() => {
    console.log('useWallet state:', {
      account,
      walletClient: !!walletClient,
      isConnected,
    });
  }, [account, walletClient, isConnected]);

  return {
    account,
    walletClient,
    isConnecting,
    connect,
    disconnect,
    isConnected,
  };
}