import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      {/* Sidebar with Header */}
      <Sidebar />

      {/* Right Column: Page Content */}
      <main
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          background: "#f5f5f5",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;