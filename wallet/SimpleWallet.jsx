import React, { useState, useEffect } from "react";

function SimpleWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);

  const handleConnect = () => {
    // Simulate wallet connection
    setIsConnected(true);
    setAddress("0x1234...5678");
    setBalance(1000.5);
    
    // Dispatch event to game
    window.dispatchEvent(new CustomEvent("walletConnected", {
      detail: { 
        address: "0x1234...5678",
        balance: 1000.5,
        authenticated: true
      }
    }));
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress("");
    setBalance(0);
    
    // Dispatch event to game
    window.dispatchEvent(new CustomEvent("walletDisconnected", {
      detail: { authenticated: false }
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid #676FFF',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '280px',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ 
          color: isConnected ? '#00ff88' : '#ff4444',
          marginRight: '8px'
        }}>
          ●
        </span>
        <span>{isConnected ? 'Connected' : 'Not Connected'}</span>
      </div>

      {isConnected ? (
        <div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: '#676FFF' }}>Address:</div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{address}</div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#cccccc' }}>Balance:</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{balance.toFixed(4)} MON</div>
          </div>
          
          <button 
            onClick={handleDisconnect}
            style={{
              width: '100%',
              padding: '10px',
              background: 'linear-gradient(135deg, #ff4444 0%, #cc3333 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          onClick={handleConnect}
          style={{
            width: '100%',
            padding: '10px',
            background: 'linear-gradient(135deg, #676FFF 0%, #8B5CF6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Login (Test)
        </button>
      )}
    </div>
  );
}

export default SimpleWallet;


