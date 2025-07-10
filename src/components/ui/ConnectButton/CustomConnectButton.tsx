import { ConnectButton } from '@rainbow-me/rainbowkit';
import React from 'react';
import styles from './CustomConnectButton.module.css';


export const CustomConnectButton: React.FC = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
            className={styles.connectButtonContainer}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={openConnectModal}
                    type="button"
                    className={styles.connectButton}
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal} 
                    type="button"
                    className={`${styles.connectButton} ${styles.wrongNetwork}`}
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className={styles.connectedContainer}>
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={styles.chainButton}
                  >
                    {chain.hasIcon && (
                      <div className={styles.chainIconWrapper}>
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className={styles.chainIcon}
                          />
                        )}
                      </div>
                    )}
                    {/* {chain.name} */}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={styles.accountButton}
                  >
                    {account.displayName}
                  
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

