import { useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Search,
  SlidersHorizontal,
  ArrowLeft,
  ChevronRight,
  Folder,
  FileText,
  Download,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import PublicFooter from "../../components/public/PublicFooter";
import SEO from "../../components/seo/SEO";
import {
  downloadPublicResourceFile,
  explorePublicResources,
  listResourceCategories,
  listResourceInstitutions,
  listResourceSemesters,
  listResourceYears,
  previewPublicResourceFile,
  searchPublicResources
} from "../../services/resource.service";
import { routes } from "../../config/routes";
import { formatDate } from "../../utils/discovery";
import "./resources.css";

function formatFileSize(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** power).toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
}

function ProfessionalFileCard({ file, onOpen, onDownload, busyId }) {
  return (
    <article className="professional-file-card reveal-up">
      <div className="file-card__icon">
        <FileText size={24} />
      </div>
      <div className="file-card__details">
        <strong>{file.displayName}</strong>
        <span>{file.categoryName || "General"} • {formatFileSize(file.fileSize)}</span>
      </div>
      <div className="file-card__actions">
        <button 
          onClick={() => onOpen(file.id)} 
          className="file-card__btn"
          disabled={busyId === file.id}
        >
          <ExternalLink size={16} />
        </button>
        <button 
          onClick={() => onDownload(file.id)} 
          className="file-card__btn file-card__btn--save"
          disabled={busyId === file.id}
        >
          <Download size={16} />
        </button>
      </div>
    </article>
  );
}

export default function ResourcesExplorerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get("folderId");
  const institutionId = searchParams.get("institutionId");
  const yearId = searchParams.get("yearId");

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      institution: searchParams.get("institution") || "",
      academicYear: searchParams.get("academicYear") || "",
      semester: searchParams.get("semester") || "",
      category: searchParams.get("category") || "",
      module: searchParams.get("module") || "",
      resourceType: searchParams.get("resourceType") || "",
      uploader: searchParams.get("uploader") || "",
      fileName: searchParams.get("fileName") || ""
    }),
    [searchParams]
  );

  const searchActive = Object.values(filters).some(Boolean);

  const explorerQuery = useQuery({
    queryKey: ["resources", "public", "explorer", folderId || "root"],
    queryFn: () => explorePublicResources(folderId ? Number(folderId) : undefined),
    staleTime: 15000
  });

  const institutionsQuery = useQuery({
    queryKey: ["resources", "institutions"],
    queryFn: listResourceInstitutions,
    staleTime: 60000
  });

  const categoriesQuery = useQuery({
    queryKey: ["resources", "categories"],
    queryFn: listResourceCategories,
    staleTime: 60000
  });

  const yearsQuery = useQuery({
    queryKey: ["resources", "years", institutionId],
    queryFn: () => listResourceYears(Number(institutionId)),
    enabled: Boolean(institutionId)
  });

  const semestersQuery = useQuery({
    queryKey: ["resources", "semesters", yearId],
    queryFn: () => listResourceSemesters(Number(yearId)),
    enabled: Boolean(yearId)
  });

  const searchQuery = useQuery({
    queryKey: ["resources", "search", filters],
    queryFn: () => searchPublicResources({ ...filters, page: 0, size: 18 }),
    enabled: searchActive
  });

  const previewMutation = useMutation({
    mutationFn: previewPublicResourceFile,
    onSuccess: (resource) => window.open(resource.publicUrl, "_blank", "noopener,noreferrer")
  });

  const downloadMutation = useMutation({
    mutationFn: downloadPublicResourceFile,
    onSuccess: (resource) => window.open(resource.publicUrl, "_blank", "noopener,noreferrer")
  });

  const handleFolderOpen = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("folderId", id);
    setSearchParams(next);
  };

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const handleInstitutionChange = (event) => {
    const value = event.target.value;
    const selected = (institutionsQuery.data || []).find((item) => String(item.id) === value);
    const next = new URLSearchParams(searchParams);
    if (!selected) {
      ["institutionId", "institution", "yearId", "academicYear", "semester"].forEach(k => next.delete(k));
    } else {
      next.set("institutionId", value);
      next.set("institution", selected.name);
      ["yearId", "academicYear", "semester"].forEach(k => next.delete(k));
    }
    setSearchParams(next);
  };

  const explorerData = explorerQuery.data;
  const busyFileId = previewMutation.variables || downloadMutation.variables;

  return (
    <div className="resources-shell resources-shell--explorer">
      <SEO title="Academic Explorer | VCollab" />

      <header className="explorer-header--premium">
        <div className="container header-content">
          <Link to={routes.resources} className="resources-back-link">
            <ArrowLeft size={18} />
            <span>Catalogue</span>
          </Link>
          <div className="breadcrumb-trail">
            <button onClick={() => setParam("folderId", "")}>Root</button>
            {(explorerData?.breadcrumb || []).map((item) => (
              <div key={item.id} className="crumb-item">
                <ChevronRight size={14} />
                <button onClick={() => handleFolderOpen(item.id)}>{item.label}</button>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="container explorer-main">
        <div className="explorer-controls">
          <div className="search-pill">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search in this branch..." 
              value={filters.search}
              onChange={(e) => setParam("search", e.target.value)}
            />
          </div>
          
          <div className="filter-selects">
            <select value={institutionId || ""} onChange={handleInstitutionChange}>
              <option value="">Institution</option>
              {(institutionsQuery.data || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <select value={filters.category} onChange={(e) => setParam("category", e.target.value)}>
              <option value="">Category</option>
              {(categoriesQuery.data || []).map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        <section className="explorer-content-grid">
          {(explorerData?.folders || []).map((folder) => (
            <button
              key={folder.id}
              className="professional-folder-card reveal-up"
              onClick={() => handleFolderOpen(folder.id)}
            >
              <div className="folder-card__icon">
                <Folder size={24} />
              </div>
              <div className="folder-card__copy">
                <h3>{folder.name}</h3>
                <span>{folder.resourceCount} items • {folder.childFolderCount || 0} subfolders</span>
              </div>
              <ChevronRight size={18} className="arrow" />
            </button>
          ))}
        </section>

        {explorerData?.files?.length > 0 && (
          <section className="explorer-files-section">
            <div className="section-title">
              <FileText size={18} />
              <h2>Shared Documents</h2>
            </div>
            <div className="files-grid">
              {explorerData.files.map((file) => (
                <ProfessionalFileCard
                  key={file.id}
                  file={file}
                  onOpen={(id) => previewMutation.mutate(id)}
                  onDownload={(id) => downloadMutation.mutate(id)}
                  busyId={busyFileId}
                />
              ))}
            </div>
          </section>
        )}

        {!explorerQuery.isLoading && (explorerData?.folders?.length || 0) === 0 && (explorerData?.files?.length || 0) === 0 && (
          <div className="explorer-empty reveal-up">
            <Library size={48} />
            <h3>No results found</h3>
            <p>This directory is currently waiting for contributions.</p>
            <button onClick={() => navigate(routes.resources)} className="resources-btn--ghost">
              Back to safe grounds
            </button>
          </div>
        )}
      </main>

      <footer className="explorer-footer">
        <div className="container">
          <p>Academic Explorer • VCollab 2.0</p>
        </div>
      </footer>
    </div>
  );
}
