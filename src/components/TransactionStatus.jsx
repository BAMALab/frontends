export function TransactionStatus({ result, isLoading, error }) {
    if (isLoading) {
      return (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-700 font-medium">Processing transaction...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <h3 className="text-xl font-semibold text-red-700 mb-4">Transaction Failed</h3>
          <p className="text-red-600">{error}</p>
        </div>
      );
    }
  
    if (result) {
      return (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
          <h3 className="text-xl font-semibold text-green-700 mb-4 text-center">Transaction Successful!</h3>
          <div className="flex flex-col gap-3 mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm"><span className="font-semibold text-gray-700">User Operation Hash:</span> <span className="font-mono text-gray-600 text-xs break-all">{result.userOpHash}</span></p>
            <p className="text-sm"><span className="font-semibold text-gray-700">Transaction Hash:</span> <span className="font-mono text-gray-600 text-xs break-all">{result.transactionHash}</span></p>
            <a 
              href={`https://sepolia.arbiscan.io/tx/${result.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition-all hover:translate-x-1"
            >
              View on Arbitrum Sepolia Explorer
            </a>
          </div>
        </div>
      );
    }
  
    return null;
  }