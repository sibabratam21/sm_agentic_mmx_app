import React, { useState, useMemo } from 'react';
import { EdaResult, UserColumnSelection, ColumnType, ChannelDiagnostic, EdaInsights, ParsedData } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { Loader } from './Loader';

interface DataValidationProps {
    edaResults: EdaResult[];
    selections: UserColumnSelection;
    onSelectionsChange: (selections: UserColumnSelection) => void;
    insights: EdaInsights | null;
    diagnostics: ChannelDiagnostic[];
    onDiagnosticsChange: (diagnostics: ChannelDiagnostic[]) => void;
    isLoadingInsights: boolean;
    parsedData: ParsedData[];
}

const chartColors = {
  kpi: '#2dd4bf', 
  grid: 'rgba(100, 116, 139, 0.2)',
  text: '#94a3b8',
  bar: '#60a5fa',
}

const calculateCorrelation = (arr1: number[], arr2: number[]): number => {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    const n = arr1.length;
    if (n === 0) return 0;

    for (let i = 0; i < n; i++) {
        const x = arr1[i] || 0;
        const y = arr2[i] || 0;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
    }
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return numerator / denominator;
};

const getCorrelationColor = (value: number) => {
    if (value === 1) return 'bg-slate-700/50';
    if (Math.abs(value) > 0.7) return 'bg-red-500/60';
    if (Math.abs(value) > 0.4) return 'bg-yellow-500/60';
    return 'bg-slate-800/30';
};


