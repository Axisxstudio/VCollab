import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  FolderOpen,
  FolderPlus,
  FolderTree,
  Globe,
  GraduationCap,
  HardDrive,
  LibraryBig,
  MoveRight,
  PlusSquare,
  Save,
  Search,
  Trash2,
  Upload,
  Wand2,
  X,
  LayoutGrid,
} from "lucide-react";
import SEO from "../../components/seo/SEO";
import {
  createResourceFolder,
  deleteResourceFile,
  deleteResourceFolder,
  ensureResourcePath,
  getMyResourceDashboard,
  getMyResourceExplorer,
  listResourceCategories,
  listResourceInstitutions,
  listResourceSemesters,
  listResourceYears,
  replaceResourceFile,
  updateResourceFile,
  uploadResourceFiles,
} from "../../services/resource.service";
import { useAuthStore } from "../../store/authStore";
import "./resources.css";

const WIZARD_STEPS = [
  { id: "institution", label: "University", description: "Pick the institution.", icon: GraduationCap },
  { id: "schedule", label: "Year & Semester", description: "Choose the semester shelf.", icon: CalendarDays },
  { id: "module", label: "Module", description: "Name the subject folder.", icon: BookOpen },
  { id: "type", label: "Resource Type", description: "Select notes, past papers, or slides.", icon: FolderOpen },
  { id: "upload", label: "Upload", description: "Rename files and publish.", icon: Upload },
];

function formatFileSize(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** power).toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
}

function normalizeText(value) {
  return value?.trim().toLowerCase() || "";
}

function FileDraftRow({ item, onRename, onRemove }) {
  return (
    <div className="rm2-draft-row">
      <div className="rm2-draft-icon">
        <FileText size={16} />
      </div>
      <div className="rm2-draft-meta">
        <strong>{item.file.name}</strong>
        <span>{formatFileSize(item.file.size)}</span>
      </div>
      <input
        className="rm2-draft-input"
        value={item.displayName}
        onChange={(e) => onRename(item.id, e.target.value)}
        placeholder="Rename before upload"
      />
      <button type="button" className="rm2-ghost-btn" onClick={() => onRemove(item.id)}>
        Remove
      </button>
    </div>
  );
}

