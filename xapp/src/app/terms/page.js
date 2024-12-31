import React from 'react';

export default function TermsOfService() {
  return (
    <div className="bg-gray-100 text-gray-800 min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600">Effective Date: 2024-12-30</p>

        <p className="mt-4">
          Welcome to Xahau Docproof. By accessing or using our decentralized Web3 services, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
        </p>

        <h2 className="text-2xl font-semibold mt-6">1. Acceptance of Terms</h2>
        <p className="mt-2">
          By using our services, you agree to comply with and be legally bound by these Terms. If you do not agree to these Terms, you may not use our services.
        </p>

        <h2 className="text-2xl font-semibold mt-6">2. Service Description</h2>
        <p className="mt-2">
          Xahau Docproof provides a decentralized platform for document verification and signing. Key features include:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>Signing and verifying documents via blockchain technology.</li>
          <li>Generating and storing cryptographic hashes (SHA-256) of uploaded documents.</li>
          <li>Using wallet addresses for participant identification and verification.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6">3. User Responsibilities</h2>
        <p className="mt-2">
          As a user of Xahau Docproof, you agree to:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>Provide accurate and valid information, including wallet addresses and email addresses for recipients.</li>
          <li>Ensure that the documents you upload comply with applicable laws and do not violate the rights of third parties.</li>
          <li>Take responsibility for managing your private keys and wallet access. We do not store or manage private keys.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6">4. Limitations of Liability</h2>
        <p className="mt-2">
          Xahau Docproof is a decentralized platform, and as such:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>We do not guarantee the immutability or availability of the blockchain networks used.</li>
          <li>We are not responsible for any loss or damages resulting from the use of our services, including but not limited to incorrect wallet addresses or unauthorized access to your wallet.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6">5. Prohibited Activities</h2>
        <p className="mt-2">
          You agree not to use our services for:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>Illegal, fraudulent, or malicious activities.</li>
          <li>Uploading harmful or malicious content.</li>
          <li>Interfering with the functionality of the platform or related blockchain networks.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6">6. Termination</h2>
        <p className="mt-2">
          We reserve the right to terminate or suspend your access to our services at our discretion, without prior notice, if we believe you have violated these Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-6">7. Changes to Terms</h2>
        <p className="mt-2">
          We may update these Terms from time to time. Any changes will be posted on this page with an updated effective date. Continued use of the service constitutes your acceptance of the revised Terms.
        </p>

        <h2 className="text-2xl font-semibold mt-6">8. Governing Law</h2>
        <p className="mt-2">
          These Terms are governed by and construed in accordance with the laws applicable to decentralized platforms and blockchain technology.
        </p>

        <p className="mt-4">Thank you for using Xahau Docproof.</p>
      </div>
    </div>
  );
}
