import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Brand from '../components/Brand';
import AuthFooter from '../components/AuthFooter';
import { isPasswordStrong } from '../utils/validators';
import { authService } from '../services/authService';
import '../styles/Register.css';

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    companyId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    communicationPreference: false,
    password: '',
    confirmPassword: '',
  });

  const updateForm = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const nextStep = (e) => {
    e.preventDefault();
    setError('');
    if (step === 1 && (!form.companyId.trim() || !form.firstName.trim() || !form.lastName.trim())) {
      setError('Veuillez renseigner les informations demandées.');
      return;
    }
    if (step === 2 && (!form.email.trim() || !form.phone.trim())) {
      setError('Veuillez renseigner une adresse e-mail et un numéro de téléphone.');
      return;
    }
    setStep((previous) => Math.min(previous + 1, 3));
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!isPasswordStrong(form.password)) {
      setError('Le mot de passe doit contenir 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.registerRequest({
        companyId: form.companyId.trim(), firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        email: form.email.trim(), phone: form.phone.trim(), password: form.password,
      });
      navigate('/registration-success');
    } catch (requestError) {
      setError(requestError.message || "Impossible d'envoyer votre demande pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">

      <Brand />

      <section className="auth-card register-card">

        <div className="auth-tabs">
          <Link to="/login">Connexion</Link>
          <span className="selected">Inscription</span>
        </div>

        <h2>Créer votre demande</h2>

        <p className="auth-description">
          Étape {step} sur 3
        </p>

        <div className="progress-track">
          <div
            className="progress-value"
            style={{ width: `${step * 33.333}%` }}
          />
        </div>

        {error && <p className="form-message" role="alert">{error}</p>}

        <form onSubmit={step === 3 ? submitForm : nextStep}>

          {step === 1 && (
            <>
              <div className="field">
                <label htmlFor="register-company">Identifiant d’entreprise</label>
                <input id="register-company" name="companyId" value={form.companyId} onChange={updateForm} placeholder="Ex. ROTL-001" required />
              </div>
              <div className="field">
                <label htmlFor="firstName">Prénom</label>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={updateForm}
                  placeholder="Votre prénom"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="lastName">Nom</label>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={updateForm}
                  placeholder="Votre nom"
                  required
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="field">
                <label htmlFor="register-email">Adresse e-mail</label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateForm}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="phone">Téléphone</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={updateForm}
                  placeholder="+243..."
                  required
                />
              </div>

              <label className="communication-check">
                <input
                  type="checkbox"
                  name="communicationPreference"
                  checked={form.communicationPreference}
                  onChange={updateForm}
                />
                Je souhaite recevoir les communications commerciales.
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <div className="field">
                <label htmlFor="register-password">Mot de passe</label>
                <div className="input-wrapper"><input id="register-password" type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateForm} placeholder="Créez un mot de passe robuste" required /><button type="button" className="icon-button" onClick={() => setShowPassword((shown) => !shown)} aria-label="Afficher ou masquer le mot de passe">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              </div>

              <div className="field">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={updateForm}
                  placeholder="Confirmez votre mot de passe"
                  required
                />
              </div>

              <div className="password-rules">
                <p>Exigences du mot de passe :</p>
                <span>• Au moins 8 caractères</span>
                <span>• Une majuscule et une minuscule</span>
                <span>• Un chiffre et un caractère spécial</span>
              </div>
            </>
          )}

          <div className="form-actions">

            {step > 1 && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setStep((previous) => previous - 1)}
              >
                RETOUR
              </button>
            )}

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {step === 3 ? (isSubmitting ? 'ENVOI…' : 'ENVOYER LA DEMANDE') : 'CONTINUER'}
            </button>

          </div>

        </form>

        <p className="auth-bottom">
          Vous avez déjà un compte ?
          <Link to="/login"> Se connecter</Link>
        </p>

      </section>

      <AuthFooter />

    </main>
  );
}

export default Register;
