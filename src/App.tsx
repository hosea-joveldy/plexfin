import { Route, Routes } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import SearchResultsPage from "@/pages/SearchResultsPage";
import RatingsFilter from "@/pages/RatingsFilter";
import Settings from "@/pages/Settings";
import ContentDetailPage from "@/pages/ContentDetailPage";
import MyListPage from "@/pages/MyListPage";
import AccountPage from "@/pages/AccountPage";
import AdminPage from "@/pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/ratings" element={<RatingsFilter />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/content/:id" element={<ContentDetailPage />} />
        <Route path="/my-list" element={<MyListPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}