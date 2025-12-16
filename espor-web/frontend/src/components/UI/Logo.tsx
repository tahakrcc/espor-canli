import './Logo.css';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'medium', showText = false, className = '' }: LogoProps) {
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large'
  };

  return (
    <div className={`logo-wrapper ${sizeClasses[size]} ${className}`}>
      <div className="logo-icon">
        <img 
          src="/logo.jpg" 
          alt="İnönü E-Spor Logo" 
          onError={(e) => {
            // Try other formats
            const target = e.target as HTMLImageElement;
            const formats = ['/logo.jpeg', '/logo.png', '/logo.webp'];
            const currentSrc = target.src.split('/').pop() || '';
            
            if (currentSrc === 'logo.jpg') {
              // Try jpeg
              target.src = '/logo.jpeg';
            } else if (currentSrc === 'logo.jpeg') {
              // Try png
              target.src = '/logo.png';
            } else if (currentSrc === 'logo.png') {
              // Try webp
              target.src = '/logo.webp';
            } else {
              // Fallback to SVG if all image formats fail
              target.style.display = 'none';
              const svg = target.nextElementSibling as HTMLElement;
              if (svg) svg.style.display = 'block';
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 120 120" 
          xmlns="http://www.w3.org/2000/svg" 
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'none' }}
        >
          <defs>
            <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6B2C91" stopOpacity="1" />
              <stop offset="100%" stopColor="#5A1F7A" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Background circle (purple gradient) */}
          <circle cx="60" cy="60" r="58" fill="url(#purpleGradient)" stroke="#4A1A6B" strokeWidth="1.5"/>
          
          {/* Stylized calligraphic design (white) - Allah representation */}
          <g fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#logo-glow)">
            {/* Left side - Alif with decorative comb-like top */}
            <path d="M 26 18 L 26 22 L 30 22 L 30 26 L 34 26 L 34 30 M 26 30 L 26 82 L 22 88"/>
            
            {/* Center - Lam Lam (two parallel lines converging at bottom) */}
            <path d="M 46 18 L 46 88 M 54 18 L 54 88 M 46 88 L 50 92 M 54 88 L 50 92"/>
            
            {/* Right side - Ha with decorative top and S-curve */}
            <path d="M 84 18 L 84 22 L 88 22 L 88 26 L 92 26 L 92 30 M 84 30 Q 84 45 80 60 Q 76 75 76 88 M 76 88 L 72 92"/>
          </g>
          
          {/* Additional detail layer for depth */}
          <g fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
            {/* Left decorative elements */}
            <path d="M 28 20 L 28 24 M 32 24 L 32 28"/>
            
            {/* Center detail */}
            <path d="M 48 20 L 48 86 M 52 20 L 52 86"/>
            
            {/* Right decorative elements */}
            <path d="M 86 20 L 86 24 M 90 24 L 90 28"/>
            <path d="M 84 32 Q 84 48 80 64 Q 76 80 76 86"/>
          </g>
        </svg>
      </div>
      {showText && (
        <div className="logo-text">
          <div className="logo-text-main">İNÖNÜ</div>
          <div className="logo-text-subtitle">E-SPOR</div>
        </div>
      )}
    </div>
  );
}

