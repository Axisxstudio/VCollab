import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { 
  FileEdit, 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Layout, 
  Save, 
  Tag,
  Target
} from "lucide-react";
import CategorySelect from "../../components/category/CategorySelect";
import RichTextEditor from "../../components/forms/RichTextEditor";
import MediaUploadManager from "../../components/forms/MediaUploadManager";
import AudienceTargetingPanel from "../../components/content/AudienceTargetingPanel";
import { createBlog, getBlog, updateBlog } from "../../services/blog.service";
import { upsertContentTargeting, getContentTargeting } from "../../services/profile.service";
import { stripRichText } from "../../utils/richText";

const schema = z.object({
  title: z.string().min(3, "Title is required."),
  content: z.string().refine((value) => stripRichText(value).length >= 10, {
    message: "Content should be at least 10 characters."
  }),
  tags: z.string().optional()
});

export default function BlogFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [coverImageItems, setCoverImageItems] = useState([]);
  const [targeting, setTargeting] = useState({ targetType: "ALL" });

  const { data } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => (isEdit ? getBlog(id) : null),
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
      title: "",
      content: "",
      tags: ""
    }
  });

  useEffect(() => {
    if (!isEdit || !data) {
      return;
    }

    setCategoryId(data.category?.id || null);
    setMediaItems(data.media || []);
    setCoverImageItems(
      data.coverImage
        ? [{ url: data.coverImage, mediaType: "IMAGE", fileName: "Blog cover", sortOrder: 0 }]
        : []
    );
    reset({
      title: data.title || "",
      content: data.content || "",
      tags: (data.tags || []).join(", ")
    });

    // Fetch targeting
    getContentTargeting(id, "BLOG").then(t => {
      if (t) setTargeting(t);
    }).catch(() => {});
  }, [data, id, isEdit, reset]);

  const [submissionError, setSubmissionError] = useState(null);

  const onSubmit = async (values) => {
    setSubmissionError(null);
    console.log("Submitting blog with values:", values);
    
    try {
      const payload = {
        title: values.title,
        content: values.content,
        categoryId: categoryId ? Number(categoryId) : null,
        tags: values.tags ? values.tags.split(",").map((item) => item.trim()).filter(Boolean) : [],
        coverImage: coverImageItems[0]?.url || "",
        media: mediaItems.map(item => ({
          url: item.url,
          mediaType: item.mediaType,
          sortOrder: item.sortOrder || 0
        })),
        visibility: "PUBLIC",
        active: true
      };

      console.log("Constructed payload:", payload);

      let savedBlog;
      if (isEdit) {
        savedBlog = await updateBlog(id, payload);
      } else {
        savedBlog = await createBlog(payload);
      }

      // Save audience targeting
      if (savedBlog?.id) {
        try {
          await upsertContentTargeting({
            contentId: savedBlog.id,
            contentType: "BLOG",
            ...targeting
          });
        } catch (e) {
          console.warn("Targeting save failed (non-critical):", e);
        }
      }

      navigate("/blogs");
    } catch (err) {
      console.error("Failed to save blog error context:", err.response?.data || err);
      setSubmissionError(
        err.response?.data?.message || err.message || "An unexpected error occurred while saving the blog."
      );
    }
  };

  const onFormError = (errs) => {
    console.warn("Form validation failed:", errs);
  };

  const content = watch("content");

  return (
    <div className="card">
      <div className="workspace-brand" style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0 }}>{isEdit ? "Refine Article" : "Draft New Article"}</h2>
        <p style={{ margin: 0, opacity: 0.7 }}>Share your insights, tutorials, or case studies with the community.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onFormError)} className="form">
        <div className="form-section">
          <div className="form-section-title">
            <Layout size={18} /> Essentials
          </div>
          <label>
            Title
            <div className="input-icon-group">
              <FileEdit size={18} />
              <input type="text" {...register("title")} placeholder="Enter a compelling title..." />
            </div>
            {errors.title && <span className="error">{errors.title.message}</span>}
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <FileText size={18} /> Content Body
          </div>
          <input type="hidden" {...register("content")} />
          <RichTextEditor
            label="Write your story"
            value={content}
            onChange={(nextValue) => setValue("content", nextValue, { shouldValidate: true })}
            helperText="Use the live preview on the right to see how your article looks as you type."
            placeholder="Tell your story here..."
            minHeight={350}
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
              <CategorySelect type="BLOG" value={categoryId} onChange={setCategoryId} />
            </label>

            <label>
              Tags (comma separated)
              <div className="input-icon-group">
                <Tag size={18} />
                <input type="text" {...register("tags")} placeholder="tech, software, life..." />
              </div>
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <ImageIcon size={18} /> Visual Media
          </div>
          <MediaUploadManager
            label="Article Cover"
            context="blog"
            items={coverImageItems}
            onChange={setCoverImageItems}
            multiple={false}
            accept="image/*"
            buttonLabel="Select Cover"
            helperText="The main image for your blog card and header. High resolution recommended."
            emptyLabel="No cover image select. Drag a file here."
          />

          <div style={{ marginTop: "20px" }}>
            <MediaUploadManager
              label="Article Gallery"
              context="blog"
              items={mediaItems}
              onChange={setMediaItems}
              multiple
              accept="image/*,video/*"
              buttonLabel="Add Media"
              helperText="Additional screenshots or videos to support your article."
            emptyLabel="Your article gallery is empty. Drag files to add."
            />
          </div>
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

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
          <button type="button" className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Publishing..." : <><Save size={18} /> {isEdit ? "Update Article" : "Publish Article"}</>}
          </button>
        </div>
      </form>
    </div>
  );
}