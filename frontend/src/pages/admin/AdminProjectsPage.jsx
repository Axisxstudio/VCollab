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
      title="Project moderation"
      description="Review project visibility, deactivate problematic work, and move content into the recycle bin when needed."
      contentType="PROJECT"
      queryKeyPrefix={["admin", "projects"]}
      listFn={listAdminProjects}
      updateFn={updateAdminProjectModeration}
      deleteFn={deleteAdminProject}
      restoreFn={restoreAdminProject}
    />
  );
}
