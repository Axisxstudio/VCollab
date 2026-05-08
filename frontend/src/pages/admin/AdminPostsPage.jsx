import AdminContentManager from "../../components/admin/AdminContentManager";
import {
  deleteAdminPost,
  listAdminPosts,
  restoreAdminPost,
  updateAdminPostModeration
} from "../../services/admin.service";

export default function AdminPostsPage() {
  return (
    <AdminContentManager
      title="Post moderation"
      description="Control feed visibility, deactivate disruptive updates, and send non-compliant posts into the recycle bin."
      contentType="POST"
      queryKeyPrefix={["admin", "posts"]}
      listFn={listAdminPosts}
      updateFn={updateAdminPostModeration}
      deleteFn={deleteAdminPost}
      restoreFn={restoreAdminPost}
    />
  );
}
