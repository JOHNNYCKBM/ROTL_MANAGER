import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Activity, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3,
  Copy, Eye, IdCard, Pencil, Plus, RefreshCw, Search, ShieldCheck,
  Trash2, UserCheck, Users, UserX, X, AlertTriangle,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { authService } from '../services/authService';
import { usersService } from '../services/usersService';
import '../styles/Users.css';

const THEME_KEY = 'rotl_dashboard_theme';
const PREVIEW_MODE = import.meta.env.VITE_ENABLE_DASHBOARD_PREVIEW === 'true';
const PAGE_SIZE = 5;

const PREVIEW_USER = {
  id: 'preview-admin',
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'admin@rotl.local',
  role: 'ADMIN',
  companyName: 'ROTL SARL',
};

const PREVIEW_PENDING = [
  { id: 'request-1', firstName: 'Mwamba', lastName: 'Kabongo', email: 'mwamba.kabongo@email.com', phone: '+243 970 123 456', requestedAt: '2025-04-24T14:30:00' },
  { id: 'request-2', firstName: 'Kalenga', lastName: 'Mbuyi', email: 'kalenga.mbuyi@email.com', phone: '+243 996 888 777', requestedAt: '2025-04-23T16:20:00' },
  { id: 'request-3', firstName: 'Tshibangu', lastName: 'Daniel', email: 'tshibangu.daniel@email.com', phone: '+243 852 147 369', requestedAt: '2025-04-22T11:15:00' },
];

const PREVIEW_EMPLOYEES = [
  { id: 'employee-1', firstName: 'Kabasele', lastName: 'Marie', email: 'marie.kabasele@rotl.local', phone: '+243 970 100 101', role: 'MANAGER', matricule: '1234567890', status: 'ACTIVE', assignedAt: '2025-01-15' },
  { id: 'employee-2', firstName: 'Mbuyi', lastName: 'Patrick', email: 'patrick.mbuyi@rotl.local', phone: '+243 996 100 102', role: 'SELLER', matricule: '0987654321', status: 'ACTIVE', assignedAt: '2025-01-20' },
  { id: 'employee-3', firstName: 'Tshibangu', lastName: 'Daniel', email: 'tshibangu.daniel@rotl.local', phone: '+243 852 100 103', role: 'SELLER', matricule: '1122334455', status: 'SUSPENDED', assignedAt: '2025-01-10' },
];

const PREVIEW_STATS = {
  pendingRequests: 5,
  activeEmployees: 24,
  activeAccounts: 26,
  generatedMatricules: 1250,
};

function readToken() {
  return localStorage.getItem('rotl_access_token') || sessionStorage.getItem('rotl_access_token');
}

function unwrap(response) {
  return response?.data ?? response?.result ?? response ?? {};
}

function asList(response, keys) {
  const value = unwrap(response);
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  if (Array.isArray(value?.content)) return value.content;
  return [];
}

function normalizeRole(user) {
  return String(user?.role?.name ?? user?.role ?? user?.roles?.[0]?.name ?? user?.roles?.[0] ?? '')
    .toUpperCase().replace(/^ROLE_/, '').replaceAll('-', '_');
}

function canAccessUsers(user) {
  const permissions = user?.permissions ?? user?.role?.permissions ?? [];
  if (Array.isArray(permissions) && permissions.length) {
    return permissions.some((permission) => ['users.read', 'account_requests.read'].includes(permission));
  }
  return ['SUPER_ADMIN', 'ADMIN'].includes(normalizeRole(user));
}

function fullName(person) {
  return [person?.firstName ?? person?.first_name, person?.lastName ?? person?.last_name]
    .filter(Boolean).join(' ') || person?.fullName || person?.name || 'Utilisateur';
}

