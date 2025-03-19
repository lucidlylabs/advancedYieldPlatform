import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <div>
      <main>
        <ConnectButton />
      </main>
    </div>
  );
};

export default Home;
