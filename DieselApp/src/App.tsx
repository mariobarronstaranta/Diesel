import "./App.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Login from "./auth/Login";
import CapturaLecturas from "./components/CapturaLecturas";
import ReporteLecturas from "./components/ReporteLecturas";
import ReporteConsumos from "./components/ReporteConsumos";
import ReporteRendimientos from "./components/ReporteRendimientos";
import EntradasDiesel from "./components/EntradasDiesel";
import SalidasDiesel from "./components/SalidasDiesel";
import TopNav from "./components/TopNav";

function AppLayout() {
  const location = useLocation();
  const showNav = location.pathname !== "/";

  return (
    <div className="app-shell">
      {showNav && <TopNav />}
      <main className={`app-content${showNav ? "" : " app-content--full"}`}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/captura" element={<CapturaLecturas />} />
          <Route path="/entradas" element={<EntradasDiesel />} />
          <Route path="/salidas" element={<SalidasDiesel />} />
          <Route path="/reportes/lecturas" element={<ReporteLecturas />} />
          <Route path="/reportes/consumos" element={<ReporteConsumos />} />
          <Route
            path="/reportes/rendimiento"
            element={<ReporteRendimientos />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/dieselapp">
      <AppLayout />
    </BrowserRouter>
  );
}

//function App() {
//  return (
//    <>
//      <CapturaLecturas />;
//    </>
//  );
//}

//export default App;
