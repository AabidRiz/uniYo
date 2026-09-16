import React from 'react';

export default function UniYOLogo({ size = 'md', className = '', showTagline = false }) {
  const sizes = {
    sm: { text: 'text-xl', icon: 20 },
    md: { text: 'text-2xl font-black tracking-tight', icon: 26 },
    lg: { text: 'text-4xl font-black tracking-tight', icon: 40 },
    xl: { text: 'text-5xl font-extrabold tracking-tight', icon: 54 }
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <div className="flex items-center space-x-0.5 select-none font-sans">
        {/* Uni */}
        <span className={`${s.text} font-bold text-[#0A66C2]`}>
          Uni
        </span>
        
        {/* Y with graduation cap */}
        <span className="relative inline-flex items-center justify-center font-black text-[#0A66C2]">
          <span className={s.text}>Y</span>
          {/* Mortarboard Graduation Cap SVG matching the logo image */}
          <svg 
            className="absolute -top-2.5 -right-1 z-10 drop-shadow-sm" 
            width={s.icon * 0.75} 
            height={s.icon * 0.75} 
            viewBox="0 0 24 24" 
            fill="#0A66C2"
          >
            {/* Cap top diamond */}
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#0A66C2" stroke="#FFFFFF" strokeWidth="1" />
            {/* Cap base / skullcap */}
            <path d="M5 10V14.5C5 16.5 8 18 12 18C16 18 19 16.5 19 14.5V10" fill="#0A66C2" stroke="#FFFFFF" strokeWidth="0.5" />
            {/* Tassel */}
            <path d="M20 8.5V14.5C20 15 19 15.5 18.5 15" stroke="#004182" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>

        {/* o */}
        <span className={`${s.text} font-bold text-[#0A66C2]`}>
          o
        </span>
      </div>
      {showTagline && (
        <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase -mt-1">
          Integrated Student & Investor Hub
        </span>
      )}
    </div>
  );
}
