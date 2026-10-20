import React from 'react';
import { HiArrowTrendingUp, HiArrowTrendingDown } from 'react-icons/hi2';

const StatsCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'increase',
  subtitle,
  color = 'blue',
  className = '',
}) => {
  const colorSchemes = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value ?? '0'}</h3>
        </div>
        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${scheme.bg} ${scheme.text} shadow-sm`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(change != null || subtitle) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change != null && (
            <span
              className={`inline-flex items-center font-medium ${
                changeType === 'increase'
                  ? 'text-emerald-600'
                  : changeType === 'decrease'
                  ? 'text-rose-600'
                  : 'text-gray-500'
              }`}
            >
              {changeType === 'increase' ? (
                <HiArrowTrendingUp className="w-3.5 h-3.5 mr-0.5" />
              ) : changeType === 'decrease' ? (
                <HiArrowTrendingDown className="w-3.5 h-3.5 mr-0.5" />
              ) : null}
              {change}
            </span>
          )}
          {subtitle && <span className="text-gray-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
