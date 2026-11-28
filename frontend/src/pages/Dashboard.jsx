import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Activity, Building2, CalendarDays, ChartNoAxesCombined, Clock3,
  ChevronRight, Package, ShieldCheck, ShoppingCart, Users, Wallet,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { dashboardService } from '../services/dashboardService';
import '../styles/Dashboard.css';

const THEME_KEY = 'rotl_dashboard_theme';
const money = (value, currency = 'CDF') => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(amount) + ' ' + currency;
};
const number = (value) => value === null || value === undefined ? '—' : new Intl.NumberFormat('fr-FR').format(Number(value));
const dateLabel = () => new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
const timeLabel = () => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());



function readToken() {
  return localStorage.getItem('rotl_access_token') || sessionStorage.getItem('rotl_access_token');
}
function extractData(response) {
  return response?.data ?? response ?? {};
}

const PREVIEW_MODE = import.meta.env.VITE_ENABLE_DASHBOARD_PREVIEW === 'true';
const PREVIEW_USER = {
  firstName: 'Administrateur',
  lastName: 'ROTL',
  email: 'admin@rotl.local',
  role: 'SUPER_ADMIN',
  companyName: 'ROTL Entreprise',
  status: 'Aperçu local',
};
const PREVIEW_OVERVIEW = {
  kpis: {
    todaySales: { value: 1250000, currency: 'CDF' },
    productsInStock: 248,
    activeUsers: 12,
    revenue: { value: 8750000, currency: 'CDF' },
  },
  sales: {
    series: [
      { label: 'Lun', total: 850000 },
      { label: 'Mar', total: 1120000 },
      { label: 'Mer', total: 940000 },
      { label: 'Jeu', total: 1380000 },
      { label: 'Ven', total: 1210000 },
      { label: 'Sam', total: 1650000 },
      { label: 'Dim', total: 1250000 },
    ],
  },
  stock: { available: 210, lowStock: 28, outOfStock: 10 },
  recentActivities: [
    { id: 1, description: 'Vente enregistrée — Caisse 01', createdAt: 'Aujourd’hui, 09:42' },
    { id: 2, description: 'Nouveau produit ajouté au catalogue', createdAt: 'Aujourd’hui, 09:15' },
    { id: 3, description: 'Mise à jour du stock effectuée', createdAt: 'Aujourd’hui, 08:56' },
    { id: 4, description: 'Session de caisse ouverte', createdAt: 'Aujourd’hui, 08:30' },
    { id: 5, description: 'Nouvel utilisateur ajouté', createdAt: 'Hier, 16:20' },
  ],
};

function Hero({ user }) {
  const firstName = user?.firstName ?? user?.first_name ?? user?.fullName?.split(' ')[0] ?? 'Utilisateur';
  return <section className="dashboard-hero" aria-label="Bienvenue">
    <div className="hero-copy"><p className="hero-eyebrow">BIENVENUE SUR ROTL MANAGER</p><h1>Bonjour, <span>{firstName} !</span></h1><p>Voici un aperçu de l'activité de votre entreprise aujourd'hui.</p><div className="hero-underline"/></div>
    <div className="hero-date"><CalendarDays size={17}/><span>{dateLabel()}</span><strong>{timeLabel()}</strong><small>Heure locale</small></div>
  </section>;
}

function KpiCard({ icon: Icon, title, value, detail, tone }) {
  return <article className="kpi-card"><div className={`kpi-icon ${tone}`}><Icon size={21}/></div><div className="kpi-copy"><span>{title}</span><strong>{value ?? '—'}</strong>{detail && <small>{detail}</small>}</div></article>;
}

function SalesChart({ data }) {
  const points = Array.isArray(data) ? data : [];
  if (!points.length) return <div className="chart-empty"><ChartNoAxesCombined size={25}/><span>Les données de ventes apparaîtront ici dès que le service de rapports sera disponible.</span></div>;
  const values = points.map((point) => Number(point.total ?? point.amount ?? point.value ?? 0));
  const max = Math.max(...values, 1);
  const coords = values.map((value, index) => ({ x: 36 + index * (600 / Math.max(values.length - 1, 1)), y: 150 - (value / max) * 118 }));
  const line = coords.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `36,150 ${line} ${coords.at(-1)?.x ?? 636},150`;
  return <div className="chart-wrap"><svg viewBox="0 0 672 190" role="img" aria-label="Évolution des ventes">
    {[30,70,110,150].map((y)=><line key={y} x1="36" x2="636" y1={y} y2={y} className="chart-grid"/>)}<polygon points={area} className="chart-area"/><polyline points={line} className="chart-line"/>
    {coords.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="4" className="chart-point"><title>{money(values[i], points[i]?.currency || 'CDF')}</title></circle>)}
    {points.map((point,i)=><text key={i} x={coords[i].x} y="177" textAnchor="middle" className="chart-label">{point.label ?? point.date ?? ''}</text>)}
  </svg></div>;
}

function StockSummary({ stock }) {
  const available = Number(stock?.available ?? stock?.availableProducts ?? 0);
  const low = Number(stock?.lowStock ?? stock?.low ?? 0);
  const out = Number(stock?.outOfStock ?? stock?.out ?? 0);
  const total = available + low + out;
  if (!stock || stock.available === undefined && stock.availableProducts === undefined) return <div className="stock-empty">Aucune donnée de stock disponible pour le moment.</div>;
  const pct = total ? Math.round((available / total) * 100) : 0;
  return <div className="stock-summary"><div className="stock-donut" style={{'--stock-pct': `${pct}%`}}><strong>{pct}%</strong><small>Disponibles</small></div><div className="stock-legend"><p><i className="dot available"/>Produits disponibles <b>{number(available)}</b></p><p><i className="dot low"/>Stock faible <b>{number(low)}</b></p><p><i className="dot out"/>En rupture <b>{number(out)}</b></p></div></div>;
}

