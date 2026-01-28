import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import MyBalance from "../../components/UserDashboard/MyBalance";
import Assistance from "../../components/UserDashboard/Assistance";
import Feedback from "../../components/UserDashboard/Feedback";
import MyTransactions from "../../components/UserDashboard/MyTransactions";
import ConcernsHistory from "../../components/UserDashboard/ConcernsHistory";

export default function UserDashboard() {
  const { theme } = useTheme();
  const [balance, setBalance] = useState(null);
  const role = "student"; // Replace with actual role from auth/context

  return (
    <>
      {/* Mobile-first Stack with consistent spacing */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* My Balance */}
          <MyBalance balance={balance} setBalance={setBalance} />

          {/* My Transactions - Mobile Button */}
          <div className="lg:hidden flex flex-col gap-2">
            <MyTransactions onBalanceUpdate={setBalance} />
          </div>

          {/* Assistance + Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Assistance />
            <Feedback />
          </div>

          {/* Concerns History - Conditional */}
          {(role === "student" || role === "employee") && (
            <div className="flex flex-col gap-2 lg:mt-0">
              <ConcernsHistory />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Desktop My Transactions */}
        <div className="hidden lg:block">
          <MyTransactions onBalanceUpdate={setBalance} />
        </div>
      </div>
    </>
  );
}
