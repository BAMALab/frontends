
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SwapInterface } from './components/SwapInterface.jsx';
import { NetworkChecker } from './components/NetworkChecker.jsx';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Gasless Token Swap</h1>
        <ConnectButton />
      </header>
      
      <main className="app-main">
        <NetworkChecker>
          <SwapInterface />
        </NetworkChecker>
      </main>
    </div>
  );
}

export default App;