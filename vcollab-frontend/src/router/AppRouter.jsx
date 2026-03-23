import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import ViewerLayout from "../layouts/ViewerLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import LandingPage from "../pages/public/LandingPage";
import AboutPage from "../pages/public/AboutPage";
import PrivacyPolicyPage from "../pages/public/PrivacyPolicyPage";
import TermsOfServicePage from "../pages/public/TermsOfServicePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import HomePage from "../pages/home/HomePage";
import SearchPage from "../pages/search/SearchPage";
import SettingsPage from "../pages/settings/SettingsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import EditProfilePage from "../pages/profile/EditProfilePage";
import ProjectListPage from "../pages/projects/ProjectListPage";
import ProjectDetailPage from "../pages/projects/ProjectDetailPage";
import ProjectFormPage from "../pages/projects/ProjectFormPage";
import PostListPage from "../pages/posts/PostListPage";
import PostDetailPage from "../pages/posts/PostDetailPage";
import PostFormPage from "../pages/posts/PostFormPage";
import BlogListPage from "../pages/blogs/BlogListPage";
import BlogDetailPage from "../pages/blogs/BlogDetailPage";
import BlogFormPage from "../pages/blogs/BlogFormPage";
import ProjectRequestsPage from "../pages/requests/ProjectRequestsPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import MessagesPage from "../pages/messages/MessagesPage";
import WarningsPage from "../pages/warnings/WarningsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminProjectsPage from "../pages/admin/AdminProjectsPage";
import AdminPostsPage from "../pages/admin/AdminPostsPage";
import AdminBlogsPage from "../pages/admin/AdminBlogsPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";
import AdminWarningsPage from "../pages/admin/AdminWarningsPage";
import AdminCmsBlocksPage from "../pages/admin/AdminCmsBlocksPage";
import AdminCategoriesPage from "../pages/admin/AdminCategoriesPage";
import AdminRecycleBinPage from "../pages/admin/AdminRecycleBinPage";
import AdminAuditLogsPage from "../pages/admin/AdminAuditLogsPage";
import AdminExportCenterPage from "../pages/admin/AdminExportCenterPage";
import { routes } from "../config/routes";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={routes.landing} element={<LandingPage />} />
        <Route path={routes.about} element={<AboutPage />} />
        <Route path={routes.privacy} element={<PrivacyPolicyPage />} />
        <Route path={routes.terms} element={<TermsOfServicePage />} />
      </Route>

      <Route element={<ViewerLayout />}>
        <Route path={routes.projects} element={<ProjectListPage />} />
        <Route path={routes.posts} element={<PostListPage />} />
        <Route path={routes.blogs} element={<BlogListPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.register} element={<RegisterPage />} />
        <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ViewerLayout />}>
        <Route path={routes.projectDetail} element={<ProjectDetailPage />} />
        <Route path={routes.postDetail} element={<PostDetailPage />} />
        <Route path={routes.blogDetail} element={<BlogDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={routes.home} element={<HomePage />} />
          <Route path={routes.search} element={<SearchPage />} />
          <Route path={routes.profile} element={<ProfilePage />} />
          <Route path={routes.profileEdit} element={<EditProfilePage />} />
          <Route path={routes.projectCreate} element={<ProjectFormPage />} />
          <Route path={routes.projectEdit} element={<ProjectFormPage />} />
          <Route path={routes.postCreate} element={<PostFormPage />} />
          <Route path={routes.postEdit} element={<PostFormPage />} />
          <Route path={routes.blogCreate} element={<BlogFormPage />} />
          <Route path={routes.blogEdit} element={<BlogFormPage />} />
          <Route path={routes.requests} element={<ProjectRequestsPage />} />
          <Route path={routes.notifications} element={<NotificationsPage />} />
          <Route path={routes.messages} element={<MessagesPage />} />
          <Route path={routes.warnings} element={<WarningsPage />} />
          <Route path={routes.settings} element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path={routes.adminDashboard} element={<AdminDashboardPage />} />
          <Route path={routes.adminUsers} element={<AdminUsersPage />} />
          <Route path={routes.adminProjects} element={<AdminProjectsPage />} />
          <Route path={routes.adminPosts} element={<AdminPostsPage />} />
          <Route path={routes.adminBlogs} element={<AdminBlogsPage />} />
          <Route path={routes.adminReports} element={<AdminReportsPage />} />
          <Route path={routes.adminWarnings} element={<AdminWarningsPage />} />
          <Route path={routes.adminCmsBlocks} element={<AdminCmsBlocksPage />} />
          <Route path={routes.adminCategories} element={<AdminCategoriesPage />} />
          <Route path={routes.adminRecycleBin} element={<AdminRecycleBinPage />} />
          <Route path={routes.adminAuditLogs} element={<AdminAuditLogsPage />} />
          <Route path={routes.adminExports} element={<AdminExportCenterPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={routes.landing} replace />} />
    </Routes>
  );
}
