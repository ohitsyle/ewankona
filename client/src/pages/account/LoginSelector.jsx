import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginSelector() {
  const navigate = useNavigate();

  const portals = [
    {
      type: 'admin',
      title: 'Admin Portal',
      icon: '👨‍💼',
      description: 'Motorpool & System Administration',
      color: '#FFD41C',
      path: '/login/admin'
    },
    {
      type: 'merchant',
      title: 'Merchant Portal',
      icon: '🏪',
      description: 'Business & Transaction Management',
      color: '#22C55E',
      path: '/merchant/login'
    },
    {
      type: 'user',
      title: 'Student Portal',
      icon: '🎓',
      description: 'Student Dashboard & Services',
      color: '#3B82F6',
      path: '/login/user'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F1227] to-[#181D40] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#FFD41C] opacity-5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#FFD41C] opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFD41C] rounded-2xl mb-6 shadow-lg shadow-[rgba(255,212,28,0.3)]">
            <span className="text-4xl font-extrabold text-[#181D40]">NU</span>
          </div>
          <h1 className="text-4xl font-extrabold text-[#FBFBFB] mb-3 tracking-tight">
            NUCash Platform
          </h1>
          <p className="text-lg text-[rgba(251,251,251,0.6)]">
            Select your portal to continue
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-3 gap-6">
          {portals.map((portal) => (
            <button
              key={portal.type}
              onClick={() => navigate(portal.path)}
              className="group bg-[rgba(30,35,71,0.8)] backdrop-blur-sm rounded-2xl p-8 border-2 border-[rgba(255,212,28,0.2)] hover:border-[rgba(255,212,28,0.6)] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[rgba(255,212,28,0.2)] text-left"
            >
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `${portal.color}20`,
                  border: `2px solid ${portal.color}40`
                }}
              >
                {portal.icon}
              </div>

              <h3
                className="text-2xl font-bold mb-2 transition-colors duration-300"
                style={{ color: portal.color }}
              >
                {portal.title}
              </h3>

              <p className="text-sm text-[rgba(251,251,251,0.6)] mb-6">
                {portal.description}
              </p>

              <div className="flex items-center gap-2 text-sm font-semibold text-[rgba(251,251,251,0.7)] group-hover:text-[#FFD41C] transition-colors duration-300">
                <span>Continue</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-[rgba(251,251,251,0.4)]">
          © 2026 National University Laguna • NUCash Platform
        </div>
      </div>
    </div>
  );
}
