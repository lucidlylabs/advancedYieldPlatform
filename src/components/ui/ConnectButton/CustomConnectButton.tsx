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
                    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0.166992 0.666992H12.8337V13.3337H0.166992V0.666992ZM11.4262 11.9262V2.0744H1.5744V11.9262H11.4262ZM7.20403 6.29662H10.0188V7.70403H7.20403H5.79662H2.98181V6.29662H5.79662H7.20403Z" fill="#D7E3EF"/>
                    </svg>
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

