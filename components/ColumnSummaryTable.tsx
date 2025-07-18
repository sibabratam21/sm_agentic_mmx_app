import React from 'react';
import { ColumnSummaryItem } from '../types';

interface ColumnSummaryTableProps {
  summary: ColumnSummaryItem[];
}

export const ColumnSummaryTable: React.FC<ColumnSummaryTableProps> = ({ summary }) => {
  if (!summary || summary.length === 0) {
    return null;
  }

  // The summary data is pre-sorted by App.tsx. No need for redundant sorting here.

  return (
    <div className="space-y-3">
        <p>Great to hear! Your column assignments have been noted:</p>
        <div className="overflow-hidden rounded-lg border border-slate-600">
          <table className="min-w-full divide-y divide-slate-600">
            <thead className="bg-slate-700/50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                  Role
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                  Assigned Columns
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 bg-slate-800/30">
              {summary.filter(item => item.columns.length > 0).map(({ role, columns }) => (
                <tr key={role}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-slate-200">{role}</td>
                  <td className="px-3 py-2 whitespace-normal text-sm text-slate-300">{columns.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
};