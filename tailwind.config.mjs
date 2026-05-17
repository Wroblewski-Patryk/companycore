export default {
  content: ["./web/index.html", "./web/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        company: {
          ink: "#071225",
          muted: "#51627f",
          blue: "#2364d2",
          green: "#16845b",
          amber: "#b87700",
          border: "#d8e1ee"
        },
        roost: {
          primary: "#6366F1",
          secondary: "#3B82F6",
          accent: "#06B6D4",
          success: "#10B981",
          base: "#0D1117",
          surface: "#161B22",
          elevated: "#21262D",
          neutral: "#1F2937",
          text: "#E5E7EB",
          muted: "#9CA3AF",
          dim: "#6B7280"
        }
      },
      borderRadius: {
        company: "8px",
        roost: "1rem"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  }
};
