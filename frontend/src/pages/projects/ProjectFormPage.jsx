import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { 
  AlignLeft, 
  Cpu, 
  ExternalLink, 
  FileText, 
  Github, 
  Layers, 
  Layout, 
  PlusCircle, 
  Save, 
  Tag,
  Target,
  Youtube,
  BookOpen
} from "lucide-react";
import CategorySelect from "../../components/category/CategorySelect";
import RichTextEditor from "../../components/forms/RichTextEditor";
import MediaUploadManager from "../../components/forms/MediaUploadManager";
import AudienceTargetingPanel from "../../components/content/AudienceTargetingPanel";
import { createProject, getProject, updateProject } from "../../services/project.service";
import { upsertContentTargeting, getContentTargeting } from "../../services/profile.service";

const schema = z.object({
  title: z.string().min(3, "Title is required."),
  shortDesc: z.string().optional(),
  fullDesc: z.string().optional(),
  tags: z.string().optional(),
  techStack: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  demoUrl: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  pdfUrl: z.string().optional().or(z.literal("")),
  courseUrl: z.string().url().optional().or(z.literal(""))
});

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [thumbnailItems, setThumbnailItems] = useState([]);
  const [pdfItems, setPdfItems] = useState([]);
  const [targeting, setTargeting] = useState({ targetType: "ALL" });

  const { data } = useQuery({
    queryKey: ["project", id],
    queryFn: () => (isEdit ? getProject(id) : null),
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
      shortDesc: "",
      fullDesc: "",
      tags: "",
      techStack: "",
      githubUrl: "",
      demoUrl: "",
      youtubeUrl: "",
      pdfUrl: "",
      courseUrl: ""
    }
  });

  useEffect(() => {
    if (!isEdit || !data) {
      return;
    }

    setCategoryId(data.category?.id || null);
    setMediaItems(data.media || []);
    setThumbnailItems(
      data.thumbnail
        ? [{ url: data.thumbnail, mediaType: "IMAGE", fileName: "Project cover", sortOrder: 0 }]
        : []
    );
    setPdfItems(
      data.pdfUrl
        ? [{ url: data.pdfUrl, mediaType: "DOCUMENT", fileName: "Project resource", sortOrder: 0 }]
        : []
    );
    reset({
      title: data.title || "",
      shortDesc: data.shortDesc || "",
      fullDesc: data.fullDesc || "",
      tags: (data.tags || []).join(", "),
      techStack: (data.techStack || []).join(", "),
      githubUrl: data.githubUrl || "",
      demoUrl: data.demoUrl || "",
      youtubeUrl: data.youtubeUrl || "",
      pdfUrl: data.pdfUrl || "",
      courseUrl: data.courseUrl || ""
    });

    // Fetch targeting
    getContentTargeting(id, "PROJECT").then(t => {
      if (t) setTargeting(t);
    }).catch(() => {});
  }, [data, id, isEdit, reset]);

  const [submissionError, setSubmissionError] = useState(null);

  const onSubmit = async (values) => {
    setSubmissionError(null);
    try {
      const payload = {
        ...values,
        categoryId: categoryId ? Number(categoryId) : null,
        tags: values.tags ? values.tags.split(",").map((item) => item.trim()).filter(Boolean) : [],
        techStack: values.techStack ? values.techStack.split(",").map((item) => item.trim()).filter(Boolean) : [],
        thumbnail: thumbnailItems[0]?.url || "",
        pdfUrl: pdfItems[0]?.url || "",
        media: mediaItems.map(item => ({
          url: item.url,
          mediaType: item.mediaType,
          sortOrder: item.sortOrder || 0
        })),
        visibility: "PUBLIC",
        active: true
      };

      let savedProject;
      if (isEdit) {
        savedProject = await updateProject(id, payload);
      } else {
        savedProject = await createProject(payload);
      }

      // Save audience targeting
      if (savedProject?.id) {
        try {
          await upsertContentTargeting({
            contentId: savedProject.id,
            contentType: "PROJECT",
            ...targeting
          });
        } catch (e) {
          console.warn("Targeting save failed (non-critical):", e);
        }
      }

      navigate("/projects");
    } catch (err) {
      console.error("Failed to save project:", err.response?.data || err);
      setSubmissionError(
        err.response?.data?.message || err.message || "An unexpected error occurred while saving the project."
      );
    }
  };

  const onFormError = (errs) => {
    console.warn("Project form validation failed:", errs);
  };

  const fullDesc = watch("fullDesc");
  const youtubeUrl = watch("youtubeUrl");

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYoutubeId(youtubeUrl);

  return (
    <div className="card">
      <div className="workspace-brand" style={{ 
        marginBottom: "32px", 
        borderLeft: "4px solid #22c55e",
        paddingLeft: "20px"
      }}>
        <h2 style={{ margin: 0, color: "#166534" }}>{isEdit ? "Refine Project Details" : "Create New Project"}</h2>
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
            <Layout size={18} /> Project Essence
          </div>
          
          <label>
            Title
            <div className="input-icon-group">
              <Layout size={18} />
              <input type="text" {...register("title")} placeholder="What's the name of your project?" />
            </div>
            {errors.title && <span className="error">{errors.title.message}</span>}
          </label>

          <label>
            Brief Hook (Short Preview)
            <div className="input-icon-group">
              <AlignLeft size={18} />
              <input type="text" {...register("shortDesc")} placeholder="One-line summary for discovery cards" />
            </div>
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <FileText size={18} /> Detailed Content
          </div>
          
          <input type="hidden" {...register("fullDesc")} />
          <RichTextEditor
            label="Full Project Story"
            value={fullDesc}
            onChange={(nextValue) => setValue("fullDesc", nextValue, { shouldValidate: true })}
            helperText="Draft a compelling story. Use headers, bold text, and lists to make it readable."
            placeholder="What problem does this solve? How did you build it? What's next?"
            minHeight={320}
          />
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <Layers size={18} /> Classification & Tools
          </div>
          
          <div className="form-grid-2">
            <label>
              Category
              <CategorySelect type="PROJECT" value={categoryId} onChange={setCategoryId} />
            </label>

            <label>
              Tags
              <div className="input-icon-group">
                <Tag size={18} />
                <input type="text" {...register("tags")} placeholder="ai, web, mobile, robotics..." />
              </div>
            </label>
          </div>

          <label>
            Technical Stack
            <div className="input-icon-group">
              <Cpu size={18} />
              <input type="text" {...register("techStack")} placeholder="React, Node.js, Python, PostgreSQL..." />
            </div>
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <ExternalLink size={18} /> Project Links & Resources
          </div>
          
          <div className="form-grid-2">
            <label>
              GitHub Repository
              <div className="input-icon-group">
                <Github size={18} />
                <input type="url" {...register("githubUrl")} placeholder="https://github.com/username/repo" />
              </div>
            </label>

            <label>
              Live Demo / Preview
              <div className="input-icon-group">
                <ExternalLink size={18} />
                <input type="url" {...register("demoUrl")} placeholder="https://project-demo.com" />
              </div>
            </label>
          </div>

          <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px" }}>
            <label>
              YouTube Video
              <div className="input-icon-group">
                <Youtube size={18} />
                <input type="url" {...register("youtubeUrl")} placeholder="https://youtube.com/watch?v=..." />
              </div>
              {youtubeId && (
                <div className="youtube-preview-box" style={{ 
                  marginTop: "12px", 
                  borderRadius: "12px", 
                  overflow: "hidden", 
                  background: "#000",
                  aspectRatio: "16/9",
                  position: "relative"
                }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </label>

            <label style={{ gridColumn: "span 2" }}>
              PDF Resource (Upload)
              <MediaUploadManager
                context="project"
                items={pdfItems}
                onChange={setPdfItems}
                multiple={false}
                accept=".pdf,application/pdf"
                buttonLabel="Upload PDF"
                compact
                emptyLabel="No PDF uploaded."
              />
            </label>

            <label>
              Course Material
              <div className="input-icon-group">
                <BookOpen size={18} />
                <input type="url" {...register("courseUrl")} placeholder="Course Link" />
              </div>
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <PlusCircle size={18} /> Media & Showcase
          </div>
          
          <MediaUploadManager
            label="Project Cover Image"
            context="project"
            items={thumbnailItems}
            onChange={setThumbnailItems}
            multiple={false}
            accept="image/*"
            buttonLabel="Select Banner"
            helperText="This image will be the face of your project. High-quality 16:9 recommended."
            emptyLabel="No banner selected."
          />

          <MediaUploadManager
            label="Screenshots & Demo Videos"
            context="project"
            items={mediaItems}
            onChange={setMediaItems}
            multiple
            accept="image/*,video/*"
            buttonLabel="Add Media Files"
            helperText="Add images or video links to show how your project works."
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

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
          <button type="button" className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Publishing..." : <><Save size={18} /> {isEdit ? "Update Project" : "Publish Project"}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