function ActivityList({ activities }) {
  if (!Array.isArray(activities) || !activities.length) return <div className="activity-empty">Aucune activité récente à afficher.</div>;
  return <div className="activity-list">{activities.slice(0,5).map((item,index)=><div className="activity-row" key={item.id ?? index}><span className="activity-symbol"><Activity size={16}/></span><div><strong>{item.description ?? item.message ?? item.action ?? 'Activité enregistrée'}</strong><small>{item.createdAt ?? item.date ?? item.timestamp ?? ''}</small></div></div>)}</div>;
}

function Dashboard() {
  const navigate = useNavigate();
  const token = readToken();
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [period, setPeriod] = useState('7d');
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem(THEME_KEY, theme); }, [theme]);
  const logout = useCallback(() => { localStorage.removeItem('rotl_access_token'); sessionStorage.removeItem('rotl_access_token'); navigate('/login', { replace: true }); }, [navigate]);

  useEffect(() => {
    if (!token && PREVIEW_MODE) {
      setUser(PREVIEW_USER);
      setOverview(PREVIEW_OVERVIEW);
      setError('Mode aperçu Frontend : les données affichées sont fictives et ne proviennent pas du Backend.');
      setLoading(false);
      return;
    }
    if (!token) return;
    let active = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const profile = await dashboardService.getCurrentUser(token);
        if (!active) return;
        setUser(profile?.user ?? profile);
        try {
          const result = await dashboardService.getOverview(token, period);
          if (active) setOverview(extractData(result));
        } catch (dashboardError) {
          if (active) { setOverview(null); setError(dashboardError.message || "Les statistiques ne sont pas encore accessibles."); }
        }
      } catch (profileError) {
        if (active) {
          if ([401,403].includes(profileError.status)) logout();
          else setError(profileError.message || "Impossible de charger le profil utilisateur.");
        }
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [token, period, logout]);

  if (!token && !PREVIEW_MODE) return <Navigate to="/login" replace />;
  const data = overview ?? {};
  const kpis = data.kpis ?? data.metrics ?? {};
  const sales = data.sales ?? {};
  const stock = data.stock ?? data.inventory ?? null;
  const activities = data.recentActivities ?? data.activities ?? [];
  const companyName = user?.company?.name ?? user?.companyName ?? '';
  const displayName = [user?.firstName,user?.lastName].filter(Boolean).join(' ') || user?.fullName || user?.email || 'Utilisateur';

  return <AppLayout user={user ?? {}} theme={theme}
    onTheme={()=>setTheme(t=>t==='light'?'dark':'light')} onLogout={logout}
    activePath="/dashboard" title="Tableau de bord">
      <main className="dashboard-content">
        <div className="page-heading"><div><span className="page-kicker">VUE D'ENSEMBLE</span><h2>Tableau de bord</h2><p>Suivez les indicateurs essentiels de votre entreprise.</p></div><div className="heading-company">{companyName}</div></div>
        {error && <div className="dashboard-alert" role="status">{error}</div>}
        <Hero user={user ?? {}}/>
        <section className="kpi-grid" aria-label="Indicateurs principaux">
          <KpiCard icon={ShoppingCart} title="Ventes du jour" value={money(kpis.todaySales?.value ?? kpis.todaySales, kpis.todaySales?.currency ?? 'CDF')} tone="red"/>
          <KpiCard icon={Package} title="Produits en stock" value={number(kpis.productsInStock ?? kpis.stockProducts)} tone="gold"/>
          <KpiCard icon={Users} title="Utilisateurs actifs" value={number(kpis.activeUsers)} tone="blue"/>
          <KpiCard icon={Wallet} title="Chiffre d'affaires" value={money(kpis.revenue?.value ?? kpis.revenue, kpis.revenue?.currency ?? 'CDF')} detail={period==='7d'?'7 derniers jours':'30 derniers jours'} tone="green"/>
        </section>
        <section className="dashboard-panels">
          <article className="panel sales-panel"><div className="panel-heading"><div><ChartNoAxesCombined size={19}/><h3>Évolution des ventes</h3></div><select value={period} onChange={(e)=>setPeriod(e.target.value)} aria-label="Période des ventes"><option value="7d">7 derniers jours</option><option value="30d">30 derniers jours</option></select></div><SalesChart data={sales.series ?? data.salesSeries}/></article>
          <article className="panel stock-panel"><div className="panel-heading"><div><Package size={19}/><h3>État des stocks</h3></div><a href="/inventory">Voir le stock <ChevronRight size={15}/></a></div><StockSummary stock={stock}/></article>
          <article className="panel activities-panel"><div className="panel-heading"><div><Activity size={19}/><h3>Activités récentes</h3></div><a href="/audit">Voir tout <ChevronRight size={15}/></a></div><ActivityList activities={activities}/></article>
          <article className="panel system-panel"><div className="panel-heading"><div><ShieldCheck size={19}/><h3>Informations système</h3></div></div><div className="system-rows"><p><Building2 size={16}/>Entreprise <b>{companyName || '—'}</b></p><p><Users size={16}/>Utilisateur <b>{displayName}</b></p><p><Clock3 size={16}/>Heure locale <b>{timeLabel()}</b></p><p><ShieldCheck size={16}/>Statut du compte <b className="status-ok">{user?.status ?? 'Connecté'}</b></p></div></article>
        </section>
        {loading && <div className="dashboard-loading"><span/> Chargement des données du tableau de bord…</div>}
      </main>
    </AppLayout>;
}
export default Dashboard;
