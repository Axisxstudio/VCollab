import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Layout, 
  Save, 
  Tag, 
  Type,
  Target
} from "lucide-react";
import CategorySelect from "../../components/category/CategorySelect";
import MentionInput from "../../components/content/MentionInput";
import MediaUploadManager from "../../components/forms/MediaUploadManager";
import AudienceTargetingPanel from "../../components/content/AudienceTargetingPanel";
import { createPost, getPost, updatePost } from "../../services/post.service";
import { upsertContentTargeting } from "../../services/profile.service";
import { stripRichText } from "../../utils/richText";

const schema = z.object({
  content: z.string().refine((value) => stripRichText(value).length >= 3, {
    message: "Content is required."
  }),
  tags: z.string().optional(),
  postType: z.enum(["TEXT", "IMAGE", "VIDEO", "ANNOUNCEMENT"])
});

export default function PostFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [targeting, setTargeting] = useState({ targetType: "ALL" });

  const { data } = useQuery({
    queryKey: ["post", id],
    queryFn: () => (isEdit ? getPost(id) : null),
    enabled: isEdit
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      content: "",
      tags: "",
      postType: "TEXT"
    }
  });

  useEffect(() => {
    if (!isEdit || !data) {
      return;
    }

    setCategoryId(data.category?.id || null);
    setMediaItems(data.media || []);
    reset({
      content: data.content || "",
      tags: (data.tags || []).join(", "),
      postType: data.postType || "TEXT"
    });
  }, [data, isEdit, reset]);

  const [submissionError, setSubmissionError] = useState(null);

  const onSubmit = async (values) => {
    setSubmissionError(null);
    try {
      const payload = {
        content: values.content,
        categoryId: categoryId ? Number(categoryId) : null,
        tags: values.tags ? values.tags.split(",").map((item) => item.trim()).filter(Boolean) : [],
        postType: values.postType,
        media: mediaItems.map(item => ({
          url: item.url,
          mediaType: item.mediaType,
          sortOrder: item.sortOrder || 0
        })),
        visibility: "PUBLIC",
        active: true
      };

      let savedPost;
      if (isEdit) {
        savedPost = await updatePost(id, payload);
      } else {
        savedPost = await createPost(payload);
      }

      // Save audience targeting if not targeting all
      if (targeting.targetType !== "ALL" && savedPost?.id) {
        try {
          await upsertContentTargeting({
            contentId: savedPost.id,
            contentType: "POST",
            ...targeting
          });
        } catch (e) {
          console.warn("Targeting save failed (non-critical):", e);
        }
      }

      navigate("/posts");
    } catch (err) {
      console.error("Failed to save post:", err.response?.data || err);
      setSubmissionError(
        err.response?.data?.message || err.message || "An unexpected error occurred while sharing the post."
      );
    }
  };

  const onFormError = (errs) => {
    console.warn("Post form validation failed:", errs);
  };

  const content = watch("content");

  return (
    <div className="card">
      <div className="workspace-brand" style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0 }}>{isEdit ? "Refine Update" : "Share Update"}</h2>
        <p style={{ margin: 0, opacity: 0.7 }}>Share your latest news, ideas, or announcements with your followers.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onFormError)} className="form">
        {submissionError && (
          <div className="error-alert" style={{ 
            marginBottom: "24px", 
            padding: "16px", 
            background: "#fef2f2", 
            border: "1px solid #fee2e2", 
            borderRadius: "12px",
            color: "#dc2626",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <Layout size={18} />
            <span>{submissionError}</span>
          </div>
        )}
        <div className="form-section">
          <div className="form-section-title">
            <Layout size={18} /> Post Strategy
          </div>
          <label>
            Post Type
            <div className="input-icon-group">
              <Type size={18} />
              <select {...register("postType")}>
                <option value="TEXT">Text Update</option>
                <option value="IMAGE">Image Showcase</option>
                <option value="VIDEO">Video Feature</option>
                <option value="ANNOUNCEMENT">Official Announcement</option>
              </select>
            </div>
            {errors.postType && <span className="error">{errors.postType.message}</span>}
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <FileText size={18} /> Experience
          </div>
          <input type="hidden" {...register("content")} />
          <MentionInput
            placeholder="What's on your mind? Type @ to tag a user or audience"
            value={content}
            onChange={(nextValue) => setValue("content", nextValue, { shouldValidate: true })}
            minHeight="150px"
          />
          {errors.content && <span className="error">{errors.content.message}</span>}
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <Layers size={18} /> Classification
          </div>
          <div className="form-grid-2">
            <label>
              Category
              <CategorySelect type="POST" value={categoryId} onChange={setCategoryId} />
            </label>

            <label>
              Tags
              <div className="input-icon-group">
                <Tag size={18} />
                <input type="text" {...register("tags")} placeholder="news, update, idea..." />
              </div>
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <ImageIcon size={18} /> Gallery & Files
          </div>
          <MediaUploadManager
            label="Post Media"
            context="post"
            items={mediaItems}
            onChange={setMediaItems}
            multiple
            accept="image/*,video/*"
            buttonLabel="Add Media Files"
            helperText="Upload images or videos for an Instagram-style carousel."
            emptyLabel="No media added. Drag files here to share."
          />
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <Target size={18} /> Audience Targeting
          </div>
          <AudienceTargetingPanel
            value={targeting}
            onChange={setTargeting}
            compact
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
          <button type="button" className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sharing..." : <><Save size={18} /> {isEdit ? "Update Post" : "Share Post"}</>}
          </button>
        </div>
      </form>
    </div>
  );
}