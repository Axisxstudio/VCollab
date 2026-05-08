import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  GraduationCap, 
  Layers, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Folder,
  FileText,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  listResourceYears, 
  listResourceSemesters, 
  explorePublicResources,
  previewPublicResourceFile
} from "../../services/resource.service";
import { routes } from "../../config/routes";

export default function ResourceDiscoveryModal({ institution, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Year, 2: Semester, 3+: Recursive Explorer
  const [history, setHistory] = useState([]); // Tracks the path for breadcrumbs and navigation [ { id, name, type } ]
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [explorerData, setExplorerData] = useState({ folders: [], files: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (institution?.id) {
      fetchYears();
    }
  }, [institution]);

  const fetchYears = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResourceYears(institution.id);
      setYears(data || []);
      setHistory([]);
      if (data?.length === 0) {
        setError("No academic years found for this institution.");
      }
    } catch (err) {
      setError("Unable to load academic structure.");
    } finally {
      setLoading(false);
    }
  };

  const handleYearSelect = async (year) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResourceSemesters(year.id);
      setSemesters(data || []);
      setHistory([{ id: year.id, name: year.name, type: "YEAR" }]);
      setStep(2);
      if (data?.length === 0) {
        setError(`No semesters found for ${year.name}.`);
      }
    } catch (err) {
      setError("Unable to load semesters.");
    } finally {
      setLoading(false);
    }
  };

  const handleFolderSelect = async (folder, type = "FOLDER") => {
    setLoading(true);
    setError(null);
    try {
      const data = await explorePublicResources(folder.id);
      setExplorerData(data || { folders: [], files: [] });
      
      // Update history
      const newHistory = [...history];
      // If we're coming from Step 2, replace the current history or append
      if (type === "SEMESTER") {
        setHistory([...history.slice(0, 1), { id: folder.id, name: folder.name, type: "SEMESTER" }]);
        setStep(3);
      } else {
        setHistory([...history, { id: folder.id, name: folder.name, type: "FOLDER" }]);
        setStep(3);
      }
      
      if ((data?.folders?.length || 0) === 0 && (data?.files?.length || 0) === 0) {
        setError(`This folder (${folder.name}) is currently empty.`);
      }
    } catch (err) {
      setError("Unable to load folder contents.");
    } finally {
      setLoading(false);
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setStep(1);
      setHistory([]);
      setError(null);
      return;
    }
    
    const target = history[index];
    if (target.type === "YEAR") {
      setStep(1);
      setHistory([]);
      handleYearSelect(target);
    } else if (target.type === "SEMESTER") {
      setStep(2);
      setHistory(history.slice(0, 1));
      handleFolderSelect(history[0], "YEAR"); // This is just to get semesters back
    } else {
      setHistory(history.slice(0, index));
      handleFolderSelect(target);
    }
  };

  const navigateToExplorer = () => {
    const lastFolder = history[history.length - 1];
    onClose();
    navigate(`${routes.resourceExplore}?folderId=${lastFolder?.id || institution.id}`);
  };

  const handleFilePreview = async (fileId) => {
    try {
      const resource = await previewPublicResourceFile(fileId);
      window.open(resource.publicUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      alert("Unable to preview file.");
    }
  };

  return (
    <div className="resources-modal-overlay" onClick={onClose}>
      <motion.div 
        className="resources-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="resources-modal__header">
          <div className="resources-modal__header-info">
            <span className="resources-eyebrow">Interactive Resource Explorer</span>
            <h2>{institution?.name}</h2>
            {history.length > 0 && (
              <div className="resources-modal__breadcrumbs">
                <button onClick={() => handleBreadcrumbClick(-1)}>{institution?.name}</button>
                {history.map((item, index) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ChevronRight size={12} />
                    <button 
                      onClick={() => handleBreadcrumbClick(index)}
                      className={index === history.length - 1 ? "active" : ""}
                    >
                      {item.name}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="resources-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="resources-modal__body">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="resources-modal__loading"
              >
                <Loader2 size={32} className="spin" />
                <p>Opening explorer...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="resources-modal__error-card"
              >
                <div className="resources-modal__error-icon">
                  <AlertCircle size={32} />
                </div>
                <h3>End of Path</h3>
                <p>{error}</p>
                <div className="resources-modal__error-actions">
                  <button className="resources-btn resources-btn--primary" onClick={() => handleBreadcrumbClick(history.length - 2)}>
                    Go Back One Step
                  </button>
                  <button className="resources-btn resources-btn--ghost" onClick={navigateToExplorer}>
                    Browse Full Library Page
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={step + (history.length || 0)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="resources-modal__step-content"
              >
                {step === 1 && (
                  <div className="resources-modal__grid">
                    {years.map((year) => (
                      <button 
                        key={year.id} 
                        className="resources-modal__card"
                        onClick={() => handleYearSelect(year)}
                      >
                        <div className="resources-modal__card-icon">
                          <Calendar size={20} />
                        </div>
                        <div className="resources-modal__card-copy">
                          <strong>{year.name}</strong>
                          <span>{year.resourceCount || 0} files</span>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="resources-modal__grid">
                    {semesters.map((semester) => (
                      <button 
                        key={semester.id} 
                        className="resources-modal__card"
                        onClick={() => handleFolderSelect(semester, "SEMESTER")}
                      >
                        <div className="resources-modal__card-icon resources-modal__card-icon--alt">
                          <Layers size={20} />
                        </div>
                        <div className="resources-modal__card-copy">
                          <strong>{semester.name}</strong>
                          <span>{semester.resourceCount || 0} modules</span>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="resources-modal__scroll-area">
                    <div className="resources-modal__grid">
                      {explorerData.folders.map((folder) => (
                        <button 
                          key={folder.id} 
                          className="resources-modal__card"
                          onClick={() => handleFolderSelect(folder)}
                        >
                          <div className="resources-modal__card-icon resources-modal__card-icon--folder">
                            <Folder size={20} />
                          </div>
                          <div className="resources-modal__card-copy">
                            <strong>{folder.name}</strong>
                            <span>Folder • {folder.resourceCount || 0} items</span>
                          </div>
                          <ArrowRight size={16} />
                        </button>
                      ))}
                      {explorerData.files.map((file) => (
                        <button 
                          key={file.id} 
                          className="resources-modal__card"
                          onClick={() => handleFilePreview(file.id)}
                        >
                          <div className="resources-modal__card-icon resources-modal__card-icon--file">
                            <FileText size={20} />
                          </div>
                          <div className="resources-modal__card-copy">
                            <strong>{file.displayName}</strong>
                            <span>File • {file.categoryName || "General"}</span>
                          </div>
                          <ExternalLink size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="resources-modal__footer">
          <button className="resources-modal__full-view" onClick={navigateToExplorer}>
            Open in Full Browser Explorer
            <ArrowRight size={12} />
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
