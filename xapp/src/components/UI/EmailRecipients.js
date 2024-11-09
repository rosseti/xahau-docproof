import React, { useState } from "react";
import { X } from "lucide-react";

const EmailRecipients = ({
  emails = [],
  onEmailsChange,
  maxEmails,
  className = "",
}) => {
  const [currentEmail, setCurrentEmail] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  };

  const addEmail = () => {
    const trimmedEmail = currentEmail.trim();

    if (!trimmedEmail) return;

    if (!validateEmail(trimmedEmail)) {
      setError("Email inválido");
      return;
    }

    if (emails.includes(trimmedEmail)) {
      setError("Este email já foi adicionado");
      return;
    }

    if (maxEmails && emails.length >= maxEmails) {
      setError(`Número máximo de ${maxEmails} emails atingido`);
      return;
    }

    onEmailsChange([...emails, trimmedEmail]);
    setCurrentEmail("");
    setError("");
  };

  const removeEmail = (emailToRemove) => {
    onEmailsChange(emails.filter((email) => email !== emailToRemove));
  };

  return (
    <div className={`w-full max-w-2xl ${className}`}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Signers {maxEmails && `(${emails.length}/${maxEmails})`}
        </label>
        <div className="min-h-24 p-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <div className="flex flex-wrap gap-2 mb-2">
            {emails.map((email, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
              >
                <span className="text-sm">{email}</span>
                <button
                  onClick={() => removeEmail(email)}
                  className="hover:text-blue-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <input
            type="email"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            autoFocus={true}
            onKeyDown={handleKeyDown}
            className="w-full border-none focus:outline-none bg-transparent"
            placeholder="Type an email and press Enter"
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default EmailRecipients;
