import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { RouterProvider } from 'react-router-dom';
import { sepolia } from '@starknet-react/chains';
import {
  StarknetConfig,
  publicProvider,
  useInjectedConnectors,
  argent,
  braavos,
} from '@starknet-react/core';
import { router } from './lib/router';
import './index.css';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string;

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

function AppProvider({ children }: { children: React.ReactNode }) {
  const { connectors } = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: 'onlyIfNoConnectors',
  });

  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={publicProvider()}
      connectors={connectors}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}

createRoot(root).render(
  <StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['google'],
        appearance: {
          theme: 'light',
          accentColor: '#4f46e5',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: { createOnLogin: 'off' },
        },
      }}
    >
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </PrivyProvider>
  </StrictMode>,
);
