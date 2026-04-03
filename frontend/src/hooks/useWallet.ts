import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { useStarknetkitConnectModal } from 'starknetkit';
import type { AccountInterface } from 'starknet';

export interface WalletState {
  address: string;
  username?: string;
  raw: AccountInterface;
}

export interface UseWalletReturn {
  wallet: WalletState | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  connectStarknet: () => Promise<string | null>;
  starknetAddress: string | null;
  error: string | null;
  clearError: () => void;
}

export function useWallet(): UseWalletReturn {
  const { login, logout, authenticated, ready } = usePrivy();
  const { account, address: snReactAddress, status } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect: disconnectStarknet } = useDisconnect();
  // @ts-ignore
  const { starknetkitConnectModal } = useStarknetkitConnectModal({ connectors });

  // Local address state — set immediately from connectorData so UI updates instantly
  const [localAddress, setLocalAddress] = useState<string | null>(null);
  const [localAccount, setLocalAccount] = useState<AccountInterface | null>(null);
  const [error, setError] = useState<string | null>(null);

  const starknetAddress = snReactAddress ?? localAddress ?? null;
  const rawAccount = (account as unknown as AccountInterface | undefined) ?? localAccount ?? null;

  const isConnecting = !ready || status === 'connecting' || status === 'reconnecting';
  const isConnected = authenticated && !!starknetAddress && !!rawAccount;

  const wallet: WalletState | null =
    isConnected && starknetAddress && rawAccount
      ? { address: starknetAddress, raw: rawAccount }
      : null;

  const connect = useCallback(() => {
    setError(null);
    login();
  }, [login]);

  const connectStarknet = useCallback(async (): Promise<string | null> => {
    setError(null);
    try {
      const { connector, connectorData } = await starknetkitConnectModal();
      if (!connector) return null;

      // Capture address immediately from connectorData so UI shows connected state
      const addr = connectorData?.account ?? null;
      if (addr) setLocalAddress(addr);

      // Try starknet-react connectAsync for full context integration
      try {
        await connectAsync({ connector });
      } catch {
        // Falls back to local state set above
      }

      // Get the AccountInterface for signing
      try {
        const acc = await connector.account({ nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno/' });
        setLocalAccount(acc as unknown as AccountInterface);
      } catch {
        // Account will come from useAccount() after connectAsync resolves
      }

      return addr;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection failed.');
      return null;
    }
  }, [starknetkitConnectModal, connectAsync]);

  const disconnect = useCallback(async () => {
    await logout();
    disconnectStarknet();
    setLocalAddress(null);
    setLocalAccount(null);
  }, [logout, disconnectStarknet]);

  return {
    wallet,
    isConnecting,
    isConnected,
    connect,
    disconnect,
    connectStarknet,
    starknetAddress,
    error,
    clearError: useCallback(() => setError(null), []),
  };
}

export { useWallet as useStarkzap };
