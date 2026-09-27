import {
  LayoutDashboard,
  TrendingUp,
  Ship,
  Anchor,
  ShoppingCart,
  FileBarChart,
  Settings,
} from "lucide-react";

function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
    id: "freight-forecast",
      label: "Freight Forecast",
      icon: TrendingUp,
    },
    {
      id: "chartering",
      label: "Charter Decision",
      icon: Ship,
    },
    {
      id: "ports",
      label: "Vessel & Ports",
      icon: Anchor,
    },
    {
      id: "procurement",
      label: "Procurement",
      icon: ShoppingCart,
    },
    {
      id: "audit",
      label: "Decision Audit",
      icon: FileBarChart,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Ship size={22} />
        </div>

        <div>
          <h1>CHARTER</h1>
          <span>COMPASS</span>
        </div>
      </div>

      <div className="sidebar-label">NAVIGATION</div>

      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
  className={`nav-item ${activePage === "settings" ? "active" : ""}`}
  onClick={() => setActivePage("settings")}>
          <Settings size={19} />
          <span>System Settings</span>
        </button>

        <div className="system-status">
          <span className="status-dot"></span>

          <div>
            <strong>System Online</strong>
            <small>SIH26006 • v0.1</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;