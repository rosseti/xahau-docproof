import React, { useState } from "react";

const ProgressBar = ({ progress = 0, description }) => {
  return (
    <div>
      <div className="w-full bg-gray-300 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-500 mt-2 block">{description}</span>
    </div>
  );
};

export default ProgressBar;
