export function TransactionStatus({ result, isLoading, error }) {
    if (isLoading) {
      return (
        <div className="transaction-status loading">
          <div className="spinner"></div>
          <p>Processing transaction...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="transaction-status error">
          <h3>Transaction Failed</h3>
          <p>{error}</p>
        </div>
      );
    }
  
    if (result) {
      return (
        <div className="transaction-status success">
          <h3>Transaction Successful!</h3>
          <div className="transaction-details">
            <p><strong>User Operation Hash:</strong> {result.userOpHash}</p>
            <p><strong>Transaction Hash:</strong> {result.transactionHash}</p>
            <a 
              href={`https://sepolia.arbiscan.io/tx/${result.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on Arbitrum Sepolia Explorer
            </a>
          </div>
        </div>
      );
    }
  
    return null;
  }