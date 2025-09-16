import React from "react";

const faqItems = [
  {
    question: "Do I need to update xahau.toml for each new document?",
    answer:
      "No! Just sign the document with your private key and keep your public key in xahau.toml.",
  },
  {
    question: "What if I lose my private key?",
    answer:
      "Generate a new key pair and update your xahau.toml with the new public key.",
  },
  {
    question: "Can I have multiple public keys?",
    answer:
      "Yes! Just add more [[DOCPROOF]] blocks to your xahau.toml.",
  },
  {
    question: "Can anyone verify my documents?",
    answer: "Yes! It’s open and transparent.",
  },
];

export default function DocproofGenesisPage() {
  return (
    <div className="bg-base-200 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-4 text-primary">
            Docproof Genesis – Proof of Document Origin
          </h1>

          <h2 className="text-2xl font-semibold mb-2">
            What is Xahau Docproof Genesis?
          </h2>
          <p className="mb-6">
            <strong>Xahau Docproof Genesis</strong> is a solution that guarantees a digital document (such as a PDF) was truly issued by the claimed author. Using blockchain technology and digital signatures, anyone can transparently and easily verify the authenticity and origin of a document.
          </p>

          <div className="divider"></div>

          <h2 className="text-xl font-semibold mb-2">How Does It Work?</h2>
          <ol className="list-decimal ml-6 mb-6">
            <li className="mb-2">
              <strong>Domain Public Key</strong> – The website owner publishes their public key in a file called <code>xahau.toml</code>, located at the root of their domain. <br />
              <span className="text-xs">Example: <code>https://yourdomain.com/.well-known/xahau.toml</code></span>
            </li>
            <li className="mb-2">
              <strong>Document Signing</strong> – The document (PDF) is digitally signed using the private key that corresponds to the published public key. The signing process can be automated or manual, depending on your needs.
            </li>
            <li className="mb-2">
              <strong>Verification</strong> – Anyone can download the document, access the issuer’s <code>xahau.toml</code> file, and confirm that the document was indeed signed by that domain.
            </li>
          </ol>

          <div className="divider"></div>

          <h2 className="text-xl font-semibold mb-2">Why Use It?</h2>
          <ul className="list-disc ml-6 mb-6">
            <li><strong>Trust:</strong> Ensures the document came from the true issuer.</li>
            <li><strong>Convenience:</strong> The domain can sign as many documents as needed without updating the xahau.toml for each one.</li>
            <li><strong>Decentralization:</strong> Uses open standards and blockchain technology.</li>
            <li><strong>Security:</strong> The private key is always controlled by the domain owner.</li>
          </ul>

          <div className="divider"></div>

          <h2 className="text-xl font-semibold mb-2">How to Set Up in 3 Easy Steps</h2>
          <ol className="list-decimal ml-6 mb-6">
            <li className="mb-2">
              <strong>Generate Your Public/Private Key Pair:</strong> Use secure tools to create a key pair. Store your private key safely!
            </li>
            <li className="mb-2">
              <strong>Publish Your Public Key in xahau.toml:</strong> Create the <code>xahau.toml</code> file on your domain and add:
              <div className="mockup-code bg-base-200 text-black mt-2">
                <pre data-prefix="1">{`[[DOCPROOF]]`}</pre>
                <pre data-prefix="2">{`address = "rAccountAddress"`}</pre>
                <pre data-prefix="3">{`desc = "Xahau Docproof"`}</pre>
                <pre data-prefix="4">{`pubkey = """`}</pre>
                <pre data-prefix="5">{`-----BEGIN PUBLIC KEY-----`}</pre>
                <pre data-prefix="6">{`MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr2c2QkIwFG3ksLNziUOd`}</pre>
                <pre data-prefix="7">{`...`}</pre>
                <pre data-prefix="8">{`-----END PUBLIC KEY-----`}</pre>
                <pre data-prefix="9">{`"""`}</pre>
              </div>
            </li>
            <li className="mb-2">
              <strong>Sign Your Documents:</strong> Use your private key to digitally sign your PDFs. You can use any trusted tool (such as Adobe Reader, OpenSSL, or other digital signature software).
            </li>
          </ol>

          <div className="divider"></div>

          <h2 className="text-xl font-semibold mb-2">How to Verify a Document</h2>
          <ol className="list-decimal ml-6 mb-6">
            <li>Receive the PDF document and the issuer’s website address.</li>
            <li>Access the <code>xahau.toml</code> file published on the issuer’s domain.</li>
            <li>Use Docproof to verify if the document was signed by the available public key.</li>
          </ol>

          <div className="divider"></div>

          <h2 className="text-xl font-semibold mb-2">Revoking or Changing a Key</h2>
          <ul className="list-disc ml-6 mb-6">
            <li><strong>To revoke:</strong> Simply remove the <code>[[DOCPROOF]]</code> block from your <code>xahau.toml</code> file.</li>
            <li><strong>To change:</strong> Remove the old block and publish a new one with your new public key.</li>
          </ul>

          <div className="divider"></div>

          <h2 className="text-xl font-semibold mb-2">FAQ – Frequently Asked Questions</h2>
          <div className="join join-vertical w-full mb-6">
            {faqItems.map((item, idx) => (
              <div key={idx} className="collapse collapse-arrow join-item border border-base-300 bg-base-100">
                <input type="checkbox" className="peer" />
                <div className="collapse-title text-lg font-medium">{item.question}</div>
                <div className="collapse-content">{item.answer}</div>
              </div>
            ))}
          </div>

          <div className="divider"></div>

          <h2 className="text-xl font-semibold mb-2">Try It Now!</h2>
          <p className="mb-6">
            Sign your documents and validate their origin for free with the security of Xahau blockchain.
          </p>
          <a
            href="#"
            className="btn btn-primary btn-wide"
          >
            Access Docproof
          </a>
        </div>
      </div>
    </div>
  );
}