export const DataValidation: React.FC<DataValidationProps> = ({ 
    edaResults, 
    selections, 
    onSelectionsChange,
    insights, 
    diagnostics, 
    onDiagnosticsChange, 
    isLoadingInsights,
    parsedData
}) => {
    
    const [activeTab, setActiveTab] = useState<'diagnostics' | 'correlation' | 'sparsity'>('diagnostics');

    const handleToggleAction = (index: number, isApproved: boolean) => {
        const newDiagnostics = diagnostics.map((diag, i) => i === index ? { ...diag, isApproved } : diag);
        onDiagnosticsChange(newDiagnostics);
    };

    const marketingChannels = useMemo(() => Object.keys(selections).filter(key => 
        [ColumnType.MARKETING_SPEND, ColumnType.MARKETING_ACTIVITY].includes(selections[key])
    ), [selections]);

    const correlationMatrix = useMemo(() => {
        const matrix: { [key: string]: { [key: string]: number } } = {};
        for(const ch1 of marketingChannels) {
            matrix[ch1] = {};
            for (const ch2 of marketingChannels) {
                if(ch1 === ch2) {
                    matrix[ch1][ch2] = 1;
                    continue;
                }
                if (matrix[ch2] && typeof matrix[ch2][ch1] !== 'undefined') {
                     matrix[ch1][ch2] = matrix[ch2][ch1];
                     continue;
                }
                const data1 = parsedData.map(d => Number(d[ch1]) || 0);
                const data2 = parsedData.map(d => Number(d[ch2]) || 0);
                matrix[ch1][ch2] = calculateCorrelation(data1, data2);
            }
        }
        return matrix;
    }, [parsedData, marketingChannels]);

    const sparsityData = useMemo(() => {
        return marketingChannels.map(ch => {
            if (!parsedData || parsedData.length === 0) {
                return { name: ch, sparsity: 0 };
            }
            const values = parsedData.map(d => d[ch]);
            const zeroCount = values.filter(v => v == null || v === 0 || String(v).trim() === '').length;
            const sparsityPercentage = (zeroCount / parsedData.length) * 100;
            return { name: ch, sparsity: sparsityPercentage };
        });
    }, [parsedData, marketingChannels]);

    const tabs = [
        { id: 'diagnostics', name: 'Channel Diagnostics' },
        { id: 'correlation', name: 'Correlation Matrix' },
        { id: 'sparsity', name: 'Sparsity Analysis' },
    ];
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'diagnostics':
                return (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <h4 className="font-semibold text-slate-200 mb-2">Dependent Variable Trend</h4>
                                <p className="text-sm text-slate-400 mb-4">{insights?.trendsSummary}</p>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={insights?.trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                        <XAxis dataKey="date" stroke={chartColors.text} tick={{ fontSize: 12 }} />
                                        <YAxis stroke={chartColors.kpi} tick={{ fontSize: 12 }} />
                                        <Tooltip wrapperClassName="glass-pane" />
                                        <Legend wrapperStyle={{color: chartColors.text}}/>
                                        <Line type="monotone" dataKey="kpi" name={Object.keys(selections).find(k => selections[k] === ColumnType.DEPENDENT_VARIABLE)} stroke={chartColors.kpi} strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-200 mb-2">AI Summary</h4>
                                <div className="bg-slate-900/50 p-4 rounded-lg text-sm text-slate-300 space-y-2">
                                    <p>{insights?.diagnosticsSummary}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <h4 className="font-semibold text-slate-200 mb-2">Channel Diagnostics</h4>
                            <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="p-3">Channel</th>
                                        <th className="p-3">Sparsity</th>
                                        <th className="p-3">Volatility (CV)</th>
                                        <th className="p-3">YoY Trend</th>
                                        <th className="p-3 w-2/5">AI Commentary</th>
                                        <th className="p-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {diagnostics.map((d, i) => {
                                        const trendValue = parseFloat(d.yoyTrend);
                                        const trendColor = trendValue > 0 ? 'text-green-400' : trendValue < 0 ? 'text-red-400' : 'text-slate-300';
                                        const volatilityValue = parseFloat(d.volatility);
                                        const volatilityColor = volatilityValue > 50 ? 'text-yellow-400' : 'text-slate-300';
                                        return (
                                            <tr key={d.name} className="border-b border-slate-700">
                                                <td className="p-3 font-semibold">{d.name}</td>
                                                <td className="p-3">{d.sparsity}</td>
                                                <td className={`p-3 font-mono ${volatilityColor}`}>{d.volatility}</td>
                                                <td className={`p-3 font-mono font-bold ${trendColor}`}>{d.yoyTrend}</td>
                                                <td className="p-3 text-slate-400 text-xs italic">{d.commentary}</td>
                                                <td className="p-3 text-center">
                                                    <div className="inline-flex rounded-md shadow-sm" role="group">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleAction(i, true)}
                                                            className={`px-3 py-1 text-xs font-medium border rounded-l-lg transition-colors ${d.isApproved ? 'bg-green-600 text-white border-green-600' : 'bg-transparent text-slate-300 border-slate-500 hover:bg-slate-700'}`}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleAction(i, false)}
                                                            className={`px-3 py-1 text-xs font-medium border rounded-r-lg transition-colors ${!d.isApproved ? 'bg-slate-600 text-white border-slate-600' : 'bg-transparent text-slate-300 border-slate-500 hover:bg-slate-700'}`}
                                                        >
                                                            Exclude
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </>
                );
            case 'correlation':
                return (
                     <div className="overflow-x-auto">
                        <p className="text-sm text-slate-400 mb-4">Correlation matrix of marketing channels. High values (&gt;0.7, in red) may indicate multicollinearity, which can make model results unstable.</p>
                        <table className="w-full text-center text-xs border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 border border-slate-700 bg-slate-700/50"></th>
                                    {marketingChannels.map(ch => <th key={ch} className="p-2 border border-slate-700 bg-slate-700/50 font-medium">{ch}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {marketingChannels.map(ch1 => (
                                    <tr key={ch1}>
                                        <td className="p-2 border border-slate-700 font-medium bg-slate-700/50">{ch1}</td>
                                        {marketingChannels.map(ch2 => (
                                            <td key={ch2} className={`p-2 border border-slate-700 font-mono ${getCorrelationColor(correlationMatrix[ch1]?.[ch2] ?? 0)}`}>
                                                {correlationMatrix[ch1]?.[ch2]?.toFixed(2)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 );
            case 'sparsity':
                return (
                    <div>
                        <p className="text-sm text-slate-400 mb-4">Sparsity of marketing channels, measured as the percentage of zero-value entries. High sparsity may affect model stability or indicate "flighted" campaigns.</p>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={sparsityData} margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                <XAxis dataKey="name" stroke={chartColors.text} angle={-45} textAnchor="end" interval={0} height={100} tick={{ fontSize: 12 }} />
                                <YAxis stroke={chartColors.text} unit="%" />
                                <Tooltip wrapperClassName="glass-pane" formatter={(value) => `${Number(value).toFixed(1)}%`} />
                                <Bar dataKey="sparsity" name="Sparsity %">
                                    {sparsityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.sparsity > 50 ? '#ef4444' : entry.sparsity > 20 ? '#f59e0b' : chartColors.bar} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
            {/* Column Selection */}
            <div className="glass-pane p-6">
                 <h3 className="text-xl font-semibold text-white mb-4">1. Confirm Column Roles</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {edaResults.map(col => (
                        <div key={col.columnName}>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">{col.columnName}</label>
                            <select
                            value={selections[col.columnName] || ''}
                            onChange={(e) => onSelectionsChange({ ...selections, [col.columnName]: e.target.value as ColumnType })}
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            >
                            {Object.values(ColumnType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            {isLoadingInsights && <div className="flex justify-center items-center h-64"><Loader /></div>}

            {/* Diagnostics & Visuals */}
            {insights && (
                 <div className="glass-pane p-6">
                    <h3 className="text-xl font-semibold text-white mb-6">2. Review Diagnostics & Data Quality</h3>
                    
                    <div className="border-b border-slate-700/50 mb-6">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                    }`}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                    
                    <div>
                        {renderTabContent()}
                    </div>
                 </div>
            )}
        </div>
    );
};