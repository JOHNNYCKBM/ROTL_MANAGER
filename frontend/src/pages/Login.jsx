import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, Building2 } from 'lucide-react';
import Brand from '../components/Brand';
import AuthFooter from '../components/AuthFooter';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import '../styles/Login.css';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    companyId: '',
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await authService.login({
        companyId: form.companyId.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      const token = response?.accessToken ?? response?.token;
      if (!token) throw new ApiError("La réponse du serveur ne contient pas de jeton d'accès.", 0);
      const storage = form.rememberMe ? localStorage : sessionStorage;
      storage.setItem('rotl_access_token', token);
      setError('Connexion réussie. La redirection vers votre espace sera ajoutée avec le module métier.');
    } catch (requestError) {
      if (requestError.status === 401) setError('Identifiants incorrects. Vérifiez votre identifiant d’entreprise, votre e-mail et votre mot de passe.');
      else if (requestError.status === 403) setError('Ce compte est en attente de validation, refusé ou suspendu. Contactez votre administrateur.');
      else setError(requestError.message || 'Impossible de vous connecter pour le moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">

      <Brand />

      <section className="auth-card">

        <div className="auth-tabs">
          <span className="selected">Connexion</span>
          <Link to="/register">Inscription</Link>
        </div>

        <h2>Welcome back!</h2>
        <p className="auth-description">
          Connectez-vous à votre espace professionnel.
        </p>

        {error && <p className="form-message" role="alert">{error}</p>}

        <form onSubmit={handleSubmit}>

          <div className="field">
            <label htmlFor="companyId">Identifiant d’entreprise</label>
            <div className="input-wrapper">
              <Building2 size={18} />
              <input
                name="companyId"
                id="companyId"
                value={form.companyId}
                onChange={handleChange}
                placeholder="Enter company ID"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Adresse e-mail</label>
            <div className="input-wrapper">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                id="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-wrapper">
              <LockKeyhole size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />

              <button
                type="button"
                className="icon-button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Afficher ou masquer le mot de passe"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label>
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
              />
              Se souvenir de moi
            </label>

            <button type="button" className="text-button">
              Mot de passe oublié ?
            </button>
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'CONNEXION…' : 'SE CONNECTER'}
          </button>

        </form>

        <p className="auth-bottom">
          Pas encore de compte ?
          <Link to="/register"> Créer une demande</Link>
        </p>

      </section>

      <AuthFooter />

    </main>
  );
}

export default Login;
