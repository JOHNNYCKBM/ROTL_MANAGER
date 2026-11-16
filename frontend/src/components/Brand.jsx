import { Link } from 'react-router-dom';

function Brand() {
  return (
    <Link to="/login" className="brand">
      <h1>ROTL</h1>
      <p>INNOVATING TODAY,<br />BUILDING TOMORROW.</p>
      <span />
    </Link>
  );
}

export default Brand;