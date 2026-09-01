"use client";

interface TagBadgeProps {
  name: string;
  color: string;
  size?: "sm" | "md";
  variant?: "default" | "filter" | "timeline";
  isActive?: boolean;
  onDelete?: () => void;
}

export const TagBadge = ({ name, color, size = "sm", variant = "default", isActive }: TagBadgeProps) => {
  const isSm = size === "sm";

  if (variant === "timeline") {
    return (
      <span
        style={{
          backgroundColor: `${color}22`,
          color: "#ffffff",
          borderColor: `${color}55`,
        }}
        className={`inline-flex items-center font-medium text-white rounded-full border shadow-2xs transition-all ${isSm ? "text-xs px-2.5 py-0.5" : "text-xs px-3 py-1 tracking-wide"
          }`}
      >
        <span
          style={{ backgroundColor: color }}
          className="w-2 h-2 rounded-full mr-1.5 shrink-0 shadow-xs"
        />
        {name}
      </span>
    );
  }

  if (variant === "filter") {
    return (
      <span
        style={{
          backgroundColor: isActive ? `${color}55` : `${color}25`,
          borderColor: isActive ? "#f97316" : `${color}66`,
        }}
        className={`inline-flex items-center font-medium text-white transition-all rounded-full border shadow-2xs ${isSm ? "text-xs px-2.5 py-0.5" : "text-xs px-3 py-1 tracking-wide"
          } ${isActive ? "border-orange-500 ring-1 ring-orange-500" : ""}`}
      >
        <span
          style={{ backgroundColor: color }}
          className="w-2 h-2 rounded-full mr-1.5 shrink-0 shadow-xs"
        />
        {name}
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundColor: `${color}22`,
        color: color,
        borderColor: `${color}55`,
      }}
      className={`inline-flex items-center font-bold rounded-full border shadow-2xs transition-all ${isSm ? "text-xs px-2.5 py-0.5" : "text-xs px-3 py-1 tracking-wide"
        }`}
    >
      <span
        style={{ backgroundColor: color }}
        className="w-2 h-2 rounded-full mr-1.5 shrink-0 shadow-xs"
      />
      {name}
    </span>
  );
};
