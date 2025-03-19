import type { NextPage } from 'next';
import {CustomConnectButton} from '../components/ConnectButton/CustomConnectButton';
import MainPage from './page';

const Home: NextPage = () => {
  return (
    <div>
      <main>
        <MainPage />
        <CustomConnectButton />
    
      </main>
    </div>
  );
};

export default Home;