export default function ResourceManagePage() {
  const queryClient = useQueryClient();
  const replaceInputRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get("folderId");

  const [activeStep, setActiveStep] = useState(0);
  const [activeContainer, setActiveContainer] = useState(() => (folderId ? "explorer" : "dashboard"));
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [destinationMode, setDestinationMode] = useState("guided");
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [driveSearch, setDriveSearch] = useState("");
  const [structureForm, setStructureForm] = useState({
    institutionId: "",
    yearId: "",
    semesterId: "",
    moduleName: "",
    categoryId: "",
    visibility: "PUBLIC",
  });
  const [folderForm, setFolderForm] = useState({ name: "", folderType: "CUSTOM" });
  const [draftFiles, setDraftFiles] = useState([]);
  const [fileEdits, setFileEdits] = useState({});
  const [replaceTarget, setReplaceTarget] = useState(null);

  const dashboardQuery = useQuery({ queryKey: ["resources", "mine", "dashboard"], queryFn: getMyResourceDashboard });
  const explorerQuery = useQuery({
    queryKey: ["resources", "mine", "explorer", folderId || "root"],
    queryFn: () => getMyResourceExplorer(folderId ? Number(folderId) : undefined),
  });
  const institutionsQuery = useQuery({ queryKey: ["resources", "institutions"], queryFn: listResourceInstitutions, staleTime: 60000 });
  const categoriesQuery = useQuery({ queryKey: ["resources", "categories"], queryFn: listResourceCategories, staleTime: 60000 });
  const yearsQuery = useQuery({
    queryKey: ["resources", "years", structureForm.institutionId],
    queryFn: () => listResourceYears(Number(structureForm.institutionId)),
    enabled: Boolean(structureForm.institutionId),
  });
  const semestersQuery = useQuery({
    queryKey: ["resources", "semesters", structureForm.yearId],
    queryFn: () => listResourceSemesters(Number(structureForm.yearId)),
    enabled: Boolean(structureForm.yearId),
  });

  const commonInvalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["resources", "mine"] });
    await queryClient.invalidateQueries({ queryKey: ["resources", "public"] });
  };

  const ensurePathMutation = useMutation({
    mutationFn: ensureResourcePath,
    onSuccess: async (folder) => {
      const next = new URLSearchParams(searchParams);
      next.set("folderId", String(folder.id));
      setSearchParams(next);
      setActiveContainer("explorer");
      toast.success("Academic destination is ready.");
      await commonInvalidate();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to prepare the destination."),
  });

  const createFolderMutation = useMutation({
    mutationFn: createResourceFolder,
    onSuccess: async () => { setFolderForm({ name: "", folderType: "CUSTOM" }); toast.success("Folder created."); await commonInvalidate(); },
    onError: (error) => toast.error(error?.response?.data?.message || "Could not create the folder."),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ payload, files }) => uploadResourceFiles(payload, files),
    onSuccess: async () => { setDraftFiles([]); toast.success("Resources uploaded successfully."); await commonInvalidate(); },
    onError: (error) => toast.error(error?.response?.data?.message || "Upload failed."),
  });

  const updateFileMutation = useMutation({
    mutationFn: ({ id, payload }) => updateResourceFile(id, payload),
    onSuccess: async () => { toast.success("Resource updated."); await commonInvalidate(); },
    onError: (error) => toast.error(error?.response?.data?.message || "Could not update the resource."),
  });

  const deleteFileMutation = useMutation({
    mutationFn: deleteResourceFile,
    onSuccess: async () => { toast.success("Resource deleted."); await commonInvalidate(); },
    onError: (error) => toast.error(error?.response?.data?.message || "Could not delete the resource."),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteResourceFolder,
    onSuccess: async () => {
      const next = new URLSearchParams(searchParams);
      next.delete("folderId");
      setSearchParams(next);
      toast.success("Folder deleted.");
      await commonInvalidate();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Could not delete the folder."),
  });

  const replaceFileMutation = useMutation({
    mutationFn: ({ id, payload, file }) => replaceResourceFile(id, payload, file),
    onSuccess: async () => { setReplaceTarget(null); toast.success("Resource file replaced."); await commonInvalidate(); },
    onError: (error) => toast.error(error?.response?.data?.message || "Could not replace the file."),
  });

  const libraries = dashboardQuery.data?.libraries || [];
  const workspaceStats = dashboardQuery.data || { totalResources: 0, publicResources: 0, storageUsed: 0 };
  const currentFolder = explorerQuery.data?.currentFolder || null;
  const allInstitutions = institutionsQuery.data || [];
  const allCategories = categoriesQuery.data || [];
  const contributorLabel = user?.fullName || user?.username || "Your folder";

  const institutionOptions = useMemo(() =>
    [...allInstitutions]
      .sort((a, b) => (a.name === "SLIIT" ? -1 : b.name === "SLIIT" ? 1 : 0))
      .filter((item) => !institutionSearch.trim() || normalizeText(item.name).includes(normalizeText(institutionSearch))),
    [allInstitutions, institutionSearch]
  );

  const moveOptions = useMemo(() => {
    const options = new Map();
    libraries.forEach((item) => options.set(String(item.folderId), `${item.institutionName} / ${item.academicYearLabel} / ${item.semesterLabel}`));
    (explorerQuery.data?.folders || []).forEach((item) => options.set(String(item.id), item.name));
    if (currentFolder?.id) options.set(String(currentFolder.id), currentFolder.name);
    return Array.from(options.entries()).map(([id, label]) => ({ id, label }));
  }, [libraries, explorerQuery.data?.folders, currentFolder]);

  const visibleFolders = useMemo(() => {
    const query = normalizeText(driveSearch);
    return (explorerQuery.data?.folders || []).filter((item) => !query || normalizeText(item.name).includes(query));
  }, [driveSearch, explorerQuery.data?.folders]);

  const visibleFiles = useMemo(() => {
    const query = normalizeText(driveSearch);
    return (explorerQuery.data?.files || []).filter((item) => !query || normalizeText(item.displayName).includes(query));
  }, [driveSearch, explorerQuery.data?.files]);

  const selectedInstitution = allInstitutions.find((item) => String(item.id) === structureForm.institutionId);
  const selectedYear = (yearsQuery.data || []).find((item) => String(item.id) === structureForm.yearId);
  const selectedSemester = (semestersQuery.data || []).find((item) => String(item.id) === structureForm.semesterId);
  const selectedCategory = allCategories.find((item) => String(item.id) === structureForm.categoryId);

  const guidedPath = [selectedInstitution?.name, selectedYear?.name, selectedSemester?.name, contributorLabel, structureForm.moduleName.trim(), selectedCategory?.name].filter(Boolean);
  const currentFolderPath = ["My Libraries", ...(explorerQuery.data?.breadcrumb || []).map((item) => item.label || "Folder")];
  const completedStepCount = WIZARD_STEPS.reduce((count, _, index) => count + (stepIsComplete(index) ? 1 : 0), 0);
  const destinationPreviewPath = destinationMode === "guided" ? guidedPath : currentFolderPath;
  const stepTitle = `Step ${activeStep + 1} of ${WIZARD_STEPS.length}: ${WIZARD_STEPS[activeStep].label}`;

  const containerMenus = [
    { id: "dashboard", label: "Overview", description: "Stats, quick actions & guidance.", icon: LayoutGrid },
    { id: "libraries", label: "My Libraries", description: "Jump into your semester roots.", icon: FolderTree },
    { id: "explorer", label: "Explorer", description: "Browse folders and manage files.", icon: FolderOpen },
  ];

  const structureOrder = ["University / Institute", "Year", "Semester", "Module / Subject", "Type"];

  const openFolder = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) { next.set("folderId", String(id)); } else { next.delete("folderId"); }
    setSearchParams(next);
    setActiveContainer("explorer");
  };

  const addDraftFiles = (files) => {
    const nextItems = Array.from(files || []).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      displayName: file.name,
    }));
    setDraftFiles((current) => [...current, ...nextItems]);
  };

  const onRename = (id, newName) => setDraftFiles((current) => current.map((item) => (item.id === id ? { ...item, displayName: newName } : item)));
  const onRemove = (id) => setDraftFiles((current) => current.filter((item) => item.id !== id));

  function stepIsComplete(index) {
    if (index === 0) return Boolean(structureForm.institutionId);
    if (index === 1) return Boolean(structureForm.yearId && structureForm.semesterId);
    if (index === 2) return Boolean(structureForm.moduleName.trim());
    if (index === 3) return Boolean(structureForm.categoryId);
    if (index === 4) return draftFiles.length > 0;
    return false;
  }

  const canAccessStep = (index) => index === 0 || WIZARD_STEPS.slice(0, index).every((_, i) => stepIsComplete(i));

  const goToStep = (index) => {
    if (canAccessStep(index)) { setActiveStep(index); return; }
    toast.error("Complete the earlier step first.");
  };

  const goNextStep = () => {
    if (!stepIsComplete(activeStep)) { toast.error("Finish this step before moving forward."); return; }
    setActiveStep((current) => Math.min(current + 1, WIZARD_STEPS.length - 1));
  };

  const buildEnsurePayload = () => {
    if (!structureForm.semesterId) throw new Error("Choose the university, year, and semester first.");
    if (!structureForm.moduleName.trim()) throw new Error("Add the module or subject name first.");
    if (!structureForm.categoryId) throw new Error("Choose a resource type first.");
    return { semesterFolderId: Number(structureForm.semesterId), moduleName: structureForm.moduleName.trim(), categoryId: Number(structureForm.categoryId), visibility: structureForm.visibility };
  };

  const handleOpenDestination = async () => {
    try { await ensurePathMutation.mutateAsync(buildEnsurePayload()); setActiveStep(WIZARD_STEPS.length - 1); }
    catch (error) { toast.error(error?.message || "Unable to open the destination folder."); }
  };

  const handleUpload = async () => {
    if (draftFiles.length === 0) { toast.error("Add at least one file before uploading."); return; }
    let targetFolderId = null;
    let visibility = structureForm.visibility;
    if (destinationMode === "current") {
      if (!currentFolder?.id) { toast.error("Open a folder in the explorer before using current folder uploads."); return; }
      targetFolderId = currentFolder.id;
      visibility = currentFolder.visibility || visibility;
    } else {
      try { const f = await ensurePathMutation.mutateAsync(buildEnsurePayload()); targetFolderId = f.id; }
      catch (error) { toast.error(error?.message || "Unable to prepare the academic destination."); return; }
    }
    uploadMutation.mutate({ payload: { folderId: targetFolderId, visibility, items: draftFiles.map((item) => ({ displayName: item.displayName })) }, files: draftFiles.map((item) => item.file) });
  };

  const handleFolderCreate = () => {
    if (!currentFolder?.id) { toast.error("Open a folder before creating a subfolder."); return; }
    if (!folderForm.name.trim()) { toast.error("Give the folder a name first."); return; }
    createFolderMutation.mutate({ parentId: currentFolder.id, name: folderForm.name.trim(), folderType: folderForm.folderType, visibility: currentFolder.visibility });
  };

  const handleFileEditChange = (fileId, field, value) =>
    setFileEdits((current) => ({ ...current, [fileId]: { ...current[fileId], [field]: value } }));

  const handleFileSave = (file) => {
    const draft = fileEdits[file.id] || {};
    updateFileMutation.mutate({ id: file.id, payload: { displayName: draft.displayName || file.displayName, visibility: draft.visibility || file.visibility, folderId: draft.folderId ? Number(draft.folderId) : file.folderId } });
  };

  return (
    <div className="rm2-shell">
      <SEO title="My Resource Library | VCollab" description="Organize your academic resources, upload files, and manage your public VCollab library." />

      {/* Top bar */}
      <header className="rm2-topbar">
        <div className="rm2-topbar__inner">
          <Link to="/resources" className="rm2-back-link">
            <ArrowLeft size={16} />
            <span>Resources</span>
          </Link>
          <div className="rm2-topbar__title">
            <LibraryBig size={18} />
            <span>My Library</span>
          </div>
          <button className="rm2-upload-trigger" onClick={() => setIsUploadModalOpen(true)}>
            <Wand2 size={16} />
            Upload Wizard
          </button>
        </div>
      </header>

      <div className="rm2-layout">
        {/* ── Sidebar ── */}
        <aside className="rm2-sidebar">
          {/* Stats */}
          <div className="rm2-sidebar-stats">
            <div className="rm2-sstat">
              <div className="rm2-sstat__icon" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>
                <Database size={16} />
              </div>
              <div>
                <strong>{workspaceStats.totalResources}</strong>
                <span>Resources</span>
              </div>
            </div>
            <div className="rm2-sstat">
              <div className="rm2-sstat__icon" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                <Globe size={16} />
              </div>
              <div>
                <strong>{workspaceStats.publicResources}</strong>
                <span>Public</span>
              </div>
            </div>
            <div className="rm2-sstat">
              <div className="rm2-sstat__icon" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                <HardDrive size={16} />
              </div>
              <div>
                <strong>{formatFileSize(workspaceStats.storageUsed)}</strong>
                <span>Storage</span>
              </div>
            </div>
          </div>

          {/* Navigation menu */}
          <nav className="rm2-sidebar-nav">
            <p className="rm2-sidebar-nav__label">Workspace</p>
            {containerMenus.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeContainer;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`rm2-nav-item ${isActive ? "rm2-nav-item--active" : ""}`}
                  onClick={() => setActiveContainer(item.id)}
                >
                  <Icon size={18} />
                  <div className="rm2-nav-item__copy">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </div>
                  {isActive && <span className="rm2-nav-item__dot" />}
                </button>
              );
            })}
          </nav>

          {/* Quick libraries */}
          {libraries.length > 0 && (
            <div className="rm2-sidebar-libraries">
              <p className="rm2-sidebar-nav__label">Quick access</p>
              {libraries.slice(0, 3).map((lib) => (
                <button
                  key={lib.folderId}
                  type="button"
                  className={`rm2-lib-shortcut ${String(lib.folderId) === folderId ? "rm2-lib-shortcut--active" : ""}`}
                  onClick={() => openFolder(lib.folderId)}
                >
                  <FolderTree size={14} />
                  <span>{lib.institutionName} · {lib.semesterLabel}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ── Main Panel ── */}
        <main className="rm2-main">

          {/* DASHBOARD VIEW */}
          {activeContainer === "dashboard" && (
            <div className="rm2-panel">
              <div className="rm2-panel__head">
                <div>
                  <p className="rm2-eyebrow">Workspace Overview</p>
                  <h2 className="rm2-panel__title">Your academic resource hub</h2>
                  <p className="rm2-panel__desc">Start from a guided upload, jump into semester libraries, or open the explorer to manage files.</p>
                </div>
                <div className="rm2-panel__actions">
                  <button type="button" className="rm2-btn rm2-btn--primary" onClick={() => setIsUploadModalOpen(true)}>
                    <Wand2 size={16} /> Start Upload Wizard
                  </button>
                  <button type="button" className="rm2-btn rm2-btn--ghost" onClick={() => setActiveContainer("libraries")}>
                    <FolderTree size={16} /> Open My Libraries
                  </button>
                </div>
              </div>

              <div className="rm2-overview-grid">
                {/* Upload order card */}
                <div className="rm2-card">
                  <div className="rm2-card__head">
                    <strong>Default upload order</strong>
                    <span>University → resource type</span>
                  </div>
                  <div className="rm2-path-preview">
                    {["University", "Year", "Semester", "Module", "Type"].map((seg, i, arr) => (
                      <div key={seg} className="rm2-path-step">
                        <span>{seg}</span>
                        {i < arr.length - 1 && <MoveRight size={13} />}
                      </div>
                    ))}
                  </div>
                  <div className="rm2-summary-list">
                    <div className="rm2-summary-row">
                      <span>Wizard progress</span>
                      <strong>{completedStepCount} / {WIZARD_STEPS.length} steps</strong>
                    </div>
                    <div className="rm2-summary-row">
                      <span>Current path</span>
                      <strong>{guidedPath.length ? guidedPath.join(" / ") : "—"}</strong>
                    </div>
                    <div className="rm2-summary-row">
                      <span>Uploader folder</span>
                      <strong>{contributorLabel}</strong>
                    </div>
                  </div>
                </div>

                {/* Semester libraries card */}
                <div className="rm2-card">
                  <div className="rm2-card__head">
                    <strong>Semester libraries</strong>
                    <span>{libraries.length} root folder(s)</span>
                  </div>
                  <div className="rm2-lib-list">
                    {libraries.slice(0, 4).map((lib) => (
                      <button key={lib.folderId} type="button" className={`rm2-lib-item ${String(lib.folderId) === folderId ? "rm2-lib-item--active" : ""}`} onClick={() => openFolder(lib.folderId)}>
                        <div className="rm2-lib-icon"><FolderTree size={16} /></div>
                        <div className="rm2-lib-copy">
                          <strong>{lib.institutionName}</strong>
                          <span>{lib.academicYearLabel} / {lib.semesterLabel}</span>
                          <small>{lib.resourceCount} resources · {formatFileSize(lib.storageUsed)}</small>
                        </div>
                        <ChevronRight size={14} className="rm2-lib-arrow" />
                      </button>
                    ))}
                    {libraries.length === 0 && (
                      <div className="rm2-empty">
                        <FolderTree size={24} />
                        <p>Your semester libraries will appear here after your first upload.</p>
                      </div>
                    )}
                  </div>
                  {libraries.length > 0 && (
                    <div className="rm2-card__footer">
                      <button type="button" className="rm2-btn rm2-btn--ghost rm2-btn--sm" onClick={() => setActiveContainer("libraries")}>See All Libraries</button>
                      <button type="button" className="rm2-btn rm2-btn--ghost rm2-btn--sm" onClick={() => setActiveContainer("explorer")}>Open Explorer</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LIBRARIES VIEW */}
          {activeContainer === "libraries" && (
            <div className="rm2-panel">
              <div className="rm2-panel__head">
                <div>
                  <p className="rm2-eyebrow">My Libraries</p>
                  <h2 className="rm2-panel__title">Semester root folders</h2>
                  <p className="rm2-panel__desc">Open a semester root, then continue in the explorer to manage folders and upload files.</p>
                </div>
                <div className="rm2-panel__actions">
                  <button type="button" className="rm2-btn rm2-btn--primary" onClick={() => setIsUploadModalOpen(true)}>
                    <Wand2 size={16} /> New Upload
                  </button>
                  <button type="button" className="rm2-btn rm2-btn--ghost" onClick={() => openFolder()}>
                    <FolderOpen size={16} /> Explorer Root
                  </button>
                </div>
              </div>

              <div className="rm2-folder-grid">
                {libraries.map((lib) => (
                  <button key={lib.folderId} type="button" className="rm2-folder-card" onClick={() => openFolder(lib.folderId)}>
                    <div className="rm2-folder-card__top">
                      <div className="rm2-folder-icon"><LibraryBig size={20} /></div>
                      <span className="rm2-folder-pill">{lib.resourceCount} items</span>
                    </div>
                    <h3>{lib.institutionName}</h3>
                    <p>{lib.academicYearLabel} / {lib.semesterLabel}</p>
                    <div className="rm2-folder-card__foot">
                      <span>{formatFileSize(lib.storageUsed)} used</span>
                      <ChevronRight size={14} />
                    </div>
                  </button>
                ))}
                {libraries.length === 0 && (
                  <div className="rm2-empty rm2-empty--full">
                    <FolderTree size={32} />
                    <p>No semester library exists yet. Start from the upload wizard and your first library will show up here.</p>
                    <button type="button" className="rm2-btn rm2-btn--primary" onClick={() => setIsUploadModalOpen(true)}>
                      <Wand2 size={16} /> Start Wizard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPLORER VIEW */}
          {activeContainer === "explorer" && (
            <div className="rm2-panel">
              <div className="rm2-panel__head">
                <div>
                  <p className="rm2-eyebrow">My Explorer</p>
                  <h2 className="rm2-panel__title">{currentFolder?.name || "Library root"}</h2>
                  <p className="rm2-panel__desc">Browse your resource tree, create folders, upload files, and manage visibility.</p>
                </div>
                <div className="rm2-panel__actions">
                  <button type="button" className="rm2-btn rm2-btn--primary rm2-btn--sm" onClick={() => { setDestinationMode("guided"); setIsUploadModalOpen(true); }}>
                    <Upload size={14} /> New Upload
                  </button>
                  {currentFolder?.id && (
                    <button type="button" className="rm2-btn rm2-btn--ghost rm2-btn--sm" onClick={() => { setDestinationMode("current"); setActiveStep(WIZARD_STEPS.length - 1); setIsUploadModalOpen(true); }}>
                      <PlusSquare size={14} /> Upload Here
                    </button>
                  )}
                  {currentFolder?.id && (
                    <button type="button" className="rm2-btn rm2-btn--danger rm2-btn--sm" onClick={() => deleteFolderMutation.mutate(Number(folderId))}>
                      <Trash2 size={14} /> Delete Folder
                    </button>
                  )}
                </div>
              </div>

              {/* Breadcrumb */}
              <div className="rm2-breadcrumb-bar">
                <button type="button" className="rm2-crumb" onClick={() => openFolder()}>Library root</button>
                {(explorerQuery.data?.breadcrumb || []).map((item) => (
                  <span key={item.id} className="rm2-crumb-sep">
                    <ChevronRight size={14} />
                    <button type="button" className="rm2-crumb" onClick={() => openFolder(item.id)}>{item.label}</button>
                  </span>
                ))}
              </div>

              {/* Drive toolbar */}
              <div className="rm2-toolbar">
                <div className="rm2-toolbar-search">
                  <Search size={15} />
                  <input type="text" value={driveSearch} onChange={(e) => setDriveSearch(e.target.value)} placeholder="Search folders and files..." />
                </div>
                <div className="rm2-toolbar-create">
                  <input type="text" placeholder="New subfolder name" value={folderForm.name} onChange={(e) => setFolderForm((c) => ({ ...c, name: e.target.value }))} />
                  <select value={folderForm.folderType} onChange={(e) => setFolderForm((c) => ({ ...c, folderType: e.target.value }))}>
                    <option value="MODULE">Module</option>
                    <option value="CATEGORY">Type</option>
                    <option value="SUBCATEGORY">Subfolder</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                  <button type="button" className="rm2-btn rm2-btn--primary rm2-btn--sm" onClick={handleFolderCreate} disabled={createFolderMutation.isPending || !currentFolder?.id}>
                    <FolderPlus size={14} /> Create
                  </button>
                </div>
              </div>

              {/* Library-root folders (no folderId) */}
              {!folderId && (
                <div className="rm2-folder-grid">
                  {libraries.map((lib) => (
                    <button key={lib.folderId} type="button" className="rm2-folder-card" onClick={() => openFolder(lib.folderId)}>
                      <div className="rm2-folder-card__top">
                        <div className="rm2-folder-icon"><LibraryBig size={20} /></div>
                        <span className="rm2-folder-pill">{lib.resourceCount} items</span>
                      </div>
                      <h3>{lib.institutionName}</h3>
                      <p>{lib.academicYearLabel} / {lib.semesterLabel}</p>
                      <div className="rm2-folder-card__foot">
                        <span>{formatFileSize(lib.storageUsed)} used</span>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  ))}
                  {libraries.length === 0 && (
                    <div className="rm2-empty rm2-empty--full">
                      <p>No semester library exists yet. Start from the wizard and your first library will show up here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Folder contents (with folderId) */}
              {folderId && (
                <>
                  <div className="rm2-folder-grid">
                    {visibleFolders.map((folder) => (
                      <button key={folder.id} type="button" className="rm2-folder-card" onClick={() => openFolder(folder.id)}>
                        <div className="rm2-folder-card__top">
                          <div className="rm2-folder-icon rm2-folder-icon--sub"><FolderTree size={18} /></div>
                          <span className="rm2-folder-pill">{folder.resourceCount} resources</span>
                        </div>
                        <h3>{folder.name}</h3>
                        <p>{folder.folderType} · {folder.childFolderCount} sub-folders</p>
                      </button>
                    ))}
                    {visibleFolders.length === 0 && (
                      <p className="rm2-empty-inline">No folders here. Create one from the toolbar above.</p>
                    )}
                  </div>

                  {/* Files table */}
                  <div className="rm2-files-table">
                    {visibleFiles.map((file) => {
                      const draft = fileEdits[file.id] || {};
                      return (
                        <div key={file.id} className="rm2-file-row">
                          <div className="rm2-file-row__identity">
                            <div className="rm2-file-icon-sm"><FileText size={15} /></div>
                            <div>
                              <strong>{file.displayName}</strong>
                              <span>{file.resourceType} · {formatFileSize(file.fileSize)} · {file.visibility}</span>
                            </div>
                          </div>
                          <input className="rm2-file-input" value={fileEdits[file.id]?.displayName || file.displayName} onChange={(e) => handleFileEditChange(file.id, "displayName", e.target.value)} />
                          <select className="rm2-file-select" value={fileEdits[file.id]?.visibility || file.visibility} onChange={(e) => handleFileEditChange(file.id, "visibility", e.target.value)}>
                            <option value="PUBLIC">Public</option>
                            <option value="INSTITUTION_ONLY">Institution only</option>
                            <option value="PRIVATE">Private</option>
                          </select>

                          <div className="rm2-file-row__actions">
                            <button type="button" className="rm2-action-btn" onClick={() => handleFileSave(file)}><Save size={13} /> Save</button>
                            <button type="button" className="rm2-action-btn rm2-action-btn--ghost" onClick={() => { setReplaceTarget(file.id); replaceInputRef.current?.click(); }}><MoveRight size={13} /> Replace</button>
                            <button type="button" className="rm2-action-btn rm2-action-btn--danger" onClick={() => deleteFileMutation.mutate(file.id)}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      );
                    })}
                    {visibleFiles.length === 0 && (
                      <div className="rm2-empty">
                        <FileText size={24} />
                        <p>No files in this folder yet. Upload a resource from the wizard or use Upload Here.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Upload Wizard Modal ── */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="rm2-overlay">
            <motion.div
              className="rm2-modal"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.22 }}
            >
              {/* Modal header */}
              <div className="rm2-modal__head">
                <div>
                  <p className="rm2-eyebrow">Guided Upload Wizard</p>
                  <h2 className="rm2-modal__title">{WIZARD_STEPS[activeStep].label}</h2>
                  <p className="rm2-modal__subtitle">{WIZARD_STEPS[activeStep].description}</p>
                </div>
                <button type="button" className="rm2-modal__close" onClick={() => setIsUploadModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              {/* Step indicator */}
              <div className="rm2-stepper">
                {WIZARD_STEPS.map((step, index) => {
                  const completed = stepIsComplete(index);
                  const isCurrent = activeStep === index;
                  const available = canAccessStep(index);
                  return (
                    <div key={step.id} className="rm2-step-wrap">
                      <button
                        type="button"
                        className={`rm2-step ${isCurrent ? "rm2-step--active" : ""} ${completed ? "rm2-step--done" : ""}`}
                        onClick={() => goToStep(index)}
                        disabled={!available}
                        title={step.label}
                      >
                        <div className="rm2-step__bubble">
                          {completed ? <CheckCircle2 size={14} /> : <span>{index + 1}</span>}
                        </div>
                        <span className="rm2-step__label">{step.label}</span>
                      </button>
                      {index < WIZARD_STEPS.length - 1 && (
                        <div className={`rm2-step__connector ${completed ? "rm2-step__connector--done" : ""}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Wizard body */}
              <div className="rm2-modal__body">
                {/* Step 1: Institution */}
                {activeStep === 0 && (
                  <div className="rm2-stage">
                    <div className="rm2-stage__header">
                      <h3>Pick the institution</h3>
                      <p>Select the Sri Lankan university or institute for this resource group.</p>
                    </div>
                    <div className="rm2-field-search">
                      <Search size={15} />
                      <input type="text" value={institutionSearch} onChange={(e) => setInstitutionSearch(e.target.value)} placeholder="Search universities..." />
                    </div>
                    <div className="rm2-wizard-field">
                      <select value={structureForm.institutionId} onChange={(e) => setStructureForm((c) => ({ ...c, institutionId: e.target.value, yearId: "", semesterId: "" }))}>
                        <option value="">Choose an institution</option>
                        {institutionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Year & Semester */}
                {activeStep === 1 && (
                  <div className="rm2-stage">
                    <div className="rm2-stage__header">
                      <h3>Academic Year & Semester</h3>
                      <p>Select the targeted semester shelf.</p>
                    </div>
                    <div className="rm2-two-col">
                      <div className="rm2-wizard-field">
                        <label>Academic Year</label>
                        <select value={structureForm.yearId} disabled={!structureForm.institutionId} onChange={(e) => setStructureForm((c) => ({ ...c, yearId: e.target.value, semesterId: "" }))}>
                          <option value="">Choose a year</option>
                          {(yearsQuery.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </div>
                      <div className="rm2-wizard-field">
                        <label>Semester</label>
                        <select value={structureForm.semesterId} disabled={!structureForm.yearId} onChange={(e) => setStructureForm((c) => ({ ...c, semesterId: e.target.value }))}>
                          <option value="">Choose a semester</option>
                          {(semestersQuery.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Module */}
                {activeStep === 2 && (
                  <div className="rm2-stage">
                    <div className="rm2-stage__header">
                      <h3>Module / Subject Name</h3>
                      <p>Enter the specific subject folder name.</p>
                    </div>
                    <div className="rm2-wizard-field">
                      <input type="text" value={structureForm.moduleName} onChange={(e) => setStructureForm((c) => ({ ...c, moduleName: e.target.value }))} placeholder="e.g. Data Structures & Algorithms" />
                    </div>
                  </div>
                )}

                {/* Step 4: Resource Type */}
                {activeStep === 3 && (
                  <div className="rm2-stage">
                    <div className="rm2-stage__header">
                      <h3>Pick Resource Type</h3>
                      <p>Choose notes, past papers, slides, or another type.</p>
                    </div>
                    <div className="rm2-choice-grid">
                      {allCategories.map((item) => (
                        <button key={item.id} type="button" className={`rm2-choice ${String(item.id) === structureForm.categoryId ? "rm2-choice--active" : ""}`} onClick={() => setStructureForm((c) => ({ ...c, categoryId: String(item.id) }))}>
                          <strong>{item.name}</strong>
                          <span>{item.description}</span>
                          {String(item.id) === structureForm.categoryId && <CheckCircle2 size={16} className="rm2-choice__check" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: Upload */}
                {activeStep === 4 && (
                  <div className="rm2-stage">
                    <div className="rm2-stage__header">
                      <h3>Review & Publish</h3>
                      <div className="rm2-mode-toggle">
                        {destinationMode === "guided" ? (
                          <button type="button" onClick={() => { setDestinationMode("current"); setActiveStep(4); }} disabled={!currentFolder?.id}>Switch to Current Folder</button>
                        ) : (
                          <button type="button" onClick={() => setDestinationMode("guided")}>Back to Guided Path</button>
                        )}
                      </div>
                    </div>
                    {destinationPreviewPath.length > 0 && (
                      <div className="rm2-dest-path">
                        <span>Destination:</span>
                        {destinationPreviewPath.map((seg, i) => (
                          <span key={i} className="rm2-dest-seg">{seg}{i < destinationPreviewPath.length - 1 && " /"}</span>
                        ))}
                      </div>
                    )}
                    <label className="rm2-dropzone">
                      <input type="file" multiple hidden onChange={(e) => addDraftFiles(e.target.files)} />
                      <Upload size={24} />
                      <strong>Click to select files</strong>
                      <span>or drag and drop here</span>
                    </label>
                    <div className="rm2-draft-list">
                      {draftFiles.map((item) => <FileDraftRow key={item.id} item={item} onRename={onRename} onRemove={onRemove} />)}
                      {draftFiles.length === 0 && <p className="rm2-draft-empty">No files queued yet.</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="rm2-modal__foot">
                <div>
                  {activeStep > 0 && (
                    <button type="button" className="rm2-btn rm2-btn--ghost" onClick={() => setActiveStep(activeStep - 1)}>
                      <ArrowLeft size={16} /> Back
                    </button>
                  )}
                </div>
                <div>
                  {activeStep < WIZARD_STEPS.length - 1 ? (
                    <button type="button" className="rm2-btn rm2-btn--primary" onClick={goNextStep}>
                      Continue <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button type="button" className="rm2-btn rm2-btn--primary" onClick={handleUpload} disabled={uploadMutation.isPending}>
                      {uploadMutation.isPending ? "Uploading..." : "Publish to Library"} <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden replace input */}
      <input
        ref={replaceInputRef}
        type="file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replaceTarget) replaceFileMutation.mutate({ id: replaceTarget, payload: null, file });
          e.target.value = "";
        }}
      />
    </div>
  );
}
