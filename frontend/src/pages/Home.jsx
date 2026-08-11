import React, { useState } from 'react';
import Hero from '../components/Hero';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [dashboardData, setDashboardData] = useState(null);

  const handleAnalyze = (data) => {
    setDashboardData(data);
    setTimeout(() => {
      const dashboardElement = document.getElementById('dashboard');
      if (dashboardElement) {
        dashboardElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <>
      <Hero onAnalyze={handleAnalyze} />
      {dashboardData && <Dashboard data={dashboardData} />}
    </>
  );
}
