import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3 } from 'lucide-react';
import Brand from '../components/Brand';
import AuthFooter from '../components/AuthFooter';
import '../styles/RegistrationSuccess.css';

function RegistrationSuccess() {
  return (
    <main className="auth-page">

      <Brand />

      <section className="auth-card success-card">

        <CheckCircle2 className="success-icon" size={65} />

        <h2>DEMANDE ENREGISTRÉE</h2>

        <p>
          Votre demande d’inscription a bien été envoyée.
        </p>

        <div className="pending-notice">
          <Clock3 size={23} />

          <div>
            <strong>En attente de validation administrative</strong>
            <p>
              Un administrateur autorisé doit examiner et approuver votre demande avant toute connexion.
            </p>
          </div>
        </div>

        <Link to="/login" className="primary-button success-link">
          RETOUR À LA CONNEXION
        </Link>

      </section>

      <AuthFooter />

    </main>
  );
}

export default RegistrationSuccess;
