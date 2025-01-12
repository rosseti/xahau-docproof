"use client";

import { LandingPage } from "@/components/LP";
import PageLoader from "@/components/PageLoader";
import { AppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { account, isLoading, xumm } = useContext(AppContext);

  useEffect(() => {
    if (!isLoading && account) {
      router.push("/doc/list");
    }
  }, [account, isLoading]);

  if (isLoading) return <PageLoader />;

  return <>
    <LandingPage />
  </>;
}
