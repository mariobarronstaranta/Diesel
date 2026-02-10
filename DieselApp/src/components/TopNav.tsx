import { NavLink } from "react-router-dom";
import { Dropdown } from "react-bootstrap";

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
        <NavLink
          className={({ isActive }) =>
            `top-nav__link${isActive ? " top-nav__link--active" : ""}`
          }
          to="/entradas"
        >
          Entradas
        </NavLink>
        <button className="top-nav__action top-nav__action--ghost" type="button">
          Salidas
        </button>
        <Dropdown>
          <Dropdown.Toggle className="top-nav__action" variant="" id="dropdown-reportes">
            Reportes
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item as={NavLink} to="/reportes/lecturas">Lecturas</Dropdown.Item>
            <Dropdown.Item href="#/consumos">Consumos</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </nav>
    </header>
  );
}
