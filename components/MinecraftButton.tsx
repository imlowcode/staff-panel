import React from 'react';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const ModernButton: React.FC<ModernButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  isLoading = false,
  className = '',
  ...props 
}) => {
  
  // Base styles: Fixed height (h-10 or h-12), centered flex, proper spacing
  const baseStyles = "relative h-11 px-6 rounded-lg font-bold text-[11px] tracking-[0.1em] uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 outline-none overflow-hidden group select-none";
  
  const variants = {
    // Primary: Elegant Purple Glow
    primary: "bg-purple-600/10 text-purple-100 border border-purple-500/20 hover:bg-purple-600/20 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(147,51,234,0.15)]",
    
    // Secondary: Minimalist White/Grey
    secondary: "bg-white/5 text-gray-300 border border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white",
    
    // Danger: Subtle Red
    danger: "bg-red-500/10 text-red-200 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30",
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${fullWidth ? 'w-full' : 'w-auto'} 
        ${className}
      `}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <svg className="animate-spin h-3.5 w-3.5 text-current absolute" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}

      {/* Button Content (Hidden when loading) */}
      <span className={`relative z-10 flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
    </button>
  );
};

export default ModernButton;