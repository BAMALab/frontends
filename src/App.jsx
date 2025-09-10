
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SwapInterface } from './components/SwapInterface.jsx';
import { NetworkChecker } from './components/NetworkChecker.jsx';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100">
      {/* Navigation */}
      <nav className="border-b border-white/20 backdrop-blur-sm bg-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Gasless Swap
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-pink-600 font-medium transition-colors">Swap</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 font-medium transition-colors">Pool</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 font-medium transition-colors">Vote</a>
            </div>

            {/* Connect Button */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-3 py-2 text-sm font-medium text-gray-700">
                  Arbitrum Sepolia
                </div>
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <NetworkChecker>
            <SwapInterface />
          </NetworkChecker>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Powered by Account Abstraction</span>
        </div>
      </footer>
    </div>
  );
}

export default App;