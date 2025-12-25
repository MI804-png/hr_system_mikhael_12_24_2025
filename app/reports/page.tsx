'use client';

import { useState } from 'react';

export default function Reports() {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [generatedReports, setGeneratedReports] = useState([
    { id: 1, name: 'December Report', date: '2025-12-24', type: 'Employee Summary', size: '2.4 MB' },
    { id: 2, name: 'November Report', date: '2025-11-30', type: 'Attendance Report', size: '1.8 MB' },
    { id: 3, name: 'October Report', date: '2025-10-31', type: 'Payroll Summary', size: '3.1 MB' },
  ]);

  const reportTemplates = [
    { id: 1, name: 'Employee Summary Report', category: 'HR', description: 'Complete list of all employees with departments and positions' },
    { id: 2, name: 'Attendance Report', category: 'Attendance', description: 'Monthly attendance statistics and employee punctuality' },
    { id: 3, name: 'Payroll Summary', category: 'Payroll', description: 'Detailed payroll breakdown with taxes and deductions' },
    { id: 4, name: 'Performance Analytics', category: 'Performance', description: 'Employee performance ratings and review summaries' },
    { id: 5, name: 'Recruitment Pipeline', category: 'Recruitment', description: 'Open positions and application status tracking' },
    { id: 6, name: 'Financial Statement', category: 'Finance', description: 'Complete financial breakdown and expense analysis' },
  ];

  const handleGenerateReport = (reportName: string) => {
    alert(`📊 Generating ${reportName}...\n\nThis may take a few moments.`);
    setTimeout(() => {
      setGeneratedReports([
        {
          id: Math.random(),
          name: `${reportName} - ${new Date().toLocaleDateString()}`,
          date: new Date().toLocaleDateString(),
          type: reportName,
          size: `${(Math.random() * 4 + 1).toFixed(1)} MB`,
        },
        ...generatedReports,
      ]);
      alert('✓ Report generated successfully!');
    }, 1500);
  };

  const handleDownloadReport = (name: string, id: number) => {
    setDownloadingReport(String(id));
    
    // Simulate download
    setTimeout(() => {
      const element = document.createElement('a');
      const file = new Blob(['Report data'], { type: 'application/pdf' });
      element.href = URL.createObjectURL(file);
      element.download = `${name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setDownloadingReport(null);
      alert(`✓ Downloaded: ${name}.pdf`);
    }, 1000);
  };

  const handleDeleteReport = (id: number, name: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      setGeneratedReports(generatedReports.filter(r => r.id !== id));
      alert(`✓ Report "${name}" deleted successfully`);
    }
  };

  const handleImportPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate file is PDF
      if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
        alert('❌ Please select a valid PDF file');
        return;
      }

      // Extract report name from filename (remove .pdf extension)
      const reportName = file.name.replace('.pdf', '').replace(/_/g, ' ');
      
      // Get file size in MB
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(1);

      // Create new report entry
      const newReport = {
        id: Math.random(),
        name: reportName,
        date: new Date().toLocaleDateString(),
        type: 'PDF Report',
        size: `${fileSizeInMB} MB`,
      };

      // Add to reports list
      setGeneratedReports([newReport, ...generatedReports]);
      alert(`✓ Successfully imported: ${reportName}.pdf`);

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('PDF import error:', error);
      alert('❌ Failed to import PDF file. Please try again.');
    }
  };

  const handleExportExcel = () => {
    if (generatedReports.length === 0) {
      alert('No reports available to export. Generate a report first.');
      return;
    }
    
    // Create CSV content from reports
    const csvContent = [
      ['Report Name', 'Type', 'Date', 'Size'].join(','),
      ...generatedReports.map(r => [r.name, r.type, r.date, r.size].join(','))
    ].join('\n');

    // Create and download file
    const element = document.createElement('a');
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    element.href = URL.createObjectURL(file);
    element.download = `HR_Reports_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    alert('✓ Exported to Excel successfully!');
  };

  const handleExportPDF = () => {
    if (generatedReports.length === 0) {
      alert('No reports available to export. Generate a report first.');
      return;
    }

    // Create PDF-like content
    const pdfContent = `
HR SYSTEM - GENERATED REPORTS
Generated on: ${new Date().toLocaleString()}

REPORT SUMMARY
====================
Total Reports: ${generatedReports.length}
Total Size: ${(generatedReports.reduce((sum, r) => sum + parseFloat(r.size), 0)).toFixed(1)} MB

DETAILED REPORTS
====================
${generatedReports.map((r, i) => `
${i + 1}. ${r.name}
   Type: ${r.type}
   Date: ${r.date}
   Size: ${r.size}
`).join('')}

This is an automated export from the HR Management System.
    `;

    // Create and download file
    const element = document.createElement('a');
    const file = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
    element.href = URL.createObjectURL(file);
    element.download = `HR_Reports_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    alert('✓ Exported to PDF successfully!\n\nNote: To convert to PDF, use your browser\'s print feature (Ctrl+P) and select "Save as PDF".');
  };

  const handleShareReport = () => {
    if (generatedReports.length === 0) {
      alert('No reports available to share. Generate a report first.');
      return;
    }

    const reportList = generatedReports
      .slice(0, 5)
      .map(r => `• ${r.name} (${r.type}) - ${r.date}`)
      .join('\n');

    const emailSubject = 'HR System Report Summary';
    const emailBody = `Hi,

I wanted to share these HR reports generated from our HR Management System:

${reportList}

These reports contain important insights about our organization's operations.

Best regards,
HR Department`;

    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;

    // Show confirmation
    setTimeout(() => {
      alert('✓ Opening your default email client...\n\nThe report summary has been pre-filled in the email body.');
    }, 100);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Generate, download, and manage HR reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generate New Reports */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Generate New Report</h2>
              <label className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium cursor-pointer text-sm">
                📄 Import PDF
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleImportPDF}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600 mb-4">Select a report template to generate</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleGenerateReport(template.name)}
                  className="text-left p-4 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
                >
                  <p className="font-semibold text-gray-900">{template.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{template.category}</p>
                  <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateReport(template.name);
                    }}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm"
                  >
                    Generate
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Reports */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Reports</h2>
            {generatedReports.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reports generated yet. Create one above to get started.</p>
            ) : (
              <div className="space-y-3">
                {generatedReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{report.name}</p>
                      <p className="text-sm text-gray-600">{report.type} • {report.size} • Generated: {report.date}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDownloadReport(report.name, report.id)}
                        disabled={downloadingReport === String(report.id)}
                        className={`px-4 py-2 rounded font-medium transition ${
                          downloadingReport === String(report.id)
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {downloadingReport === String(report.id) ? '⬇️ Downloading...' : '⬇️ Download'}
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id, report.name)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report Statistics */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Report Statistics</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Reports Generated</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{generatedReports.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {(generatedReports.reduce((sum, r) => sum + parseFloat(r.size), 0)).toFixed(1)} MB
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Most Recent</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{generatedReports[0]?.date || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Export</h3>
            <div className="space-y-2">
              <button 
                onClick={handleExportExcel}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm"
              >
                📊 Export to Excel
              </button>
              <button 
                onClick={handleExportPDF}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium text-sm"
              >
                📄 Export to PDF
              </button>
              <button 
                onClick={handleShareReport}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium text-sm"
              >
                📈 Share Report
              </button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">💡 Tip:</span> Reports are automatically deleted after 30 days. Download important reports to archive them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
