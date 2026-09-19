import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useOrganization } from '../features/organizations/hooks/useOrganization';

/**
 * Reusable Breadcrumbs Foundation
 * Adapts to active route & displays workspace context when appropriate.
 */
export default function Breadcrumbs({ items, className = '' }) {
  const location = useLocation();
  const { selectedOrganization } = useOrganization();

  // If custom items are provided, render those
  if (items && items.length > 0) {
    return (
      <nav aria-label="Breadcrumb" className={`flex items-center space-x-1.5 text-xs text-[#64748B] ${className}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={item.label || index}>
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />}
              {isLast || !item.to ? (
                <span className="font-semibold text-[#0F172A] truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-[#0F172A] transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  }

  // Automatic path-based breadcrumb
  const pathnames = location.pathname.split('/').filter((x) => x);
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return null;
  }

  const formatSegment = (str) => {
    return str
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-1.5 text-xs text-[#64748B] mb-4 ${className}`}>
      {selectedOrganization && (
        <>
          <span className="text-[#64748B] truncate max-w-[120px] font-medium">
            {selectedOrganization.name}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />
        </>
      )}

      {pathnames.map((segment, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formatted = formatSegment(segment);

        return (
          <React.Fragment key={to}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />}
            {isLast ? (
              <span className="font-semibold text-[#0F172A] truncate max-w-[180px]">
                {formatted}
              </span>
            ) : (
              <Link to={to} className="hover:text-[#0F172A] transition-colors truncate max-w-[150px]">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
