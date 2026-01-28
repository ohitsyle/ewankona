// src/admin/components/Common/Spinner.jsx
import React from 'react';

/**
 * Loading Spinner Component with Tailwind CSS
 *
 * @param {boolean} large - Use large size
 * @param {string} message - Optional loading message
 */
export default function Spinner({ large = false, message = 'Loading...' }) {
  return (
    <div className="text-center py-[60px] px-5 text-[rgba(251,251,251,0.6)]">
      <div className={"inline-block border-2 border-[rgba(255,255,255,0.3)] border-t-current rounded-full animate-spin " + (large ? 'w-10 h-10 border-[3px]' : 'w-3.5 h-3.5')}></div>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
