import React from 'react';

export const PluginIcon: React.FC = () => {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background rounded rectangle */}
      <rect x="0.5" y="0.5" width="31" height="23" rx="2.5" fill="#8E5CF6" />

      {/* Link icon (scaled and centered) */}
      <g transform="translate(11, 6) scale(0.5)">
        <path
          d="M10.046 18.441a1.5 1.5 0 0 1 0 2.125l-.742.743a7.502 7.502 0 1 1-10.61-10.61l3.015-3.014A7.5 7.5 0 0 1 12 7.375a1.506 1.506 0 0 1-2 2.25 4.5 4.5 0 0 0-6.171.184l-3.013 3.01a4.5 4.5 0 0 0 6.365 6.365l.743-.743a1.5 1.5 0 0 1 2.122 0m9.26-17.75a7.51 7.51 0 0 0-10.61 0l-.742.743a1.503 1.503 0 1 0 2.125 2.125l.742-.743a4.5 4.5 0 0 1 6.365 6.365l-3.014 3.015a4.5 4.5 0 0 1-6.172.179 1.506 1.506 0 1 0-2 2.25 7.5 7.5 0 0 0 10.288-.304l3.014-3.014a7.51 7.51 0 0 0 .004-10.613z"
          fill="white"
        />
      </g>
    </svg>
  );
};
