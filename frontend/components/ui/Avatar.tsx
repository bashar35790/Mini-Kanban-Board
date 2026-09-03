type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-lg",
};

export function Avatar({ name, size = "md" }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover font-semibold text-white ${sizes[size]}`}
      title={name}
    >
      {initials || "?"}
    </div>
  );
}
