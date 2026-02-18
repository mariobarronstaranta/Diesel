import { NavLink } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import logo from "../assets/images/logo.png";

export default function TopNav() {
  return (
    <header className="top-nav">
      <div className="top-nav__brand">
        <img
          src={logo}
          alt="DieselApp Logo"
          style={{ width: '55px', height: '43px', objectFit: 'contain' }}
        />
        <span className="ms-2">DieselApp</span>
      </div>
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
        <NavLink
          className={({ isActive }) =>
            `top-nav__link${isActive ? " top-nav__link--active" : ""}`
          }
          to="/salidas"
        >
          Salidas
        </NavLink>
        <Dropdown>
          <Dropdown.Toggle className="top-nav__action" variant="" id="dropdown-reportes">
            Reportes
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item as={NavLink} to="/reportes/lecturas">Lecturas</Dropdown.Item>
            <Dropdown.Item as={NavLink} to="/reportes/consumos">Consumos</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </nav>
    </header>
  );
}
