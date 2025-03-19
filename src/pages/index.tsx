import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import MainPage from './page';

const Home: NextPage = () => {
  return (
    <div>
      <main>
        <MainPage />
        <ConnectButton />
    
      </main>
    </div>
  );
};

export default Home;
