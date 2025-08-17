'use client';

import { useState } from 'react';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [csvData, setCsvData] = useState('');

  // CSVダウンロード処理
  const handleExtractCSV = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    setResult('Processing...');

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/pdf-to-data', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const csv = await response.text();
        setCsvData(csv);
        
        // CSVをダウンロード
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        setResult('CSV downloaded. You can also download as Excel.');
      } else {
        const error = await response.text();
        setResult(`Error: ${error}`);
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Excelダウンロード処理
  const handleExcelDownload = async () => {
    if (!csvData) {
      alert('Please extract CSV first.');
      return;
    }

    try {
      // xlsx ライブラリを動的にインポート（クライアントサイドのみ）
      const XLSX = (await import('xlsx')).default;
      
      // CSVをExcelに変換
      const workbook = XLSX.read(csvData, { type: 'string' });
      XLSX.writeFile(workbook, 'data.xlsx');
    } catch (error) {
      setResult(`Error creating Excel: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] flex flex-col items-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-10 max-w-md w-full">
        <h1 className="text-xl font-semibold mb-3">
          PDF to Structured Data (CSV/Excel)
        </h1>
        
        <p className="text-gray-600 text-sm mb-6">
          Upload a PDF file. Instantly extract tables and key fields as CSV or Excel.
          <br />No signup needed.
        </p>

        <form onSubmit={handleExtractCSV} className="mb-4">
          <input
            type="file"
            name="pdf"
            accept="application/pdf"
            required
            className="mb-3 w-full text-sm"
            disabled={isProcessing}
          />
          
          <div className="flex gap-3 flex-col sm:flex-row">
            <button
              type="submit"
              disabled={isProcessing}
              className="bg-[#2274fb] hover:bg-[#195ecb] text-white border-0 rounded-lg px-5 py-2.5 text-base cursor-pointer min-w-[130px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Extract & Download CSV'}
            </button>
            
            <button
              type="button"
              onClick={handleExcelDownload}
              disabled={isProcessing || !csvData}
              className="bg-[#2274fb] hover:bg-[#195ecb] text-white border-0 rounded-lg px-5 py-2.5 text-base cursor-pointer min-w-[130px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Extract & Download Excel
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-4 text-sm text-gray-700">
            {result}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-400">
          Powered by GPT-3.5 Turbo · For demo use only
        </div>
        
        <div className="mt-2 text-xs text-green-600">
          <strong>Note:</strong> Uploaded files are <strong>never</strong> stored on our servers. 
          All processing is done securely and files are deleted immediately.
        </div>
      </div>
    </div>
  );
}