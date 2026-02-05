import { NavLink } from "react-router-dom";

export default function TopNav() {
  return (
    <header className="top-nav">
      <div className="top-nav__brand">DieselApp</div>
      <nav className="top-nav__links" aria-label="Main">
        <NavLink
          className={({ isActive }) =>
            `top-nav__link${isActive ? " top-nav__link--active" : ""}`
          }
          to="/"
        >
          Inicio
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `top-nav__link${isActive ? " top-nav__link--active" : ""}`
          }
          to="/captura"
        >
          Lecturas
        </NavLink>
        <button className="top-nav__action top-nav__action--ghost" type="button">
          Entradas
        </button>
        <button className="top-nav__action top-nav__action--ghost" type="button">
          Salidas
        </button>
        <button className="top-nav__action" type="button">
          Reportes
        </button>
      </nav>
    </header>
  );
}
