import React, { useState } from 'react';
import EarnSubPage from './earn-subpage';
import YieldSubPage from './markets-subpage';
import PortfolioSubPage from './portfolio-subpage';

enum SubPage {
  Earn = "earn",
  Yield = "yield",
  Portfolio = "portfolio",
}

const HomePage: React.FC = () => {
  const [selectedSubPage, setSelectedSubPage] = useState<SubPage>(SubPage.Earn);

  return (
    <div>
      <h1>Welcome to the Web3 Yield Trading App</h1>
      <nav>
        <ul>
          <li><a onClick={() => setSelectedSubPage(SubPage.Earn)}>Earn Page</a></li>
          <li><a onClick={() => setSelectedSubPage(SubPage.Yield)}>Yield Page</a></li>
          <li><a onClick={() => setSelectedSubPage(SubPage.Portfolio)}>Portfolio Page</a></li>
        </ul>
      </nav>
      {selectedSubPage === SubPage.Earn ? <EarnSubPage /> : 
       selectedSubPage === SubPage.Yield ? <YieldSubPage /> : 
       <PortfolioSubPage />}
    </div>
  );
};

export default HomePage;