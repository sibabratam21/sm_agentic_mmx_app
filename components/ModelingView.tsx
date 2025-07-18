import React from 'react';
import { ModelRun, ModelDetail } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ModelingViewProps {
    models: ModelRun[];
    activeModelId: string | null;
    onSetActiveModel: (id: string | null) => void;
    onModelChange: (model: ModelRun) => void;
    onRequestFinalize: () => void;
}

const chartColors = {
  grid: 'rgba(100, 116, 139, 0.2)',
  text: '#94a3b8'
}

const ActiveModelDetail: React.FC<{ model: ModelRun; onModelChange: (model: ModelRun) => void; onRequestFinalize: () => void; }> = ({ model, onModelChange, onRequestFinalize }) => {
    
    const handleParameterChange = (channelName: string, field: keyof ModelDetail, value: any) => {
        const newDetails = model.details.map(d =>
            d.name === channelName ? { ...d, [field]: value } : d
        );

        // A full simulation of recalculation would happen in the backend/AI
        // For the frontend, we just update the parameter and pass it up
        onModelChange({
            ...model,
            details: newDetails,
        });
    };
    
    const roiColor = model.roi > 0 ? 'text-green-400' : 'text-red-400';

    return (
        <div className="glass-pane p-6 h-full flex flex-col">
            <h3 className="text-xl font-semibold text-white mb-2">Active Model: {model.id} ({model.algo})</h3>
            <p className="text-slate-400 mb-6 text-sm">{model.commentary}</p>
            
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div className="bg-slate-900/50 p-3 rounded-lg"><div className="text-sm text-slate-400">R-Square</div><div className="text-2xl font-bold text-blue-400">{model.rsq.toFixed(2)}</div></div>
                <div className="bg-slate-900/50 p-3 rounded-lg"><div className="text-sm text-slate-400">MAPE</div><div className="text-2xl font-bold text-blue-400">{model.mape.toFixed(1)}%</div></div>
                <div className="bg-slate-900/50 p-3 rounded-lg"><div className="text-sm text-slate-400">Blended ROI</div><div className={`text-2xl font-bold ${roiColor}`}>${model.roi.toFixed(2)}</div></div>
            </div>
            
            <h4 className="font-semibold text-slate-200 mb-4">Channel Contribution</h4>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={model.details} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={100} stroke={chartColors.text} fontSize={12} interval={0} />
                    <Tooltip wrapperClassName="glass-pane" cursor={{ fill: 'rgba(100, 116, 139, 0.3)' }} formatter={(value: number) => `${value.toFixed(1)}%`}/>
                    <Bar dataKey="contribution" name="Contribution" stackId="a">
                        {model.details.map((p, index) => (
                            <Cell key={`cell-${index}`} fill={p.included ? (p.pValue != null && p.pValue > 0.1 ? '#f87171' : '#60a5fa') : '#475569'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <h4 className="font-semibold text-slate-200 mt-6 mb-4">Manual Parameter Calibration</h4>
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/60 sticky top-0"><tr><th className="p-2">Channel</th><th className="p-2">Adstock</th><th className="p-2">Lag</th><th className="p-2">Transform</th></tr></thead>
                    <tbody>
                        {model.details.map(p => (
                        <tr key={p.name} className="border-b border-slate-700/50">
                            <td className="py-2 px-2">
                                <label className="flex items-center">
                                    <input type="checkbox" className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500" checked={p.included} onChange={(e) => handleParameterChange(p.name, 'included', e.target.checked)} />
                                    <span className="ml-2.5 font-semibold">{p.name}</span>
                                    {p.pValue !== null && <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${p.pValue > 0.1 ? 'bg-red-500/30 text-red-300' : 'bg-green-500/20 text-green-300'}`}>p={p.pValue.toFixed(2)}</span>}
                                </label>
                            </td>
                            <td><input type="number" step="0.05" value={p.adstock} onChange={e => handleParameterChange(p.name, 'adstock', parseFloat(e.target.value))} className="w-20 p-1 bg-slate-700 border border-slate-600 rounded-md" /></td>
                            <td><input type="number" value={p.lag} onChange={e => handleParameterChange(p.name, 'lag', parseInt(e.target.value))} className="w-20 p-1 bg-slate-700 border border-slate-600 rounded-md" /></td>
                            <td>
                                <select value={p.transform} onChange={e => handleParameterChange(p.name, 'transform', e.target.value as any)} className="w-full p-1 bg-slate-700 border border-slate-600 rounded-md">
                                    <option>Log-transform</option>
                                    <option>Negative Exponential</option>
                                    <option>S-Curve</option>
                                    <option>Power</option>
                                </select>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-auto pt-6">
                <button
                    onClick={onRequestFinalize}
                    className="w-full primary-button text-base font-semibold py-3 flex items-center justify-center gap-2"
                >
                    Finalize Model &amp; Generate Report
                </button>
            </div>
        </div>
    );
}

export const ModelingView: React.FC<ModelingViewProps> = ({ models, activeModelId, onSetActiveModel, onModelChange, onRequestFinalize }) => {
    
    if (models.length === 0) {
        return <p className="p-8 text-center">Waiting for model results...</p>;
    }

    const activeModel = models.find(m => m.id === activeModelId);

    return (
        <div className="flex h-full p-4 md:p-6 gap-6">
            {/* Leaderboard */}
            <div className="w-1/2 flex flex-col glass-pane p-4">
                <h2 className="text-xl font-bold text-center mb-4">Model Leaderboard</h2>
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/60 sticky top-0">
                            <tr>
                                <th className="p-2">Model ID</th>
                                <th className="p-2">Algo</th>
                                <th className="p-2">R-Sq</th>
                                <th className="p-2">MAPE</th>
                                <th className="p-2">ROI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {models.map((model) => {
                                const roiColor = model.roi < 0 ? 'text-red-400' : 'text-green-400';
                                const isActive = model.id === activeModelId;
                                return (
                                <tr key={model.id} 
                                    onClick={() => onSetActiveModel(model.id)}
                                    className={`border-b border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-700/40 ${isActive ? 'bg-indigo-500/20' : ''}`}>
                                    <td className="p-2 font-semibold">{model.id}</td>
                                    <td className="p-2 text-slate-400">{model.algo.replace(' Regression', '')}</td>
                                    <td className="p-2 font-mono text-blue-400">{model.rsq.toFixed(2)}</td>
                                    <td className="p-2 font-mono text-blue-400">{model.mape.toFixed(1)}%</td>
                                    <td className={`p-2 font-mono ${roiColor}`}>${model.roi.toFixed(2)}</td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Active Model Details & Calibration */}
            <div className="w-1/2">
                {activeModel ? (
                    <ActiveModelDetail model={activeModel} onModelChange={onModelChange} onRequestFinalize={onRequestFinalize} />
                ) : (
                    <div className="glass-pane h-full flex flex-col items-center justify-center text-center p-8">
                        <h3 className="text-xl font-semibold text-white">Select a Model</h3>
                        <p className="text-slate-400 mt-2">Click a model from the leaderboard on the left to view its detailed results, ask questions about it, or tune its parameters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};