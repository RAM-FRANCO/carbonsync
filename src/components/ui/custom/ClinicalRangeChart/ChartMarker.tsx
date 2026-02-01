
import React from 'react';

import { cn } from '@/lib/utils';

interface ChartMarkerProps {
  className?: string;
  style?: React.CSSProperties;
  innerColor: string;
  outerColor: string;
  variant?: 'value' | 'action';
  size?: 'default' | 'small';
  label?: string;
  value?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
  textColor?: string;
}

export const ChartMarker = ({ 
  className, 
  style, 
  innerColor, 
  outerColor, 
  variant = 'value',
  size = 'default',
  label,
  value,
  actionLabel,
  onAction,
  onClick,
  textColor
}: ChartMarkerProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const Component = onClick ? 'button' : 'div';
  
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };
  
  const tooltipContent = React.useMemo(() => {
    if (variant === 'value') {
      return (
        <div className="flex flex-col items-center p-1">
          <span className="text-[10px] text-slate-400 font-medium">{label || ''}</span>
          <span className={cn("text-xs font-bold", textColor || "text-white")}>{value}</span>
        </div>
      );
    }
    if (variant === 'action') {
      return (
        <div className="flex flex-col items-center gap-1.5 p-0.5 w-28">
          <span className="text-slate-400 text-center whitespace-normal text-sm leading-tight">{label}</span>
          {actionLabel && (
            <button 
              className="px-2.5 py-1 bg-black text-white text-xs font-bold rounded-full "
              onClick={(e) => {
                e.stopPropagation();
                onAction?.();
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      );
    }
    return null;
  }, [variant, label, value, actionLabel, onAction, textColor]);

  const sizeClasses = size === 'small' 
    ? { outer: "w-4 h-4", inner: "w-1.5 h-1.5" } 
    : { outer: "w-6 h-6", inner: "w-2.5 h-2.5" };

  return (
    <div 
      className={cn(
        "absolute -translate-x-1/2 flex items-center justify-center transition-all duration-500 ease-out z-20 pointer-events-auto",
        className
      )}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Component
        className={cn(
          "relative flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 rounded-full",
          onClick && "pointer-events-auto cursor-pointer"
        )}
        onClick={onClick}
        type={onClick ? "button" : undefined}
      >
        <div className={cn("rounded-full flex items-center justify-center transition-colors shadow-sm", sizeClasses.outer, outerColor)}>
          <div className={cn("rounded-full", sizeClasses.inner, innerColor)} />
        </div>
      </Component>

      {/* Custom Tooltip */}
      {tooltipContent && (
        <div 
          className={cn(
            "absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg shadow-xl transition-all duration-200 bg-white",
            isHovered ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-1 scale-95 pointer-events-none"
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative whitespace-nowrap z-30">
            {tooltipContent}
          </div>
        </div>
      )}
    </div>
  );
};
