import { useState } from 'react';


const MetaMaskConnect = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState(null);

  // Function to connect MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access if necessary
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setWalletAddress(accounts[0]);
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError('Connection to MetaMask failed');
      }
    } else {
      setError('MetaMask is not installed');
    }
  };

  return (
    <div>
      <h1>MetaMask Wallet Connection</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {walletAddress ? (
        <div>
          <p>Connected Wallet Address:</p>
          <p>{walletAddress}</p>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect MetaMask</button>
      )}
    </div>
  );
};

export default MetaMaskConnect;
