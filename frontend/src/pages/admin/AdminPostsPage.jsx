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
      title="Posts"
      contentType="POST"
      queryKeyPrefix={["admin", "posts"]}
      listFn={listAdminPosts}
      updateFn={updateAdminPostModeration}
      deleteFn={deleteAdminPost}
      restoreFn={restoreAdminPost}
    />
  );
}
