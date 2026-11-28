import { useState } from 'react';
import {
  Activity, Bell, Box, Building2, ChartNoAxesCombined, ChevronDown,
  CircleHelp, CreditCard, LayoutDashboard, LogOut, Menu, Moon, Package,
  PanelLeftClose, Settings, ShieldCheck, ShoppingCart, Sun, Users, Wallet,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import '../../styles/Dashboard.css';

const NAVIGATION = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard', permissions: ['dashboard.read'], roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Gestion des utilisateurs', icon: Users, path: '/users', permissions: ['users.read', 'account_requests.read'], roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Produits', icon: Package, path: '/products', permissions: ['products.read'], roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SELLER'] },
  { label: 'Catégories', icon: Box, path: '/categories', permissions: ['categories.read'], roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { label: 'Gestion des stocks', icon: Wallet, path: '/inventory', permissions: ['stock.read'], roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SELLER'] },
  { label: 'Ventes', icon: ShoppingCart, path: '/sales', permissions: ['sales.read.all', 'sales.read.own'], roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SELLER'] },
  { label: 'Gestion des caisses', icon: CreditCard, path: '/cash', permissions: ['cash_session.read'], roles: ['SUPER_ADMIN', 'ADMIN', 'SELLER'] },
  { label: 'Rapports et statistiques', icon: ChartNoAxesCombined, path: '/reports', permissions: ['reports.read.company', 'reports.read.store', 'reports.read.own'], roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SELLER'] },
  { label: "Journal des activités", icon: Activity, path: '/audit', permissions: ['audit.read'], roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Paramètres', icon: Settings, path: '/settings', permissions: ['system.settings.manage'], roles: ['SUPER_ADMIN'] },
];

function getRole(user) {
  return String(user?.role?.name ?? user?.role ?? user?.roles?.[0]?.name ?? user?.roles?.[0] ?? '')
    .toUpperCase().replaceAll('-', '_');
}

function hasPermission(user, item) {
  const permissions = user?.permissions ?? user?.role?.permissions ?? [];
  if (Array.isArray(permissions) && permissions.length) {
    return item.permissions.some((permission) => permissions.includes(permission));
  }
  return item.roles.includes(getRole(user));
}

function getInitials(user) {
  const first = user?.firstName ?? user?.first_name ?? '';
  const last = user?.lastName ?? user?.last_name ?? '';
  const full = [first, last].filter(Boolean).join(' ') || user?.fullName || user?.email || 'U';
  return full.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function Sidebar({ user, collapsed, onToggle, onLogout, activePath }) {
  const company = user?.company?.name ?? user?.companyName ?? user?.company?.legalName ?? 'ROTL SARL';
  const name = [user?.firstName ?? user?.first_name, user?.lastName ?? user?.last_name]
    .filter(Boolean).join(' ') || user?.fullName || user?.email || 'Utilisateur';
  const role = getRole(user).replaceAll('_', ' ') || 'Utilisateur';
  const links = NAVIGATION.filter((item) => hasPermission(user, item));

  return (
    <aside className={`rotl-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <a href="/dashboard" className="rotl-logo" aria-label="ROTL Manager">
          <span className="logo-mark">R</span>
          <span className="logo-word"><b>ROTL</b><small>MANAGER</small></span>
        </a>
        <button className="sidebar-collapse" onClick={onToggle} aria-label="Réduire le menu"><PanelLeftClose size={19}/></button>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{getInitials(user)}</div>
        <div className="user-meta">
          <strong>{name}</strong>
          <span><ShieldCheck size={12}/> {role}</span>
        </div>
      </div>

      <button className="company-switch" type="button">
        <Building2 size={17}/><span>{company}</span><ChevronDown size={15}/>
      </button>
      <div className="sidebar-divider"/>

      <nav className="sidebar-nav" aria-label="Navigation principale">
        {links.map((item) => (
          <NavLink key={item.path} to={item.path} end
            className={({ isActive }) => `nav-link ${(activePath ? activePath === item.path : isActive) ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}>
            <item.icon size={19}/><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <a href="/help" className="nav-link"><CircleHelp size={19}/><span>Aide et support</span></a>
        <div className="version-pill"><span className="version-dot"/> Version 1.0.0</div>
        <button className="logout-link" onClick={onLogout}><LogOut size={18}/><span>Déconnexion</span></button>
      </div>
    </aside>
  );
}

function Topbar({ theme, onTheme, onMenu, user, title, activePath, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const PageIcon = activePath === '/dashboard' ? LayoutDashboard : Users;
  const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.fullName || user?.email || 'Utilisateur';
  const company = user?.company?.name ?? user?.companyName ?? user?.company?.legalName ?? 'ROTL SARL';
  return (
    <header className="rotl-topbar">
      <div className="topbar-left">
        <button className="mobile-menu" onClick={onMenu} aria-label="Ouvrir ou réduire la navigation"><Menu size={21}/></button>
        <div className="topbar-title"><PageIcon size={20}/><span>{title}</span></div>
      </div>
      <div className="topbar-actions">
        <div className="topbar-company"><Building2 size={16}/><span>{company}</span><ChevronDown size={14}/></div>
        <button className="theme-control" onClick={onTheme} aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}>
          <Sun size={17}/><span className={`theme-switch ${theme === 'dark' ? 'dark' : ''}`}><i/></span><Moon size={17}/>
        </button>
        <button className="icon-top-button notification-button" aria-label="Notifications"><Bell size={19}/><b>3</b></button>
        <div className="topbar-profile-wrap">
          <button type="button" className="topbar-profile" title={profileName} onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen}>
            <span>{getInitials(user)}</span><ChevronDown size={13}/>
          </button>
          {profileOpen && <div className="topbar-profile-menu">
            <strong>{profileName}</strong>
            <small>{getRole(user).replaceAll('_', ' ') || 'Utilisateur'}</small>
            <button type="button" onClick={onLogout}><LogOut size={14}/>Déconnexion</button>
          </div>}
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ user, theme, onTheme, onLogout, activePath, title, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = () => {
    if (window.innerWidth <= 760) setMobileOpen((value) => !value);
    else setCollapsed((value) => !value);
  };

  return (
    <div className={`dashboard-shell ${mobileOpen ? 'mobile-sidebar-open' : ''}`} data-theme={theme}>
      {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu"/>}
      <Sidebar user={user ?? {}} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)}
        onLogout={onLogout} activePath={activePath}/>
      <div className="dashboard-main">
        <Topbar theme={theme} onTheme={onTheme} onMenu={handleMenu} onLogout={onLogout} user={user ?? {}} title={title} activePath={activePath}/>
        {children}
        <footer className="dashboard-footer">ROTL MANAGER <span>•</span> Version 1.0.0</footer>
      </div>
    </div>
  );
}
