"use client";

import PageLoading from "@/components/PageLoader";
import { AppContext } from '@/context/AppContext';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useContext, useEffect } from 'react';

export default function PageSignOptions() {
    const { account, isLoading } = useContext(AppContext);

    const { push } = useRouter();

    useEffect(() => {
        if (!isLoading && !account) {
            push("/login?redirect=/origo/sign");
        }
    }, [account, isLoading]);

     if (isLoading) return <PageLoading />;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#040612]">
            <h1 className="text-5xl font-bold mb-12 text-info">Signing Options</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">

                <Link href="/origo/sign/standalone" className="block">
                    <div className="card bg-base-100 shadow-2xl hover:shadow-3xl transition-shadow duration-300 cursor-pointer h-full">
                        <div className="card-body flex flex-col items-center justify-center text-center">
                            <h2 className="card-title text-3xl mb-4">Standalone Sign (via PFX)</h2>
                            <p className="text-lg mb-6">Use a PFX certificate for secure signing.</p>
                            <button className="btn btn-info btn-lg w-full">Go Standalone!</button>
                        </div>
                    </div>
                </Link>

                <Link href="/origo/sign/wallet" className="block">
                    <div className="card bg-base-100 shadow-2xl hover:shadow-3xl transition-shadow duration-300 cursor-pointer h-full">
                        <div className="card-body flex flex-col items-center justify-center text-center">
                            <h2 className="card-title text-3xl mb-4">Xaman Wallet</h2>
                            <p className="text-lg mb-6">Use your Xaman Wallet for a modern signing experience.</p>
                            <button className="btn btn-info btn-lg w-full">Go Xaman!</button>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}