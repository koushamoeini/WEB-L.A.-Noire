import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="skeleton-card-container">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <Skeleton height="24px" width="60%" />
          <Skeleton height="16px" width="40%" style={{ marginTop: '12px' }} />
          <Skeleton height="16px" width="80%" style={{ marginTop: '8px' }} />
          <Skeleton height="16px" width="70%" style={{ marginTop: '8px' }} />
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <Skeleton height="32px" width="100px" borderRadius="8px" />
            <Skeleton height="32px" width="100px" borderRadius="8px" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={index} height="20px" width="90%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="16px" width={`${60 + Math.random() * 30}%`} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonStats: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="skeleton-stats-container">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-stat-card">
          <Skeleton width="48px" height="48px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton height="28px" width="80px" />
            <Skeleton height="16px" width="120px" style={{ marginTop: '8px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="skeleton-form">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="skeleton-form-field">
          <Skeleton height="18px" width="120px" style={{ marginBottom: '8px' }} />
          <Skeleton height="40px" width="100%" borderRadius="8px" />
        </div>
      ))}
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Skeleton height="40px" width="120px" borderRadius="8px" />
        <Skeleton height="40px" width="120px" borderRadius="8px" />
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <Skeleton width="40px" height="40px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton height="18px" width="60%" />
            <Skeleton height="14px" width="40%" style={{ marginTop: '8px' }} />
          </div>
          <Skeleton width="80px" height="32px" borderRadius="6px" />
        </div>
      ))}
    </div>
  );
};
