"use client";

import PageLoader from '@/components/PageLoader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.push("/login");    
    }, []);
    
    return <PageLoader />;

    // return (
    //     <>
    //         <div className="container mx-auto py-20 px-4 w-1/2">

    //             <div className="grid grid-cols-2 gap-4 items-center justify-center">
    //                 <div className="py-4">
    //                     <h1 className="text-4xl font-bold pb-4">
    //                         {process.env.NEXT_PUBLIC_APP_NAME || 'SecureSmartSign'}
    //                     </h1>

    //                     <p className="pb-4">Welcome to the most advanced document signinig platform.</p>
    //                     <p className="pb-4">Authenticate yourself in your wallet and start sign documents.</p>

    //                     <MetaMaskLogin />
    //                 </div>
    //                 <div className="p-4">
    //                     <div className="w-100 h-52 overflow-hidden rounded-lg">
                            
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     </>
    // );
}
