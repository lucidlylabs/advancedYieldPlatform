import React, { useState } from 'react';
import PortfolioSubpage from './portfolio-subpage'; // Adjust the import path as necessary
import YieldSubpage from './yield-subpage'; // Adjust the import path as necessary
import MarketsSubpage from './markets-subpage'; // Adjust the import path as necessary

enum SubPage {
    Portfolio,
    Yield,
    Markets,
}

const MainPage: React.FC = () => {
    const [selectedSubPage, setSelectedSubPage] = useState<SubPage>(SubPage.Markets); // Initial state

    return (
        <div>
            <h1>Main Page</h1>
            <div>
                <button onClick={() => setSelectedSubPage(SubPage.Portfolio)}>Portfolio</button>
                <button onClick={() => setSelectedSubPage(SubPage.Yield)}>Yield</button>
                <button onClick={() => setSelectedSubPage(SubPage.Markets)}>Markets</button>
            </div>
            {selectedSubPage === SubPage.Portfolio ? <PortfolioSubpage /> : 
             selectedSubPage === SubPage.Yield ? <YieldSubpage /> : 
             <MarketsSubpage />}
        </div>
    );
};

export default MainPage;