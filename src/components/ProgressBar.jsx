import React from 'react';

const ProgressBar = ({ title, stats }) => {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="progress-header">
        <span className="progress-title">{title}</span>
        <span className="progress-pct">{stats.percentage}%</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-fill" 
          style={{ width: `${stats.percentage}%` }}
        />
      </div>
      <div className="progress-stats">
        {stats.read} / {stats.total} 장
      </div>
    </div>
  );
};

export default ProgressBar;
