// Para usar a logo real: coloque o arquivo em src/assets/gamebox-logo.png
// Enquanto o arquivo não existir, o SVG abaixo é exibido como fallback.
import logoImg from '../assets/gamebox-logo.png';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <img
      src={logoImg}
      alt="GameBox"
      className={className}
      draggable={false}
    />
  );
}
