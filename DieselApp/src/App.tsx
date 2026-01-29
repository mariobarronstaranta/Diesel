import "./App.css";
import CapturaLecturas from "./components/CapturaLecturas";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/captura" element={<CapturaLecturas />} />
      </Routes>
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
