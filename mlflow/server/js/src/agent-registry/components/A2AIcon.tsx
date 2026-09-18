/**
 * The A2A (Agent2Agent) protocol mark — two linked loops with dots over dashed lines.
 *
 * This is a hand-built approximation of the official A2A logo, drawn from the design system's
 * icon conventions (24x24 viewbox, `currentColor`, rounded strokes) so it inherits color and
 * size from context. Swap the paths here for the official SVG asset if a pixel-exact mark is
 * needed — this component is the single place it's rendered.
 */
export const A2AIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {/* linked loops */}
    <path d="M8 5 H4.75 A3.25 3.25 0 0 0 4.75 11.5 H10 A3.25 3.25 0 0 1 14 5 H19.25 A3.25 3.25 0 0 1 19.25 11.5 H16" />
    {/* four dots inside the loops */}
    <circle cx="5.5" cy="8.25" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="8.75" cy="8.25" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="15.25" cy="8.25" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="8.25" r="1.05" fill="currentColor" stroke="none" />
    {/* dashed lines below */}
    <path d="M3.5 16.5 H8" />
    <path d="M10.5 16.5 H20.5" />
    <path d="M3.5 20 H11" />
    <circle cx="14" cy="20" r="1.05" fill="currentColor" stroke="none" />
    <path d="M17 20 H20.5" />
  </svg>
);
