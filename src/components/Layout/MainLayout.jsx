import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

const MainLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const resetExpiry = () =>
      localStorage.setItem("authExpiry", String(Date.now() + TIMEOUT_MS));

    const checkExpiry = () => {
      const expiry = Number(localStorage.getItem("authExpiry") || 0);
      if (Date.now() >= expiry) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authExpiry");
        navigate("/login", { replace: true });
      }
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetExpiry, { passive: true }));
    const interval = setInterval(checkExpiry, 30_000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetExpiry));
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <Sidebar />

      {/* Right column: header + scrollable content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <main style={{ flex: 1, padding: "20px", overflowY: "auto", background: "#f5f5f5" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;