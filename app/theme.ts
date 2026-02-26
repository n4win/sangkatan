import { createTheme, type MantineThemeOverride } from "@mantine/core";

export const theme: MantineThemeOverride = createTheme({
  primaryColor: "green",

  shadows: {
    md: "1px 1px 3px rgba(0, 0, 0, .25)",
    xl: "5px 5px 3px rgba(0, 0, 0, .25)",
  },

  defaultRadius: "0.5rem",
  activeClassName: "activeTheme",
  cursorType: "pointer",

  fontFamily: "Bai Jamjuree, sans-serif",

  components: {
    // Notifications: {
    //   defaultProps: {
    //     position: "top-center",
    //   },
    // },
    Modal: {
      defaultProps: {
        size: "lg",
        centered: true,
        // closeOnClickOutside: false,
        // closeOnEscape: false,
        // overlayProps: {
        //   backgroundOpacity: 0.55,
        //   blur: 1,
        // },
        transitionProps: { transition: "pop" },
      },
    },
    Breadcrumbs: {
      defaultProps: {
        separator: "•",
      },
    },
  },
});
