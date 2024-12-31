import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-gray-100 text-gray-800 min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold  mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600">Effective Date: 2024-12-30.</p>

        <p className="mt-4">
          Welcome to Xahau Docproof. Your privacy is critically important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our decentralized Web3 services.
        </p>

        <h2 className="text-2xl font-semibold mt-6">Information We Collect</h2>
        <p className="mt-2">
          We operate with a privacy-first approach. The only user-related data we process is:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>
            <strong>Email Address:</strong> The recipient's email address, used solely to notify them as one of the parties required to sign the document.
          </li>
          <li>
            <strong>Blockchain Wallet Address:</strong> Used to identify participants in the signing process.
          </li>
          <li>
            <strong>File Hash (SHA-256):</strong> A cryptographic hash of the uploaded document to ensure integrity and verification, without storing the actual file contents.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6">How We Use Your Information</h2>
        <p className="mt-2">Your information is used to:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Facilitate the signing process in a decentralized manner.</li>
          <li>Ensure document integrity and verify participation.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6">Sharing Your Information</h2>
        <p className="mt-2">
          We do not sell or share your personal information. However, the following may occur:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>
            Email addresses are only used for notifying involved parties and are not exposed publicly.
          </li>
          <li>
            Blockchain wallet addresses and transaction data are inherently public due to the nature of decentralized networks.
          </li>
          <li>
            The file hash (SHA-256) is stored to ensure document verification but does not reveal document contents.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6">Your Rights</h2>
        <p className="mt-2">You have the right to:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Verify the integrity of your document using the stored file hash.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6">Data Security</h2>
        <p className="mt-2">
          We implement industry-standard security measures to protect your data. Blockchain data is public and immutable, so while email addresses are kept private, wallet addresses and hashes are inherently visible.
        </p>

        <h2 className="text-2xl font-semibold mt-6">Changes to This Policy</h2>
        <p className="mt-2">
          We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
        </p>

        <p className="mt-4">Thank you for trusting Xahau Docproof with your information.</p>
      </div>
    </div>
  );
}
