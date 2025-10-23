import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUpload } from "react-icons/fi";

const Dropzone = ({ onFileChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
  
    const onDrop = (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      onFileChange(acceptedFiles[0]);
      setIsDragging(false);
    };
  
    const { getRootProps, getInputProps } = useDropzone({
      onDrop,
      onDragEnter: () => setIsDragging(true),
      onDragLeave: () => setIsDragging(false),
      accept: {
        'application/pdf': [], // Aceitar apenas PDF
      },
      maxFiles: 1
    });
  
    return (
      <div className="items-center">
        {!file && (<div 
          {...getRootProps()} 
          className={`flex flex-col h-[250px] justify-center items-center border-4 rounded-lg p-6 text-center transition-colors duration-300 
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300 bg-gray-100'} 
            hover:border-blue-400 hover:bg-blue-50`}
        >
          <input {...getInputProps()} />
          {isDragging ? (
            <p className="text-blue-700">Drop your file here ...</p>
          ) : (
            <div className="flex flex-col h-[250px] justify-center items-center">
              <FiUpload className="mx-auto mb-2 text-3xl text-gray-500" />
              <p className="text-gray-600">Drag and drop a file here, or click to select a file</p>
            </div>
          )}
        </div>)}
        
        {file && (
          <div className="mt-2">
            <div className="grid grid-cols-[auto_100px] gap-2 items-center">
              <div><p className="text-gray-700">Selected file: {file.name}</p></div>
              <button  onClick={() => { setFile(null); onFileChange(null) }} className="btn btn-sm glass shadow-lg mt-4 px-4 py-2 w-auto">
                Clear
              </button>
            </div>
            <embed 
              src={URL.createObjectURL(file)} 
              type="application/pdf" 
              width="100%" 
              style={{ height: '350px' }}
              className="mt-2 border rounded"
            />
          </div>
        )}
      </div>
    );
  };

export default Dropzone;
