import type { SVGProps } from "react";

// The Tabler icons the sidebar uses (https://tabler.io/icons, MIT licence),
// as small local components. Importing them from "src/components/tiptap-icons/tabler-icons" pulled the
// whole 3 MB Tabler set into every page load in development.
//   <TbHome size={17} strokeWidth={1.6} />

export interface TablerIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

function icon(name: string, children: React.ReactNode) {
  function TablerIcon({
    size = 24,
    strokeWidth = 2,
    ...rest
  }: TablerIconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {children}
      </svg>
    );
  }
  TablerIcon.displayName = name;
  return TablerIcon;
}

export const TbArrowRight = icon(
  "TbArrowRight",
  <>
    <path d="M5 12l14 0" />
    <path d="M13 18l6 -6" />
    <path d="M13 6l6 6" />
  </>,
);

export const TbBooks = icon(
  "TbBooks",
  <>
    <path d="M5 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    <path d="M9 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    <path d="M5 8h4" />
    <path d="M9 16h4" />
    <path d="M13.803 4.56l2.184 -.53c.562 -.135 1.133 .19 1.282 .732l3.695 13.418a1.02 1.02 0 0 1 -.634 1.219l-.133 .041l-2.184 .53c-.562 .135 -1.133 -.19 -1.282 -.732l-3.695 -13.418a1.02 1.02 0 0 1 .634 -1.219l.133 -.041z" />
    <path d="M14 9l4 -1" />
    <path d="M16 16l3.923 -.98" />
  </>,
);

export const TbChevronDown = icon(
  "TbChevronDown",
  <>
    <path d="M6 9l6 6l6 -6" />
  </>,
);

export const TbChevronRight = icon(
  "TbChevronRight",
  <>
    <path d="M9 6l6 6l-6 6" />
  </>,
);

export const TbChevronsLeft = icon(
  "TbChevronsLeft",
  <>
    <path d="M11 7l-5 5l5 5" />
    <path d="M17 7l-5 5l5 5" />
  </>,
);

export const TbChevronsRight = icon(
  "TbChevronsRight",
  <>
    <path d="M7 7l5 5l-5 5" />
    <path d="M13 7l5 5l-5 5" />
  </>,
);

export const TbDots = icon(
  "TbDots",
  <>
    <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
  </>,
);

export const TbEdit = icon(
  "TbEdit",
  <>
    <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
    <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
    <path d="M16 5l3 3" />
  </>,
);

export const TbFileText = icon(
  "TbFileText",
  <>
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
    <path d="M9 9l1 0" />
    <path d="M9 13l6 0" />
    <path d="M9 17l6 0" />
  </>,
);

export const TbHome = icon(
  "TbHome",
  <>
    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
  </>,
);

export const TbInbox = icon(
  "TbInbox",
  <>
    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    <path d="M4 13h3l3 3h4l3 -3h3" />
  </>,
);

export const TbMessages = icon(
  "TbMessages",
  <>
    <path d="M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10" />
    <path d="M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2" />
  </>,
);

export const TbPin = icon(
  "TbPin",
  <>
    <path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" />
    <path d="M9 15l-4.5 4.5" />
    <path d="M14.5 4l5.5 5.5" />
  </>,
);

export const TbPinnedOff = icon(
  "TbPinnedOff",
  <>
    <path d="M3 3l18 18" />
    <path d="M15 4.5l-3.249 3.249m-2.57 1.433l-2.181 .818l-1.5 1.5l7 7l1.5 -1.5l.82 -2.186m1.43 -2.563l3.25 -3.251" />
    <path d="M9 15l-4.5 4.5" />
    <path d="M14.5 4l5.5 5.5" />
  </>,
);

export const TbPlus = icon(
  "TbPlus",
  <>
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </>,
);

export const TbSearch = icon(
  "TbSearch",
  <>
    <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
    <path d="M21 21l-6 -6" />
  </>,
);

export const TbSelector = icon(
  "TbSelector",
  <>
    <path d="M8 9l4 -4l4 4" />
    <path d="M16 15l-4 4l-4 -4" />
  </>,
);

export const TbTemplate = icon(
  "TbTemplate",
  <>
    <path d="M4 4m0 1a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1z" />
    <path d="M4 12m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
    <path d="M14 12l6 0" />
    <path d="M14 16l6 0" />
    <path d="M14 20l6 0" />
  </>,
);

export const TbTrash = icon(
  "TbTrash",
  <>
    <path d="M4 7l16 0" />
    <path d="M10 11l0 6" />
    <path d="M14 11l0 6" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
  </>,
);

export const TbX = icon(
  "TbX",
  <>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </>,
);
