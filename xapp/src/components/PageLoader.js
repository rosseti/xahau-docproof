import React from "react";

export default function PageLoader() {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-white z-50">
      <div className="loading loading-spinner loading-lg text-base-content"></div>
      {/* <span className="ml-4 text-lg text-base-content">Loading...</span> */}
    </div>
  );
}
