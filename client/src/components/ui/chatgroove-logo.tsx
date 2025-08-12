import { motion } from "framer-motion";

interface ChatGrooveLogoProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function ChatGrooveLogo({ size = "md", animated = true }: ChatGrooveLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  const LogoIcon = animated ? motion.div : "div";

  return (
    <div className="flex items-center space-x-2">
      <LogoIcon
        className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg`}
        {...(animated && {
          animate: { 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          },
          transition: { 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }
        })}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className={`${size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8"} text-white`}
        >
          {/* Custom ChatGroove icon - stylized chat bubble with groove wave */}
          <path
            d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04.97 4.37L1.85 21.4c-.13.33.08.6.41.6.1 0 .21-.03.3-.09l5.45-2.8C9.5 19.64 10.73 20 12 20c5.52 0 10-4.48 10-10S17.52 2 12 2z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          {/* Groove wave pattern inside */}
          <path
            d="M7 10c.5-.5 1-.5 1.5 0s1 .5 1.5 0 1-.5 1.5 0 1 .5 1.5 0 1-.5 1.5 0M7 13c.5-.5 1-.5 1.5 0s1 .5 1.5 0 1-.5 1.5 0 1 .5 1.5 0 1-.5 1.5 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
        </svg>
      </LogoIcon>
      
      {size !== "sm" && (
        <div className="flex flex-col">
          <span className="font-bold text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            ChatGroove
          </span>
          {size === "lg" && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Connect • Share • Groove
            </span>
          )}
        </div>
      )}
    </div>
  );
}