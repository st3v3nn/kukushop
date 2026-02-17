import logoImage from '@/assets/logo.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo = ({ size = 'md', className = '' }: LogoProps) => {
  const sizes = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-28 w-28',
    xl: 'h-40 w-40',
  };

  return (
    <img
      src={logoImage}
      alt="Speedy Bites"
      className={`${sizes[size]} object-contain rounded-full ${className}`}
    />
  );
};

export default Logo;
