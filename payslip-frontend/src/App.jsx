// import { useState } from 'react'
// import FileUpload from './components/FileUpload'
// import QAInterface from './components/QAInterface'

// function App() {
//   const [currentFile, setCurrentFile] = useState(null)
//   const [chatHistory, setChatHistory] = useState([])

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-8">
//       <header className="mb-8 text-center">
//         <h1 className="text-3xl font-bold text-blue-600 mb-2">
//           Payslip Analysis System
//         </h1>
//         <p className="text-gray-600">Upload PDF and ask questions</p>
//       </header>

//       <main className="max-w-4xl mx-auto">
//         {!currentFile ? (
//           <FileUpload 
//             onUploadSuccess={(filename) => setCurrentFile(filename)}
//           />
//         ) : (
//           <QAInterface
//             filename={currentFile}
//             chatHistory={chatHistory}
//             setChatHistory={setChatHistory}
//             onReset={() => setCurrentFile(null)}
//           />
//         )}
//       </main>
//     </div>
//   )
// }

// export default App



















import { useState } from 'react';
import FileUpload from './components/FileUpload';
import QAInterface from './components/QAInterface';

export default function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  const handleFileUpload = (filename) => {
    setCurrentFile(filename);
    setChatHistory([]);
  };

  const handleReset = () => {
    setCurrentFile(null);
    setChatHistory([]);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {!currentFile ? (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Payslip Analyzer</h1>
              <p className="text-xl text-gray-600">
                Get instant insights from your payslip with AI-powered analysis
              </p>
            </div>
            <FileUpload onUploadSuccess={handleFileUpload} />
          </>
        ) : (
          <QAInterface
            filename={currentFile}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            onReset={handleReset}
          />
        )}
        
        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2025 Payslip Analyzer. Your data remains private and secure.</p>
        </div>
      </div>
    </div>
  );
}