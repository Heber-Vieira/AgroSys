import React from 'react';

export const AgriDroneIcon = ({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    {...props}
  >
    {/* Propellers */}
    <rect x="1" y="3" width="8" height="2" rx="1" />
    <rect x="15" y="3" width="8" height="2" rx="1" />
    
    {/* Motors */}
    <rect x="4" y="5" width="2" height="3" rx="0.5" />
    <rect x="18" y="5" width="2" height="3" rx="0.5" />

    {/* Arms (Thick V-shape) */}
    <path d="M5 8 L11 13 L13 13 L19 8 L17 6 L12 10 L7 6 Z" />
    
    {/* Central Tank */}
    <rect x="8" y="9" width="8" height="7" rx="2" />

    {/* Spray Mechanism */}
    <rect x="11" y="16" width="2" height="3" />
    <rect x="4" y="19" width="16" height="2" rx="1" />
    
    {/* Spray Droplets */}
    <circle cx="6" cy="23" r="1" />
    <circle cx="12" cy="23" r="1" />
    <circle cx="18" cy="23" r="1" />
  </svg>
);
