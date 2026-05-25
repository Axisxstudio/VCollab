import AdminContentManager from "../../components/admin/AdminContentManager";
import {
  deleteAdminProject,
  listAdminProjects,
  restoreAdminProject,
  updateAdminProjectModeration
} from "../../services/admin.service";

export default function AdminProjectsPage() {
  return (
    <AdminContentManager
      title="Projects"
      contentType="PROJECT"
      queryKeyPrefix={["admin", "projects"]}
      listFn={listAdminProjects}
      updateFn={updateAdminProjectModeration}
      deleteFn={deleteAdminProject}
      restoreFn={restoreAdminProject}
    />
  );
}
