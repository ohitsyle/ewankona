import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export default function Footer() {
  const { theme, isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: theme.bg.primary,
        borderTop: `2px solid ${theme.accent.primary}`,
        color: theme.text.secondary,
        boxShadow: isDarkMode ? '0 -4px 20px rgba(0, 0, 0, 0.2)' : '0 -4px 20px rgba(59, 130, 246, 0.05)'
      }}
      className="mt-auto px-[40px] py-[20px] text-center text-[12px]"
    >
      <p className="m-0">
        © {currentYear} NUCash System | National University Laguna |{" "}
        <Link
          to="/terms"
          style={{ color: theme.accent.primary }}
          className="hover:opacity-80 transition font-semibold"
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Terms and Conditions
        </Link>{" "}
        |{" "}
        <Link
          to="/privacy"
          style={{ color: theme.accent.primary }}
          className="hover:opacity-80 transition font-semibold"
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Privacy Policy
        </Link>
      </p>
    </footer>
  );
}
