import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Eye, X, GitCompare } from 'lucide-react';
import * as XLSX from 'xlsx';
import ReactDiffViewer from 'react-diff-viewer';
import { diffWords } from 'diff';

// Professional Red Lining Comparison Component with Error Handling
const RedLiningViewer = ({ sourceText, finalText, sourceLabel = "Original text", finalLabel = "Changed text" }) => {
  // Add conservative spacing for readability while preserving diff accuracy
  const formatText = (text) => {
    try {
      if (!text || typeof text !== 'string') return '';
      
      return text
        .trim()
        // Add space after section numbers (e.g., "132." or "130A.") - more conservative
        .replace(/(\d+[A-Z]?\.)\s*([A-Z])/g, '$1 $2')
        // Add line break only after major section breaks
        .replace(/(\d+[A-Z]?\.\s*[A-Z][^.]*\.)\s*([A-Z])/g, '$1\n\n$2')
        // Add line break after subsection markers like "(1)", "(2)", etc.
        .replace(/(\([0-9]+\))\s*([a-z])/g, '$1 $2')
        // Ensure single spaces after periods
        .replace(/\.\s+/g, '. ')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
    } catch (error) {
      console.error('Error formatting text:', error);
      return text || '';
    }
  };

  const sourceClean = formatText(sourceText);
  const finalClean = formatText(finalText);

  // Debug logging
  console.log('RedLiningViewer props:', { sourceText: !!sourceText, finalText: !!finalText, sourceLabel, finalLabel });
  console.log('Formatted text lengths:', { source: sourceClean.length, final: finalClean.length });

    // Fallback component for errors
  if (!sourceClean && !finalClean) {
    return (
      <div className="border border-gray-300 rounded-lg bg-white p-6">
        <div className="text-center text-gray-500">
          <GitCompare size={24} className="mx-auto mb-2" />
          <p>No text available for comparison</p>
        </div>
      </div>
    );
  }

  // Simple fallback diff viewer
  const SimpleDiffViewer = () => {
    const diff = diffWords(sourceClean || '', finalClean || '');
    
    // Debug the diff results
    console.log('Diff results:', diff);
    console.log('Source text:', JSON.stringify(sourceClean?.substring(0, 100)));
    console.log('Final text:', JSON.stringify(finalClean?.substring(0, 100)));
    
    const renderSourceText = () => {
      const elements = [];
      diff.forEach((part, index) => {
        if (part.removed) {
          elements.push(
            <span key={index} className="bg-red-300 text-red-900 line-through decoration-2 font-bold">
              {part.value}
            </span>
          );
        } else if (!part.added) {
          elements.push(<span key={index}>{part.value}</span>);
        }
        // Skip added parts in source view
      });
      return elements;
    };

    const renderFinalText = () => {
      const elements = [];
      diff.forEach((part, index) => {
        if (part.added) {
          elements.push(
            <span key={index} className="bg-green-300 text-green-900 font-bold">
              {part.value}
            </span>
          );
        } else if (!part.removed) {
          elements.push(<span key={index}>{part.value}</span>);
        }
        // Skip removed parts in final view
      });
      return elements;
    };

    const hasChanges = diff.some(part => part.added || part.removed);
    const changesCount = diff.filter(part => part.added || part.removed).length;

    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Status Bar */}
        <div className={`p-2 text-xs ${hasChanges ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
          {hasChanges ? (
            <>✨ {changesCount} change{changesCount !== 1 ? 's' : ''} detected</>
          ) : (
            <>✅ No differences found - texts are identical</>
          )}
        </div>
        
        {/* Diff Content */}
        <div className="flex h-80">
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-100 border-b border-gray-300 p-3 border-r border-gray-300">
              <span className="font-medium text-gray-700">{sourceLabel}</span>
              {hasChanges && (
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  {diff.filter(p => p.removed).length} deletions
                </span>
              )}
            </div>
            <div className="flex-1 p-3 overflow-y-auto text-sm leading-relaxed border-r border-gray-300">
              {renderSourceText()}
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <span className="font-medium text-gray-700">{finalLabel}</span>
              {hasChanges && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  {diff.filter(p => p.added).length} additions
                </span>
              )}
            </div>
            <div className="flex-1 p-3 overflow-y-auto text-sm leading-relaxed">
              {renderFinalText()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  try {
    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Custom Header */}
        <div className="bg-gray-100 border-b border-gray-300 p-3">
          <div className="flex items-center gap-4">
            <GitCompare size={16} className="text-gray-600" />
            <span className="font-medium text-gray-700">Text Comparison</span>
            <span className="text-sm text-gray-500">
              {sourceLabel} vs {finalLabel}
            </span>
          </div>
        </div>
        
        {/* Try ReactDiffViewer, fallback to simple viewer */}
        <div className="h-96 overflow-hidden">
          <SimpleDiffViewer />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering diff viewer:', error);
    return (
      <div className="border border-red-300 rounded-lg bg-red-50 p-6">
        <div className="text-center text-red-600">
          <X size={24} className="mx-auto mb-2" />
          <p className="font-medium">Error loading comparison</p>
          <p className="text-sm mt-1">Check console for details</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

const NDAAReferenceInterface = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplexity, setSelectedComplexity] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState({}); // For grouping expansion
  const [showRedlining, setShowRedlining] = useState({}); // For red lining comparison
  
  const itemsPerPage = 50;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch the Excel file from the public folder
        const response = await fetch('./NDAA_Bill_References_V5_with_text.xlsx');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { cellStyles: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        setData(jsonData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = data.filter(row => {
      const matchesSearch = !searchTerm || 
        Object.values(row).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesComplexity = !selectedComplexity || 
        row.reference_complexity === selectedComplexity;
      
      const matchesSourceType = !selectedSourceType || 
        row.source_bill_type === selectedSourceType;
      
      return matchesSearch && matchesComplexity && matchesSourceType;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, selectedComplexity, selectedSourceType, sortField, sortDirection]);

  // Group the filtered data
  const groupedData = useMemo(() => {
    // Group primarily by header, then handle section number conflicts
    const groups = {};
    filteredData.forEach(row => {
      // Use header as primary key for grouping similar sections
      const headerKey = row.header;
      
      if (!groups[headerKey]) {
        groups[headerKey] = { 
          key: headerKey, 
          rows: [], 
          sectionNumbers: new Set(),
          representativeSection: row.referenced_section_number
        };
      }
      
      groups[headerKey].rows.push(row);
      groups[headerKey].sectionNumbers.add(row.referenced_section_number);
    });

    // Convert to array and sort by the first section number encountered
    return Object.values(groups).sort((a, b) => {
      const aSection = parseInt(a.representativeSection) || 999999;
      const bSection = parseInt(b.representativeSection) || 999999;
      return aSection - bSection;
    });
  }, [filteredData]);

  // Paginate after grouping
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedData.slice(start, start + itemsPerPage);
  }, [groupedData, currentPage]);

  const totalPages = Math.ceil(groupedData.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleExpand = (key) => {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRedlining = (key) => {
    setShowRedlining(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openDiffTool = (sources, finalText, agreementPhrases = [], finalLabel = 'H.R. 5009 Final') => {
    // Create diff tool page content - now supports multiple sources and agreement phrases
    const diffToolHTML = createDiffToolHTML(sources, finalText, agreementPhrases, finalLabel);
    
    // Open in new window - wider for 3 panels
    const windowWidth = sources.length > 1 ? 1600 : 1200;
    const newWindow = window.open('', '_blank', `width=${windowWidth},height=800,scrollbars=yes,resizable=yes`);
    newWindow.document.write(diffToolHTML);
    newWindow.document.close();
  };

  const createDiffToolHTML = (sources, finalText, agreementPhrases, finalLabel) => {
    const formatText = (text) => {
      if (!text || typeof text !== 'string') return '';
      return text
        .trim()
        .replace(/(\d+[A-Z]?\.)\s*([A-Z])/g, '$1 $2')
        .replace(/(\d+[A-Z]?\.\s*[A-Z][^.]*\.)\s*([A-Z])/g, '$1\n\n$2')
        .replace(/(\([0-9]+\))\s*([a-z])/g, '$1 $2')
        .replace(/\.\s+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const finalClean = formatText(finalText);
    const sourcesClean = sources.map(source => ({
      text: formatText(source.text),
      label: source.label
    }));

    const sourceLabels = sourcesClean.map(s => s.label).join(' + ');
    const numPanels = sourcesClean.length + 1; // sources + final

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diff Tool - ${sourceLabels} vs ${finalLabel}</title>
    <script src="https://unpkg.com/diff@5.1.0/dist/diff.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            height: 100vh;
            overflow: auto;
        }
        .diff-header {
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            padding: 16px 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .diff-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .diff-subtitle {
            color: #6b7280;
            font-size: 14px;
        }
        .diff-container {
            display: grid;
            grid-template-columns: repeat(${numPanels}, 1fr);
            height: calc(100vh - 180px);
            gap: 0;
        }
        .diff-panel {
            display: flex;
            flex-direction: column;
            background: white;
            border-right: 1px solid #e5e7eb;
        }
        .diff-panel:last-child {
            border-right: none;
        }
        .panel-header {
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            padding: 12px 16px;
            font-weight: 500;
            color: #374151;
            font-size: 14px;
            text-align: center;
        }
        .panel-content {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            overflow-x: hidden;
            line-height: 1.6;
            font-size: 14px;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: calc(100vh - 240px);
        }
        .removed {
            background-color: #fecaca;
            color: #991b1b;
            text-decoration: line-through;
            font-weight: bold;
        }
        .added {
            background-color: #bbf7d0;
            color: #166534;
            font-weight: bold;
        }
        .status-bar {
            background: #eff6ff;
            color: #1e40af;
            padding: 8px 16px;
            font-size: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .final-panel {
            background: #f0fdf4 !important;
        }
        .agreement-phrases {
            background: #fef3c7;
            border-bottom: 1px solid #e5e7eb;
            padding: 16px 24px;
            border-left: 4px solid #f59e0b;
        }
        .agreement-title {
            font-size: 16px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        .agreement-content {
            color: #78350f;
            font-size: 14px;
            line-height: 1.5;
        }
        .agreement-item {
            margin-bottom: 6px;
            padding-left: 12px;
            position: relative;
        }
        .agreement-item:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="diff-header">
        <div class="diff-title">Legislative Text Comparison</div>
        <div class="diff-subtitle">${sourceLabels} vs ${finalLabel}</div>
    </div>
    
    ${agreementPhrases && agreementPhrases.length > 0 ? `
    <div class="agreement-phrases">
        <div class="agreement-title">Conference Committee Agreement</div>
        <div class="agreement-content">
            ${agreementPhrases.map(phrase => `<div class="agreement-item">${phrase}</div>`).join('')}
        </div>
    </div>
    ` : ''}
    
    <div class="status-bar" id="statusBar">
        Analyzing differences...
    </div>
    
    <div class="diff-container">
        ${sourcesClean.map((source, index) => `
            <div class="diff-panel">
                <div class="panel-header">${source.label}</div>
                <div class="panel-content" id="sourceContent${index}"></div>
            </div>
        `).join('')}
        <div class="diff-panel">
            <div class="panel-header final-panel">${finalLabel}</div>
            <div class="panel-content" id="finalContent"></div>
        </div>
    </div>

    <script>
        const sources = ${JSON.stringify(sourcesClean)};
        const finalText = ${JSON.stringify(finalClean)};
        
        let totalChanges = 0;
        
        // Process each source against final text
        sources.forEach((source, index) => {
            const diff = Diff.diffWords(source.text, finalText);
            
            let sourceHTML = '';
            let finalHTML = '';
            
            diff.forEach(part => {
                const value = part.value;
                if (part.removed) {
                    sourceHTML += '<span class="removed">' + escapeHtml(value) + '</span>';
                    totalChanges++;
                } else if (part.added) {
                    finalHTML += '<span class="added">' + escapeHtml(value) + '</span>';
                    totalChanges++;
                } else {
                    sourceHTML += escapeHtml(value);
                    finalHTML += escapeHtml(value);
                }
            });
            
            document.getElementById('sourceContent' + index).innerHTML = sourceHTML;
            
            // Only update final content once (from first source)
            if (index === 0) {
                document.getElementById('finalContent').innerHTML = finalHTML;
            }
        });
        
        const statusBar = document.getElementById('statusBar');
        if (totalChanges > 0) {
            statusBar.textContent = \`✨ \${totalChanges} total changes detected across all sources\`;
            statusBar.style.background = '#eff6ff';
            statusBar.style.color = '#1e40af';
        } else {
            statusBar.textContent = '✅ No differences found - all texts are identical';
            statusBar.style.background = '#f0fdf4';
            statusBar.style.color = '#166534';
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
  };

  const complexityOptions = [...new Set(data.map(row => row.reference_complexity))].filter(Boolean);
  const sourceTypeOptions = [...new Set(data.map(row => row.source_bill_type))].filter(Boolean);

  const DetailModal = ({ row, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Section Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Basic Information</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Section:</strong> {row.referenced_section_number}</div>
                <div><strong>Header:</strong> {row.header}</div>
                <div><strong>Complexity:</strong> <span className={`px-2 py-1 rounded text-xs ${
                  row.reference_complexity === 'No References' ? 'bg-gray-100 text-gray-800' :
                  row.reference_complexity === 'Single Reference' ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }`}>{row.reference_complexity}</span></div>
                <div><strong>Source Type:</strong> {row.source_bill_type}</div>
                <div><strong>Word Count:</strong> {row.word_count}</div>
                <div><strong>Text Length:</strong> {row.text_length}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">References</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Bill References:</strong> {row.all_references_found}</div>
                <div><strong>Agreement Phrases:</strong> {row.agreement_phrases}</div>
                <div><strong>Section Found in Source:</strong> {row.section_found_in_source ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Full Text</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
              {row.full_text}
            </div>
          </div>
          
          {row.source_full_section_text && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Source Section Text</h3>
              <div className="bg-blue-50 p-4 rounded-lg text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                {row.source_full_section_text}
              </div>
            </div>
          )}
          
          {/* NEW: ENR BILL TEXT */}
          {row['H.R. 5009 ENR Text'] && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">H.R. 5009 Enrolled Bill Text</h3>
              <div className="bg-green-50 p-4 rounded-lg text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                {row['H.R. 5009 ENR Text']}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading NDAA Bill References...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">
          Error loading data: {error}
          <div className="text-sm text-gray-600 mt-2">
            Make sure NDAA_Bill_References_V5.xlsx is in the public folder
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">NDAA Bill References Interface</h1>
        <p className="text-gray-600">Browse and search through {data.length} bill references</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search in all fields..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={selectedComplexity}
            onChange={(e) => {
              setSelectedComplexity(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Complexities</option>
            {complexityOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          
          <select
            value={selectedSourceType}
            onChange={(e) => {
              setSelectedSourceType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Source Types</option>
            {sourceTypeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {paginatedGroups.length} groups of {groupedData.length} total sections ({filteredData.length} individual records)
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Header
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('reference_complexity')}
                >
                  Complexity
                  {sortField === 'reference_complexity' && (
                    sortDirection === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source Type
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('word_count')}
                >
                  Words
                  {sortField === 'word_count' && (
                    sortDirection === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  References
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedGroups.map(group => {
                const first = group.rows[0];             // representative
                const isOpen = expandedKeys[group.key];  // expanded?

                return (
                  <React.Fragment key={group.key}>
                    {/* ------------- PARENT ROW (always visible) ------------- */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleExpand(group.key)}
                          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                        >
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {group.rows.length > 1 ? (
                            <span className="ml-1 text-blue-600">{group.rows.length} versions</span>
                          ) : (
                            'Details'
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {first.header}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          first.reference_complexity === 'No References' ? 'bg-gray-100 text-gray-800' :
                          first.reference_complexity === 'Single Reference' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {first.reference_complexity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {/* list distinct bill types in the group */}
                        {[...new Set(group.rows.map(r => r.source_bill_type))].join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {first.word_count}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {first.all_references_found || 'None'}
                      </td>
                    </tr>

                    {/* ------------- EXPANDED PANEL (per‑version rows) ------- */}
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 p-4">
                          {group.rows.length === 1 ? (
                            // Single version - show detailed view
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-gray-700">Section Details</h3>
                                <span className="text-sm text-gray-500">{group.rows[0].source_bill_type}</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-gray-600 mb-2">Basic Information</h4>
                                  <div className="text-sm space-y-1">
                                    <div><strong>Word Count:</strong> {group.rows[0].word_count}</div>
                                    <div><strong>References:</strong> {group.rows[0].all_references_found || 'None'}</div>
                                    <div><strong>Agreement Phrases:</strong> {group.rows[0].agreement_phrases || 'None'}</div>
                                  </div>
                                </div>
                                
                                                                 <div>
                                   <div className="flex justify-between items-center mb-2">
                                     <h4 className="font-medium text-gray-600">Source Text</h4>
                                     {group.rows[0]['H.R. 5009 ENR Text'] && (
                                       <button
                                         onClick={() => {
                                           const sources = [{
                                             text: group.rows[0].source_full_section_text,
                                             label: `${group.rows[0].source_bill_type === 'HOUSE_RDS' ? 'House' : 'Senate'} Version`
                                           }];
                                           
                                           // Extract agreement phrases
                                           const agreementPhrases = group.rows[0]?.agreement_phrases || [];
                                           const phrasesArray = Array.isArray(agreementPhrases) ? agreementPhrases : 
                                                              (typeof agreementPhrases === 'string' ? 
                                                               agreementPhrases.replace(/[\[\]']/g, '').split(',').map(s => s.trim()).filter(s => s) : 
                                                               []);
                                           
                                           openDiffTool(sources, group.rows[0]['H.R. 5009 ENR Text'], phrasesArray);
                                         }}
                                         className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-blue-700"
                                       >
                                         <GitCompare size={12} />
                                         Diff Tool
                                       </button>
                                     )}
                                   </div>
                                   
                                   <div className="bg-white p-4 rounded border text-sm max-h-60 overflow-y-auto leading-relaxed">
                                     {group.rows[0].source_full_section_text || 'No source text available'}
                                   </div>
                                 </div>
                              </div>
                              
                              {group.rows[0]['H.R. 5009 ENR Text'] && (
                                <div>
                                  <h4 className="font-medium text-gray-600 mb-2">H.R. 5009 Enrolled Bill Text</h4>
                                  <div className="bg-green-50 p-3 rounded border text-sm max-h-40 overflow-y-auto">
                                    {group.rows[0]['H.R. 5009 ENR Text']}
                                  </div>
                                </div>
                              )}
                              
                              {/* Joint Explanatory Statement */}
                              {group.rows[0].full_text && (
                                <div>
                                  <h4 className="font-medium text-gray-600 mb-2">Joint Explanatory Statement</h4>
                                  <div className="bg-blue-50 p-3 rounded border text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
                                    {group.rows[0].full_text}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            // Multiple versions - show side by side comparison
                            <div className="space-y-4">
                              <h3 className="font-semibold text-gray-700">Version Comparison ({group.rows.length} versions)</h3>
                              
                              {/* Basic info comparison */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {group.rows.map((row, idx) => (
                                  <div key={idx} className="border rounded-lg p-3 bg-white">
                                    <div className="font-medium text-blue-600 mb-2">
                                      {row.source_bill_type === 'HOUSE_RDS' ? 'House Version' :
                                       row.source_bill_type === 'SENATE_RS' ? 'Senate Version' :
                                       row.source_bill_type}
                                    </div>
                                    <div className="text-sm space-y-1">
                                      <div><strong>Section:</strong> {row.referenced_section_number}</div>
                                      <div><strong>Words:</strong> {row.word_count}</div>
                                      <div><strong>References:</strong> {row.all_references_found || 'None'}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Side-by-side source text comparison */}
                              <div>
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-medium text-gray-600">Source Text Comparison</h4>
                                                                     <button
                                     onClick={() => {
                                       // Prepare sources array
                                       const finalText = group.rows.find(row => row['H.R. 5009 ENR Text'])?.['H.R. 5009 ENR Text'] || '';
                                       
                                       // Add all unique source versions
                                       const uniqueSources = new Map();
                                       group.rows.forEach(row => {
                                         if (row.source_full_section_text) {
                                           const key = row.source_bill_type;
                                           if (!uniqueSources.has(key)) {
                                             uniqueSources.set(key, {
                                               text: row.source_full_section_text,
                                               label: row.source_bill_type === 'HOUSE_RDS' ? 'House Version' : 
                                                      row.source_bill_type === 'SENATE_RS' ? 'Senate Version' : 
                                                      row.source_bill_type
                                             });
                                           }
                                         }
                                       });
                                       
                                       const sourcesArray = Array.from(uniqueSources.values());
                                       
                                       // Extract agreement phrases from the first row that has them
                                       const agreementPhrases = group.rows[0]?.agreement_phrases || [];
                                       const phrasesArray = Array.isArray(agreementPhrases) ? agreementPhrases : 
                                                          (typeof agreementPhrases === 'string' ? 
                                                           agreementPhrases.replace(/[\[\]']/g, '').split(',').map(s => s.trim()).filter(s => s) : 
                                                           []);
                                       
                                       if (sourcesArray.length > 0 && finalText) {
                                         openDiffTool(sourcesArray, finalText, phrasesArray);
                                       }
                                     }}
                                     className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-2 hover:bg-blue-700"
                                   >
                                     <GitCompare size={14} />
                                     Open Diff Tool
                                   </button>
                                </div>
                                
                                                                 <div className="space-y-8">
                                   {group.rows.map((row, idx) => (
                                     <div key={idx} className="space-y-3">
                                       <div className="font-medium text-blue-600 text-sm border-b border-blue-200 pb-2">
                                         {row.source_bill_type === 'HOUSE_RDS' ? 'House Version' :
                                          row.source_bill_type === 'SENATE_RS' ? 'Senate Version' :
                                          row.source_bill_type} - Section {row.referenced_section_number}
                                       </div>
                                       <div className="bg-white border rounded p-4 text-sm max-h-60 overflow-y-auto leading-relaxed whitespace-pre-line">
                                         {row.source_full_section_text || 'No source text available'}
                                       </div>
                                       {idx < group.rows.length - 1 && (
                                         <div className="my-8">
                                           <div className="border-t border-gray-200"></div>
                                           <div className="h-4"></div>
                                           <div className="text-center text-gray-400 text-xs">• • •</div>
                                           <div className="h-4"></div>
                                         </div>
                                       )}
                                     </div>
                                   ))}
                                 </div>
                              </div>
                              
                              {/* ENR text if available */}
                              {group.rows.some(row => row['H.R. 5009 ENR Text']) && (
                                <div>
                                  <h4 className="font-medium text-gray-600 mb-3">H.R. 5009 Enrolled Bill Text</h4>
                                  <div className="bg-green-50 border border-green-200 rounded p-3 text-sm max-h-60 overflow-y-auto">
                                    {group.rows.find(row => row['H.R. 5009 ENR Text'])?.['H.R. 5009 ENR Text']}
                                  </div>
                                </div>
                              )}
                              
                              {/* Joint Explanatory Statement (from full_text) */}
                              <div>
                                <h4 className="font-medium text-gray-600 mb-3">Joint Explanatory Statement</h4>
                                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                                  {group.rows[0].full_text || 'No explanatory statement text available'}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRow && (
        <DetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
};

export default NDAAReferenceInterface;