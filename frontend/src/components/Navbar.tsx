import { NavLink } from "react-router-dom";
import { Upload, LayoutDashboard, ClipboardCheck, Settings } from "lucide-react";

const links = [
  { to: "/",         label: "Upload",    icon: Upload },
  { to: "/dashboard",label: "Dashboard", icon: LayoutDashboard },
  { to: "/review",   label: "Review",    icon: ClipboardCheck },
  { to: "/settings", label: "Settings",  icon: Settings },
];

export default function Navbar() {
  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-1">
        <span className="font-bold text-lg tracking-tight mr-6">FuelDocs OCR</span>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive ? "bg-white/20" : "hover:bg-white/10"
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
