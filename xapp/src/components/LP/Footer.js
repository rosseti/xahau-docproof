import React from "react";
import { Twitter } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <div className="grid grid-cols-3 gap-2">
            <img
              src="/app-icon.svg"
              alt="Xahau DocProof Logo"
              width={50}
              className="mb-4 rounded-full"
            />
          </div>
          <p className="text-gray-400">
            Secure document signing powered by Xahau Blockchain
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Connect</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="https://twitter.com/XahauDocproof"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-300 hover:text-white"
              >
                <Twitter className="mr-2" size={20} /> Twitter
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Resources</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="https://xahau.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                Xahau Network
              </a>
            </li>
            <li>
              <a
                href="https://docs.xahau.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white"
              >
                Documentation
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Legal</h4>
          <ul className="space-y-2">
            <li>
              <a href="/privacy" className="text-gray-300 hover:text-white">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/terms" className="text-gray-300 hover:text-white">
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500">
        © {currentYear} Xahau DocProof. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
