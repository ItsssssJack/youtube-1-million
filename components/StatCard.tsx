import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  colorClass?: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, trend, colorClass = "bg-[#EA580C]", icon }) => {
  return (
    <div className={`rounded-[2rem] p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${colorClass === 'bg-white' ? 'bg-white text-gray-900' : 'text-white ' + colorClass}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-sm font-medium ${colorClass === 'bg-white' ? 'text-gray-500' : 'text-white/80'}`}>{label}</h3>
        {icon && <div className={`p-2 rounded-full ${colorClass === 'bg-white' ? 'bg-gray-100' : 'bg-white/20'}`}>{icon}</div>}
      </div>

      <div className="flex flex-col gap-1 relative z-10">
        <span className="text-4xl font-bold tracking-tight">{value}</span>

        <div className="flex items-center gap-2 mt-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${trend === 'up'
              ? (colorClass === 'bg-white' ? 'bg-orange-100 text-orange-700' : 'bg-white/20 text-white')
              : 'bg-red-100 text-red-700'
            }`}>
            {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {change}
          </span>
          <span className={`text-xs ${colorClass === 'bg-white' ? 'text-gray-400' : 'text-white/60'}`}>vs last month</span>
        </div>
      </div>

      {/* Decorative background circle */}
      <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-10 ${colorClass === 'bg-white' ? 'bg-orange-900' : 'bg-white'}`}></div>
    </div>
  );
};

export default StatCard;