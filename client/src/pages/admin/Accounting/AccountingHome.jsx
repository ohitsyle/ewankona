import React from "react";
import { useTheme } from "../../../context/ThemeContext";
import Analytics from "../../../components/TreasuryDashboard/Analytics";

const AccountingHome = () => {
  const { theme } = useTheme();

  return (
    <div>
      {/* Analytics Dashboard - Read Only for Accounting */}
      <Analytics readOnly={true} />
    </div>
  );
};

export default AccountingHome;
