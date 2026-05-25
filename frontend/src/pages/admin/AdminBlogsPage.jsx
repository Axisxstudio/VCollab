import AdminContentManager from "../../components/admin/AdminContentManager";
import {
  deleteAdminBlog,
  listAdminBlogs,
  restoreAdminBlog,
  updateAdminBlogModeration
} from "../../services/admin.service";

export default function AdminBlogsPage() {
  return (
    <AdminContentManager
      title="Blogs"
      contentType="BLOG"
      queryKeyPrefix={["admin", "blogs"]}
      listFn={listAdminBlogs}
      updateFn={updateAdminBlogModeration}
      deleteFn={deleteAdminBlog}
      restoreFn={restoreAdminBlog}
    />
  );
}
