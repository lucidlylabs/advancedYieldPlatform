import { useRouter } from "next/router";
import { YieldDetailsView } from "@/components/yield-details-view";
import React , {useState, useEffect} from "react";
import { ArrowLeft } from "lucide-react";

interface MarketItem {
    id: number;
    name: string;
    type: string;
    baseYield: string;
    incentives: string[];
    tvl: string;
    description?: string;
    riskLevel?: string;
    network?: string;
    contractAddress?: string;
}

const YieldDetailPage = () => {
  const router = useRouter();
  const { name, tvl, baseApy, contractAddress, network, data } = router.query;
  const [showDepositView, setShowDepositView] = useState(false);
  const [parsedData, setParsedData] = useState<MarketItem[]>([]);

  console.log("YieldDetailPage data:", data ,name , tvl, baseApy, contractAddress, network);

  if (!name) return <div className="text-white p-4">Loading...</div>;

  function handleOpenDepositView() {
    setShowDepositView(true);
  }

  function handleCloseDepositView() {
    setShowDepositView(false);
  }

  useEffect(() => {
    if (data && typeof data === "string") {
      try {
        const decoded = decodeURIComponent(data);
        const parsed = JSON.parse(decoded);
        setParsedData(parsed);
      } catch (err) {
        console.error("Failed to decode data:", err);
      }
    }
  }, [data]);

  return (
    <div className="min-h-screen p-4 text-white">
      <button className="text-lg" onClick={() => router.back()}>
        <ArrowLeft className="mr-2" />
      </button>
      <YieldDetailsView
        name={name as string}
        tvl={tvl as string}
        baseApy={baseApy as string}
        contractAddress={contractAddress as string}
        network={network as string}
        data={parsedData}
        onOpenDepositView={handleOpenDepositView}
      />
    </div>
  );
};

export default YieldDetailPage;