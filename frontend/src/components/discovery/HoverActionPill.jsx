import { Link } from "react-router-dom";

export default function HoverActionPill({
  icon: Icon,
  label,
  to,
  onClick,
  active = false,
  variant = "neutral",
  title,
  className = ""
}) {
  const Component = to ? Link : "button";
  const classes = [
    "discovery-hover-action",
    active ? "is-active" : "",
    variant === "primary" ? "is-primary" : "",
    className
  ].filter(Boolean).join(" ");

  const sharedProps = to
    ? { to }
    : { type: "button", onClick };

  return (
    <Component
      {...sharedProps}
      className={classes}
      title={title || label}
      aria-label={label}
    >
      <span className="discovery-hover-action__icon">
        <Icon size={18} />
      </span>
      <span className="discovery-hover-action__label">{label}</span>
    </Component>
  );
}
