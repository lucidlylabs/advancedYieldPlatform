import { useRouter } from "next/router";
import { YieldDetailsView } from "@/components/yield-details-view";
import React from "react";
import { ArrowLeft } from "lucide-react";

const YieldDetailPage = () => {
  const router = useRouter();
  const { name, tvl, baseApy, contractAddress, network } = router.query;

  if (!name) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0D101C] p-4 text-white">
      <button className="text-lg" onClick={() => router.back()}>
        <ArrowLeft className="mr-2" />
      </button>
      <YieldDetailsView
        name={name as string}
        tvl={tvl as string}
        baseApy={baseApy as string}
        contractAddress={contractAddress as string}
        network={network as string}
      />
    </div>
  );
};

export default YieldDetailPage;