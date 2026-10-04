import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OpportunityDetail from "./pages/OpportunityDetail/OpportunityDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
      </Routes>
    </BrowserRouter>
  );
}