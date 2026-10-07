import { memo } from "react";
import { DynamicIcon as LucideDynamicIcon } from "lucide-react/dynamic";
import { resolveIconName } from "./icon-name";

// `lucide-react/dynamic` lazily imports a single icon by its kebab-case name,
// so the page-header icon stays a one-icon fetch. Names are validated and
// mapped in ./icon-name.

function DynamicIconImpl({
  name,
  size = 16,
  className,
  style,
}: {
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  weight?: number; // ignored (was a Material font axis)
  filled?: boolean; // ignored (was a Material font axis)
}) {
  return (
    <LucideDynamicIcon
      // Validated in ./icon-name; the cast just satisfies the
      // IconName string-literal union.
      name={resolveIconName(name) as never}
      size={size}
      className={className}
      style={style}
    />
  );
}

export const DynamicIcon = memo(DynamicIconImpl);
