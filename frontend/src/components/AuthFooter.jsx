import { Building2, Sprout, Truck, Cog, MoreHorizontal } from 'lucide-react';

const sectors = [
  [Sprout, 'Agriculture', 'Nourrir le futur'],
  [Truck, 'Logistique', 'Relier les acteurs'],
  [Building2, 'Immobilier', 'Créer de la valeur'],
  [Cog, 'Pièces auto', 'Solutions fiables'],
  [MoreHorizontal, 'Et plus', 'De nombreux métiers'],
];

function AuthFooter() {
  return (
    <footer className="auth-footer">
      {sectors.map(([Icon, title, description]) => (
        <div className="sector" key={title}>
          <Icon aria-hidden="true" size={21} />
          <span><strong>{title}</strong><small>{description}</small></span>
        </div>
      ))}
    </footer>
  );
}

export default AuthFooter;