function initials(person) {
  return fullName(person).split(/\\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function roleLabel(role) {
  const value = String(role?.name ?? role ?? '').toUpperCase().replace(/^ROLE_/, '');
  if (value === 'MANAGER' || value === 'GESTIONNAIRE') return 'Gestionnaire';
  if (value === 'SELLER' || value === 'VENDEUR') return 'Vendeur';
  return value ? value.replaceAll('_', ' ') : '—';
}

function statusValue(employee) {
  const value = String(employee?.status ?? employee?.accountStatus ?? 'ACTIVE').toUpperCase();
  return value.includes('SUSPEND') || value.includes('INACTIVE') ? 'SUSPENDED' : 'ACTIVE';
}

function dateLabel(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...(String(value).includes('T') ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(parsed);
}

function matriculeOf(person) {
  return person?.matricule ?? person?.employeeNumber ?? person?.registrationNumber ?? '—';
}

function errorText(error) {
  if (error?.status === 401) return 'Votre session a expiré. Veuillez vous reconnecter.';
  if (error?.status === 403) return "Vous ne disposez pas des autorisations nécessaires pour cette opération.";
  if (error?.status === 404) return "L'API demandée n'est pas encore disponible côté Backend.";
  return error?.message || 'Une erreur est survenue. Veuillez réessayer.';
}

function Avatar({ person, large = false }) {
  return <span className={`user-avatar-chip ${large ? 'large' : ''}`}>{initials(person)}</span>;
}

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <article className="users-metric-card">
      <div className={`users-metric-icon ${tone}`}><Icon size={21}/></div>
      <div className="users-metric-copy"><span>{label}</span><strong>{value ?? '—'}</strong></div>
      <ChevronRight size={18} className="users-metric-arrow"/>
    </article>
  );
}

function Modal({ title, description, onClose, children, wide = false }) {
  return (
    <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`users-modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="users-modal-title">
        <header className="users-modal-header">
          <div><h3 id="users-modal-title">{title}</h3>{description && <p>{description}</p>}</div>
          <button type="button" className="users-icon-button" onClick={onClose} aria-label="Fermer"><X size={19}/></button>
        </header>
        <div className="users-modal-body">{children}</div>
      </section>
    </div>
  );
}

function DetailLine({ label, value, copy = false }) {
  const text = value === null || value === undefined || value === '' ? '—' : String(value);
  return <div className="users-detail-line"><span>{label}</span><strong>{text}</strong>
    {copy && text !== '—' && <button type="button" className="users-copy-button" onClick={() => navigator.clipboard?.writeText(text)} aria-label={`Copier ${label}`}><Copy size={14}/></button>}
  </div>;
}

function EmptyState({ title, description, action }) {
  return <div className="users-empty-state"><Users size={28}/><strong>{title}</strong><p>{description}</p>{action}</div>;
}

function Pager({ page, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total <= PAGE_SIZE) {
    return <div className="users-table-footer"><span>{total ? `Affichage de 1 à ${total} sur ${total}` : 'Aucun résultat'}</span></div>;
  }
  return (
    <div className="users-table-footer">
      <span>{`Affichage de ${(page - 1) * PAGE_SIZE + 1} à ${Math.min(page * PAGE_SIZE, total)} sur ${total}`}</span>
      <div className="users-pagination">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Page précédente"><ChevronLeft size={17}/></button>
        <span>{page}</span>
        <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Page suivante"><ChevronRight size={17}/></button>
      </div>
    </div>
  );
}

function UserForm({ form, setForm, onSubmit, onCancel, busy, editing, preview }) {
  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  return (
    <form className="users-form" onSubmit={onSubmit}>
      <div className="users-form-grid">
        <label>Prénom<input name="firstName" value={form.firstName} onChange={handleChange} autoComplete="given-name" required/></label>
        <label>Nom<input name="lastName" value={form.lastName} onChange={handleChange} autoComplete="family-name" required/></label>
        <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" required/></label>
        <label>Téléphone<input type="tel" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" required/></label>
        <label className="full">Rôle
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="MANAGER">Gestionnaire</option><option value="SELLER">Vendeur</option>
          </select>
        </label>
      </div>
      {preview && <p className="users-preview-form-note">Mode aperçu : le formulaire est consultable, mais aucune création ou modification ne sera enregistrée. Le matricule sera généré par le Backend.</p>}
      <div className="users-modal-actions">
        <button type="button" className="users-btn secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="users-btn primary" disabled={busy}>{busy ? 'Traitement…' : editing ? 'Enregistrer les modifications' : 'Créer le compte'}</button>
      </div>
    </form>
  );
}

function UsersPage() {
  const navigate = useNavigate();
  const token = readToken();
  const preview = PREVIEW_MODE && !token;
  const requestInFlight = useRef(false);

  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [user, setUser] = useState(preview ? PREVIEW_USER : null);
  const [statistics, setStatistics] = useState(preview ? PREVIEW_STATS : null);
  const [pendingRequests, setPendingRequests] = useState(preview ? PREVIEW_PENDING : []);
  const [employees, setEmployees] = useState(preview ? PREVIEW_EMPLOYEES : []);
  const [loading, setLoading] = useState(!preview);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'SELLER' });
  const [busy, setBusy] = useState(false);

  const [pendingSearch, setPendingSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pendingPage, setPendingPage] = useState(1);
  const [employeePage, setEmployeePage] = useState(1);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const logout = useCallback(() => {
    localStorage.removeItem('rotl_access_token');
    sessionStorage.removeItem('rotl_access_token');
    navigate('/login', { replace: true });
  }, [navigate]);

  const refreshData = useCallback(async (initial = false) => {
    if (!token || preview || requestInFlight.current) return;
    requestInFlight.current = true;
    if (initial) setLoading(true);
    else setRefreshing(true);

    try {
      const results = await Promise.allSettled([
        usersService.getStatistics(token),
        usersService.getPendingRequests(token),
        usersService.getEmployees(token),
      ]);
      const [statsResult, requestsResult, employeesResult] = results;
      let failures = 0;

      if (statsResult.status === 'fulfilled') {
        const raw = unwrap(statsResult.value);
        setStatistics({
          pendingRequests: raw.pendingRequests ?? raw.pendingRequestCount ?? raw.pending ?? raw.kpis?.pendingRequests ?? 0,
          activeEmployees: raw.activeEmployees ?? raw.activeEmployeeCount ?? raw.employeesActive ?? raw.kpis?.activeEmployees ?? 0,
          activeAccounts: raw.activeAccounts ?? raw.activeAccountCount ?? raw.accountsActive ?? raw.kpis?.activeAccounts ?? 0,
          generatedMatricules: raw.generatedMatricules ?? raw.totalMatricules ?? raw.matriculesGenerated ?? raw.kpis?.generatedMatricules ?? 0,
        });
      } else failures += 1;

      if (requestsResult.status === 'fulfilled') {
        setPendingRequests(asList(requestsResult.value, ['requests', 'items', 'data']));
      } else failures += 1;

      if (employeesResult.status === 'fulfilled') {
        setEmployees(asList(employeesResult.value, ['users', 'employees', 'items', 'data']));
      } else failures += 1;

      setError(failures ? 'Certaines données ne sont pas accessibles. Vérifiez les contrats API et réessayez.' : '');
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, preview]);

  useEffect(() => {
    let active = true;
    async function initialize() {
      if (preview) {
        setUser(PREVIEW_USER);
        setStatistics(PREVIEW_STATS);
        setPendingRequests(PREVIEW_PENDING);
        setEmployees(PREVIEW_EMPLOYEES);
        setLoading(false);
        return;
      }
      if (!token) return;

      try {
        const response = await authService.getCurrentUser(token);
        if (!active) return;
        const profile = unwrap(response);
        setUser(profile?.user ?? profile);
      } catch (profileError) {
        if (!active) return;
        if (profileError?.status === 401) logout();
        else setError(errorText(profileError));
      }
      if (active) await refreshData(true);
    }
    initialize();
    return () => { active = false; };
  }, [token, preview, logout, refreshData]);

  useEffect(() => {
    if (!token || preview) return undefined;
    const interval = window.setInterval(() => refreshData(false), 5000);
    return () => window.clearInterval(interval);
  }, [token, preview, refreshData]);

  const accessGranted = preview || canAccessUsers(user);
  const pendingFiltered = useMemo(() => {
    const q = pendingSearch.trim().toLowerCase();
    return pendingRequests.filter((person) => {
      const searchable = [fullName(person), person.email, person.phone, person.telephone].filter(Boolean).join(' ').toLowerCase();
      return !q || searchable.includes(q);
    });
  }, [pendingRequests, pendingSearch]);

  const employeesFiltered = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    return employees.filter((employee) => {
      const searchable = [fullName(employee), employee.email, matriculeOf(employee)].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !q || searchable.includes(q);
      const matchesRole = roleFilter === 'ALL' || normalizeRole(employee) === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || statusValue(employee) === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [employees, employeeSearch, roleFilter, statusFilter]);

  useEffect(() => setPendingPage(1), [pendingSearch]);
  useEffect(() => setEmployeePage(1), [employeeSearch, roleFilter, statusFilter]);

  const pendingPageItems = pendingFiltered.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);
  const employeePageItems = employeesFiltered.slice((employeePage - 1) * PAGE_SIZE, employeePage * PAGE_SIZE);

  function openCreate() {
    setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'SELLER' });
    setModal({ type: 'create' });
  }

  function openEdit(employee) {
    setForm({
      firstName: employee.firstName ?? employee.first_name ?? '',
      lastName: employee.lastName ?? employee.last_name ?? '',
      email: employee.email ?? '',
      phone: employee.phone ?? employee.telephone ?? '',
      role: normalizeRole(employee) === 'MANAGER' ? 'MANAGER' : 'SELLER',
    });
    setModal({ type: 'edit', person: employee });
  }

  async function submitForm(event) {
    event.preventDefault();
    if (preview) {
      setNotice('Mode aperçu : aucune modification n’a été envoyée au Backend.');
      setModal(null);
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (modal.type === 'create') {
        const response = await usersService.createEmployee(token, form);
        const result = unwrap(response);
        const employee = result?.user ?? result?.employee ?? result;
        const matricule = matriculeOf(employee);
        setNotice(matricule !== '—' ? `Employé créé. Matricule : ${matricule}` : 'Employé créé avec succès.');
      } else {
        await usersService.updateEmployee(token, modal.person.id ?? modal.person.userId, form);
        setNotice('Les informations de l’employé ont été mises à jour.');
      }
      setModal(null);
      await refreshData(false);
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function confirmModalAction() {
    if (!modal?.person) return;
    if (preview) {
      setNotice('Mode aperçu : cette opération n’a pas été envoyée au Backend.');
      setModal(null);
      return;
    }
    const person = modal.person;
    const id = person.id ?? person.userId ?? person.requestId;
    setBusy(true);
    setError('');
    try {
      let message = '';
      if (modal.action === 'approve') {
        const response = await usersService.approveRequest(token, id, modal.role ?? 'SELLER');
        const result = unwrap(response);
        const employee = result?.user ?? result?.employee ?? result;
        const matricule = matriculeOf(employee);
        message = matricule !== '—' ? `Demande validée. Matricule attribué : ${matricule}` : 'Demande validée avec succès.';
      } else if (modal.action === 'reject') {
        await usersService.rejectRequest(token, id);
        message = 'La demande a été rejetée.';
      } else if (modal.action === 'suspend') {
        await usersService.suspendEmployee(token, id);
        message = 'Le compte a été suspendu.';
      } else if (modal.action === 'activate') {
        await usersService.activateEmployee(token, id);
        message = 'Le compte a été réactivé.';
      } else if (modal.action === 'delete') {
        await usersService.deleteEmployee(token, id);
        message = 'Le compte a été supprimé.';
      }
      setModal(null);
      setNotice(message);
      await refreshData(false);
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setBusy(false);
    }
  }

  function openConfirm(action, person) {
    setModal({ type: 'confirm', action, person, role: 'SELLER' });
  }

  const pendingCount = statistics?.pendingRequests ?? pendingRequests.length;
  const activeEmployees = statistics?.activeEmployees ?? employees.filter((item) => statusValue(item) === 'ACTIVE').length;
  const activeAccounts = statistics?.activeAccounts ?? activeEmployees;
  const generatedMatricules = statistics?.generatedMatricules ?? '—';

  if (!token && !PREVIEW_MODE) return <Navigate to="/login" replace/>;

  return (
    <AppLayout user={user ?? {}} theme={theme}
      onTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
      onLogout={logout} activePath="/users" title="Gestion des utilisateurs">
      <main className="dashboard-content users-page">
        <section className="users-hero">
          <div className="users-hero-copy">
            <span className="users-hero-greeting">Bonjour, {user?.firstName ?? user?.first_name ?? fullName(user).split(' ')[0]} !</span>
            <h1>Gestion des utilisateurs</h1>
            <p>Gérez les accès et les comptes de votre entreprise.</p>
            <span className="users-hero-accent"/>
          </div>
          <div className="users-hero-icon"><Users size={42}/></div>
        </section>

        {preview && <div className="users-preview-banner"><AlertTriangle size={16}/><span>Mode aperçu Frontend : les données affichées sont fictives. Aucune opération métier n'est envoyée au Backend.</span></div>}
        {error && <div className="users-alert error" role="alert"><AlertTriangle size={16}/><span>{error}</span><button type="button" onClick={() => { setError(''); refreshData(false); }}>Réessayer</button></div>}
        {notice && <div className="users-alert success" role="status"><Check size={16}/><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Fermer"><X size={15}/></button></div>}

        <section className="users-metrics-grid" aria-label="Statistiques utilisateurs">
          <MetricCard icon={Users} label="Demandes en attente" value={loading ? '—' : pendingCount} tone="red"/>
          <MetricCard icon={UserCheck} label="Employés actifs" value={loading ? '—' : activeEmployees} tone="dark"/>
          <MetricCard icon={ShieldCheck} label="Comptes actifs" value={loading ? '—' : activeAccounts} tone="red"/>
          <MetricCard icon={IdCard} label="Matricules générés" value={loading ? '—' : generatedMatricules} tone="dark"/>
        </section>

        <section className="users-panel">
          <header className="users-panel-header">
            <div className="users-section-title"><span className="users-section-icon red"><Clock3 size={20}/></span><div><h2>Demandes en attente</h2><p>Utilisateurs ayant demandé un compte sur la plateforme</p></div></div>
            <div className="users-toolbar">
              <label className="users-search"><Search size={17}/><input value={pendingSearch} onChange={(event) => setPendingSearch(event.target.value)} placeholder="Rechercher un candidat…" aria-label="Rechercher un candidat"/></label>
              <button type="button" className={`users-icon-button ${refreshing ? 'is-refreshing' : ''}`} onClick={() => refreshData(false)} disabled={refreshing || preview} aria-label="Actualiser les demandes"><RefreshCw size={17}/></button>
            </div>
          </header>

          {loading ? <div className="users-loading"><span/> Chargement des demandes…</div> : pendingPageItems.length === 0 ? (
            <EmptyState title="Aucune demande en attente" description={pendingSearch ? 'Aucun candidat ne correspond à cette recherche.' : 'Les nouvelles demandes apparaîtront ici.'}/>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table pending-table">
                <thead><tr><th>Nom complet</th><th>Email</th><th>Téléphone</th><th>Date de demande</th><th>Actions</th></tr></thead>
                <tbody>{pendingPageItems.map((person) => (
                  <tr key={person.id ?? person.requestId ?? person.email}>
                    <td><div className="users-person-cell"><Avatar person={person}/><strong>{fullName(person)}</strong></div></td>
                    <td>{person.email ?? '—'}</td>
                    <td>{person.phone ?? person.telephone ?? '—'}</td>
                    <td>{dateLabel(person.requestedAt ?? person.createdAt ?? person.created_at)}</td>
                    <td><div className="users-row-actions">
                      <button type="button" className="users-action view" onClick={() => setModal({ type: 'details', person, pending: true })}><Eye size={14}/>Voir</button>
                      <button type="button" className="users-action approve" onClick={() => openConfirm('approve', person)}><Check size={14}/>Valider</button>
                      <button type="button" className="users-action danger" onClick={() => openConfirm('reject', person)}><Trash2 size={14}/>Rejeter</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {!loading && <Pager page={pendingPage} total={pendingFiltered.length} onChange={setPendingPage}/>}
        </section>

        <section className="users-panel">
          <header className="users-panel-header employees-header">
            <div className="users-section-title"><span className="users-section-icon red"><Users size={20}/></span><div><h2>Employés actifs</h2><p>Liste de tous les employés de l'entreprise</p></div></div>
            <div className="users-toolbar employees-toolbar">
              <label className="users-search"><Search size={17}/><input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Rechercher un employé…" aria-label="Rechercher un employé"/></label>
              <select className="users-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filtrer par rôle">
                <option value="ALL">Tous les rôles</option><option value="MANAGER">Gestionnaire</option><option value="SELLER">Vendeur</option>
              </select>
              <select className="users-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrer par statut">
                <option value="ALL">Tous les statuts</option><option value="ACTIVE">Actif</option><option value="SUSPENDED">Suspendu</option>
              </select>
              <button type="button" className={`users-icon-button ${refreshing ? 'is-refreshing' : ''}`} onClick={() => refreshData(false)} disabled={refreshing || preview} aria-label="Actualiser les employés"><RefreshCw size={17}/></button>
              <button type="button" className="users-btn primary add-user-button" onClick={openCreate}><Plus size={16}/>Ajouter un employé</button>
            </div>
          </header>

          {loading ? <div className="users-loading"><span/> Chargement des employés…</div> : employeePageItems.length === 0 ? (
            <EmptyState title="Aucun employé trouvé" description={employeeSearch || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? 'Aucun employé ne correspond aux critères sélectionnés.' : 'Les employés enregistrés apparaîtront ici.'} action={<button type="button" className="users-btn primary" onClick={openCreate}><Plus size={15}/>Ajouter un employé</button>}/>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table employees-table">
                <thead><tr><th>Nom complet</th><th>Rôle</th><th>Matricule</th><th>Statut</th><th>Date d'affectation</th><th>Actions</th></tr></thead>
                <tbody>{employeePageItems.map((employee) => {
                  const suspended = statusValue(employee) === 'SUSPENDED';
                  return <tr key={employee.id ?? employee.userId ?? employee.email}>
                    <td><div className="users-person-cell"><Avatar person={employee}/><strong>{fullName(employee)}</strong></div></td>
                    <td><span className={`users-role-badge ${normalizeRole(employee) === 'MANAGER' ? 'manager' : 'seller'}`}>{roleLabel(employee.role)}</span></td>
                    <td><span className="users-matricule">{matriculeOf(employee)}</span></td>
                    <td><span className={`users-status-badge ${suspended ? 'suspended' : 'active'}`}>{suspended ? 'Suspendu' : 'Actif'}</span></td>
                    <td>{dateLabel(employee.assignedAt ?? employee.createdAt ?? employee.created_at)}</td>
                    <td><div className="users-row-actions">
                      <button type="button" className="users-action view" onClick={() => setModal({ type: 'details', person: employee, pending: false })}><Eye size={14}/>Voir</button>
                      <button type="button" className="users-action edit" onClick={() => openEdit(employee)}><Pencil size={14}/>Modifier</button>
                      <button type="button" className={`users-action ${suspended ? 'approve' : 'suspend'}`} onClick={() => openConfirm(suspended ? 'activate' : 'suspend', employee)}>{suspended ? <Check size={14}/> : <UserX size={14}/>} {suspended ? 'Réactiver' : 'Suspendre'}</button>
                      <button type="button" className="users-action danger" onClick={() => openConfirm('delete', employee)}><Trash2 size={14}/>Supprimer</button>
                    </div></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          )}
          {!loading && <Pager page={employeePage} total={employeesFiltered.length} onChange={setEmployeePage}/>}
        </section>

        {!preview && <div className="users-sync-note"><span className="sync-dot"/>{refreshing ? 'Synchronisation en cours…' : 'Synchronisation automatique toutes les 5 secondes'}</div>}
      </main>

      {modal?.type === 'details' && (
        <Modal title={modal.pending ? 'Détails de la demande' : 'Fiche employé'} description="Informations disponibles sur ce compte." onClose={() => setModal(null)} wide>
          <div className="users-detail-profile"><Avatar person={modal.person} large/><div><strong>{fullName(modal.person)}</strong><span>{modal.person.email ?? 'Email non renseigné'}</span></div></div>
          <div className="users-detail-grid">
            <DetailLine label="Prénom" value={modal.person.firstName ?? modal.person.first_name}/>
            <DetailLine label="Nom" value={modal.person.lastName ?? modal.person.last_name}/>
            <DetailLine label="Email" value={modal.person.email}/>
            <DetailLine label="Téléphone" value={modal.person.phone ?? modal.person.telephone}/>
            {!modal.pending && <DetailLine label="Rôle" value={roleLabel(modal.person.role)}/>}
            {!modal.pending && <DetailLine label="Matricule" value={matriculeOf(modal.person)} copy/>}
            {!modal.pending && <DetailLine label="Statut" value={statusValue(modal.person) === 'SUSPENDED' ? 'Suspendu' : 'Actif'}/>}
            <DetailLine label={modal.pending ? 'Date de demande' : "Date d'affectation"} value={dateLabel(modal.person.requestedAt ?? modal.person.assignedAt ?? modal.person.createdAt)}/>
            {!modal.pending && <DetailLine label="Dernière connexion" value={dateLabel(modal.person.lastLoginAt ?? modal.person.lastLogin)}/>}
          </div>
          <div className="users-modal-actions"><button type="button" className="users-btn secondary" onClick={() => setModal(null)}>Fermer</button></div>
        </Modal>
      )}

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <Modal title={modal.type === 'create' ? 'Ajouter un employé' : 'Modifier un employé'} description={modal.type === 'create' ? 'Renseignez les informations du nouveau collaborateur.' : 'Modifiez les coordonnées et le rôle de cet employé.'} onClose={() => setModal(null)}>
          <UserForm form={form} setForm={setForm} onSubmit={submitForm} onCancel={() => setModal(null)} busy={busy} editing={modal.type === 'edit'} preview={preview}/>
          {modal.type === 'edit' && <p className="users-form-footnote">Le matricule est géré par le Backend et ne peut pas être modifié.</p>}
        </Modal>
      )}

      {modal?.type === 'confirm' && (
        <Modal
          title={{ approve: 'Valider cette demande', reject: 'Rejeter cette demande', suspend: 'Suspendre ce compte', activate: 'Réactiver ce compte', delete: 'Supprimer ce compte' }[modal.action]}
          description="Veuillez vérifier cette opération avant de continuer."
          onClose={() => setModal(null)}>
          <div className="users-confirm-message">
            <span className={modal.action === 'delete' || modal.action === 'reject' ? 'danger' : ''}><AlertTriangle size={22}/></span>
            <p>{{
              approve: <>La demande de <strong>{fullName(modal.person)}</strong> sera validée. Choisissez le rôle à attribuer.</>,
              reject: <>La demande de <strong>{fullName(modal.person)}</strong> sera rejetée.</>,
              suspend: <>Le compte de <strong>{fullName(modal.person)}</strong> sera suspendu et ne pourra plus se connecter.</>,
              activate: <>Le compte de <strong>{fullName(modal.person)}</strong> sera réactivé.</>,
              delete: <>Le compte de <strong>{fullName(modal.person)}</strong> sera supprimé selon les règles de conservation du Backend.</>,
            }[modal.action]}</p>
          </div>
          {modal.action === 'approve' && <label className="users-modal-role">Rôle à attribuer<select value={modal.role ?? 'SELLER'} onChange={(event) => setModal((current) => ({ ...current, role: event.target.value }))}><option value="MANAGER">Gestionnaire</option><option value="SELLER">Vendeur</option></select></label>}
          {preview && <p className="users-preview-form-note">Mode aperçu : la confirmation ne déclenchera aucune opération métier réelle.</p>}
          <div className="users-modal-actions">
            <button type="button" className="users-btn secondary" onClick={() => setModal(null)}>Annuler</button>
            <button type="button" className={`users-btn ${modal.action === 'delete' || modal.action === 'reject' ? 'danger' : 'primary'}`} onClick={confirmModalAction} disabled={busy}>{busy ? 'Traitement…' : 'Confirmer'}</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

export default UsersPage;
