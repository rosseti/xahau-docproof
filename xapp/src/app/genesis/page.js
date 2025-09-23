import Head from "next/head";

export default function XDPGenesis() {
  return (
    <>
      <Head>
        <title>Introducing XDP Genesis | Document Authenticity on Xahau</title>
        <meta name="description" content="A New Era for Document Authenticity on Xahau. Learn more about XDP Genesis, the revolutionary gateway to blockchain-powered proof of origin for documents." />
      </Head>
      <main className="min-h-screen bg-base-200 flex flex-col items-center py-8 px-4">
        <section className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold mb-2 text-primary">Introducing XDP Genesis</h1>
            <h2 className="text-2xl font-semibold text-secondary">A New Era for Document Authenticity on Xahau</h2>
            <div className="mt-4 flex justify-center gap-2">
              <span className="badge badge-primary badge-lg">Blockchain</span>
              <span className="badge badge-secondary badge-lg">DocProof</span>
              <span className="badge badge-accent badge-lg">Xahau</span>
            </div>
          </div>
          <div className="card shadow-xl bg-base-100 mb-8">
            <div className="card-body">
              <h3 className="card-title text-xl mb-2">🚀 What is XDP Genesis?</h3>
              <p>
                <span className="font-bold">XDP Genesis</span> is the revolutionary gateway to creating, signing, and verifying documents with blockchain-powered proof of origin—exclusively on the Xahau network.
              </p>
            </div>
          </div>
          <div className="card shadow-lg bg-base-100 mb-8">
            <div className="card-body">
              <h3 className="card-title text-xl mb-2">💡 Why XDP Genesis?</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-bold">Trust by Design:</span> Only verified Xahau accounts can generate documents, ensuring genuine origin.</li>
                <li><span className="font-bold">Domain Authentication:</span> Link your web domain to your Xahau identity for next-level credibility.</li>
                <li><span className="font-bold">Instant Key Generation:</span> Create secure PFX (P12) key pairs easily, with local encryption.</li>
                <li><span className="font-bold">Seamless Document Signing:</span> Upload, sign, and get documents with watermark + QR code for authenticity verification.</li>
                <li><span className="font-bold">One-Click Verification:</span> Anyone can check the origin and validity of your document—instantly.</li>
              </ul>
            </div>
          </div>
          <div className="card shadow-md bg-base-100 mb-8">
            <div className="card-body">
              <h3 className="card-title text-xl mb-2">🛡️ Built for Security, Designed for Simplicity</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Blockchain-driven, tamper-proof signatures</li>
                <li>Visual watermarks and QR codes for easy checks</li>
                <li>Step-by-step guides for domain setup and authentication</li>
              </ul>
            </div>
          </div>
          <div className="card bg-base-100 mb-8 shadow">
            <div className="card-body">
              <h3 className="card-title text-xl mb-2">🎯 Who is it for?</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Startups, legal teams, freelancers, and anyone who needs to prove document origin online.</li>
                <li>Companies wanting to secure and verify official files, contracts, certificates, and more.</li>
              </ul>
            </div>
          </div>
          <div className="card bg-base-100 mb-10 shadow">
            <div className="card-body">
              <h3 className="card-title text-xl mb-2">📦 Try XDP Genesis Now!</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Generate your keys</li>
                <li>Authenticate your domain</li>
                <li>Sign your document</li>
                <li>Share with confidence</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 mb-8">
            <span className="text-lg font-semibold">Ready for the future of document authenticity?</span>
            <a href="#" className="btn btn-primary btn-lg shadow hover:scale-105 transition-transform duration-200">Get started with XDP Genesis</a>
          </div>
          <div className="text-center text-base-content opacity-70">
            Powered by <a href="https://xahaudocproof.com" className="link link-hover link-secondary">Xahau DocProof</a> | Open. Secure. Verifiable.
          </div>
        </section>
      </main>
    </>
  );
}