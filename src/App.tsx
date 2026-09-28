import { Route, Routes } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import SearchResultsPage from "@/pages/SearchResultsPage";
import RatingsFilter from "@/pages/RatingsFilter";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/ratings" element={<RatingsFilter />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}