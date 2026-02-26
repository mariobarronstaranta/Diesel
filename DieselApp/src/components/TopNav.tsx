import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import logo from "../assets/images/logo.png";

export default function TopNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="top-nav">
      <div className="top-nav__brand">
        <img
          src={logo}
          alt="DieselApp Logo"
          style={{ width: "55px", height: "43px", objectFit: "contain" }}
        />
        <span className="ms-2">DieselApp</span>
      </div>

      <button
        className={`top-nav__hamburger ${isMenuOpen ? "top-nav__hamburger--open" : ""}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation"
      >
        <span className="top-nav__hamburger-bar"></span>
        <span className="top-nav__hamburger-bar"></span>
        <span className="top-nav__hamburger-bar"></span>
      </button>

      <nav
        className={`top-nav__links ${isMenuOpen ? "top-nav__links--open" : ""}`}
        aria-label="Main"
      >
        <NavLink
          className={({ isActive }) =>
            `top-nav__link${isActive ? " top-nav__link--active" : ""}`
          }
          to="/"
          onClick={closeMenu}
        >
          Inicio
        </NavLink>

        <NavLink
          className={({ isActive }) =>
            `top-nav__link${isActive ? " top-nav__link--active" : ""}`
          }
          to="/captura"
          onClick={closeMenu}
        >
          Lecturas
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `top-nav__link${isActive ? " top-nav__link--active" : ""}`
          }
          to="/entradas"
          onClick={closeMenu}
        >
          Entradas
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `top-nav__link${isActive ? " top-nav__link--active" : ""}`
          }
          to="/salidas"
          onClick={closeMenu}
        >
          Salidas
        </NavLink>
        <Dropdown>
          <Dropdown.Toggle
            className="top-nav__action"
            variant=""
            id="dropdown-reportes"
          >
            Reportes
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item as={NavLink} to="/dashboard" onClick={closeMenu}>
              📊 Dashboard
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              as={NavLink}
              to="/reportes/lecturas"
              onClick={closeMenu}
            >
              Lecturas
            </Dropdown.Item>
            <Dropdown.Item
              as={NavLink}
              to="/reportes/consumos"
              onClick={closeMenu}
            >
              Consumos
            </Dropdown.Item>
            <Dropdown.Item
              as={NavLink}
              to="/reportes/rendimiento"
              onClick={closeMenu}
            >
              Rendimiento
            </Dropdown.Item>
            <Dropdown.Item
              as={NavLink}
              to="/reportes/productividad"
              onClick={closeMenu}
            >
              Productividad
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </nav>

      {isMenuOpen && (
        <div className="top-nav__overlay" onClick={closeMenu}></div>
      )}
    </header>
  );
}
