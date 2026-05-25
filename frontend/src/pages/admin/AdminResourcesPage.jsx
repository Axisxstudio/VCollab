import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FolderTree, Save, ShieldCheck, Trash2, Wrench } from "lucide-react";
import {
  createAdminResourceCategory,
  createAdminResourceStructure,
  deleteAdminResource,
  listAdminResourceCategories,
  listAdminResources,
  listAdminResourceStructure,
  restoreAdminResource,
  updateAdminResourceCategory,
  updateAdminResourceModeration,
  updateAdminResourceStructure
} from "../../services/resource.service";
import "../resources/resources.css";

const PAGE_SIZE = 12;

export default function AdminResourcesPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    owner: "",
    visibility: "",
    active: "",
    institution: "",
    resourceType: "",
    deleted: "false"
  });
  const [page, setPage] = useState(0);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [structureDraft, setStructureDraft] = useState({ name: "", type: "INSTITUTION", parentId: "", sortOrder: 0, active: true });
  const [categoryDraft, setCategoryDraft] = useState({ name: "", description: "", icon: "FolderOpen", sortOrder: 0, active: true });

  const resourceQuery = useQuery({
    queryKey: ["admin", "resources", filters, page],
    queryFn: () =>
      listAdminResources({
        ...filters,
        page,
        size: PAGE_SIZE
      })
  });

  const institutionsQuery = useQuery({
    queryKey: ["admin", "resource-structure", "institutions"],
    queryFn: () => listAdminResourceStructure("INSTITUTION")
  });

  const yearsQuery = useQuery({
    queryKey: ["admin", "resource-structure", "years", selectedInstitutionId],
    queryFn: () => listAdminResourceStructure("ACADEMIC_YEAR", Number(selectedInstitutionId)),
    enabled: Boolean(selectedInstitutionId)
  });

  const semestersQuery = useQuery({
    queryKey: ["admin", "resource-structure", "semesters", selectedYearId],
    queryFn: () => listAdminResourceStructure("SEMESTER", Number(selectedYearId)),
    enabled: Boolean(selectedYearId)
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "resource-categories"],
    queryFn: listAdminResourceCategories
  });

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "resource-structure"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "resource-categories"] });
    await queryClient.invalidateQueries({ queryKey: ["resources"] });
  };

  const moderationMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminResourceModeration(id, payload),
    onSuccess: async () => {
      toast.success("Resource moderation updated.");
      await invalidateAll();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to update moderation.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminResource,
    onSuccess: async () => {
      toast.success("Resource moved to recycle bin.");
      await invalidateAll();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to delete the resource.")
  });

  const restoreMutation = useMutation({
    mutationFn: restoreAdminResource,
    onSuccess: async () => {
      toast.success("Resource restored.");
      await invalidateAll();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to restore the resource.")
  });

  const structureMutation = useMutation({
    mutationFn: (payload) => createAdminResourceStructure(payload),
    onSuccess: async () => {
      setStructureDraft({ name: "", type: "INSTITUTION", parentId: "", sortOrder: 0, active: true });
      toast.success("Academic structure updated.");
      await invalidateAll();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to create the structure.")
  });

  const structureUpdateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminResourceStructure(id, payload),
    onSuccess: async () => {
      toast.success("Structure saved.");
      await invalidateAll();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to update the structure.")
  });

  const categoryCreateMutation = useMutation({
    mutationFn: createAdminResourceCategory,
    onSuccess: async () => {
      setCategoryDraft({ name: "", description: "", icon: "FolderOpen", sortOrder: 0, active: true });
      toast.success("Category created.");
      await invalidateAll();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to create the category.")
  });

  const categoryUpdateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdminResourceCategory(id, payload),
    onSuccess: async () => {
      toast.success("Category updated.");
      await invalidateAll();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Unable to update the category.")
  });

  const resourceRows = resourceQuery.data?.content || [];
  const totalPages = resourceQuery.data?.totalPages || 0;

  const structureParentId = useMemo(() => {
    if (structureDraft.type === "ACADEMIC_YEAR") return selectedInstitutionId || "";
    if (structureDraft.type === "SEMESTER") return selectedYearId || "";
    return "";
  }, [structureDraft.type, selectedInstitutionId, selectedYearId]);

  return (
    <div className="admin-pro-stack admin-page-stack">

      <section className="card admin-filter-panel">
        <div className="admin-filter-grid">
          <input value={filters.search} placeholder="Search file name or description" onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, search: event.target.value })); }} />
          <input value={filters.owner} placeholder="Owner username" onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, owner: event.target.value })); }} />
          <input value={filters.institution} placeholder="Institution" onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, institution: event.target.value })); }} />
          <select value={filters.visibility} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, visibility: event.target.value })); }}>
            <option value="">All visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="INSTITUTION_ONLY">Institution only</option>
            <option value="PRIVATE">Private</option>
          </select>
          <select value={filters.active} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, active: event.target.value })); }}>
            <option value="">All states</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select value={filters.resourceType} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, resourceType: event.target.value })); }}>
            <option value="">All file types</option>
            {["PDF", "DOC", "DOCX", "PPT", "PPTX", "JPG", "JPEG", "PNG", "WEBP", "ZIP", "TXT"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select value={filters.deleted} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, deleted: event.target.value })); }}>
            <option value="false">Active records</option>
            <option value="true">Recycle bin</option>
          </select>
        </div>
      </section>

      <section className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Owner</th>
              <th>Academic Path</th>
              <th>Type</th>
              <th>Visibility</th>
              <th>Status</th>
              <th>Views</th>
              <th>Downloads</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resourceRows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="admin-table-empty">No resource records match the current filters.</div>
                </td>
              </tr>
            ) : (
              resourceRows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="admin-table-title">{item.displayName}</div>
                    <div className="profile-meta">{item.originalFileName}</div>
                  </td>
                  <td>@{item.ownerUsername}</td>
                  <td>{[item.institutionName, item.academicYearLabel, item.semesterLabel, item.categoryName, item.moduleName].filter(Boolean).join(" > ")}</td>
                  <td>{item.resourceType}</td>
                  <td>{item.visibility}</td>
                  <td>{item.active ? "Active" : "Inactive"}</td>
                  <td>{item.viewCount}</td>
                  <td>{item.downloadCount}</td>
                  <td>
                    <div className="admin-table-actions">
                      {!item.deletedAt && (
                        <>
                          <button type="button" className="admin-icon-btn" onClick={() => moderationMutation.mutate({ id: item.id, payload: { visibility: item.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC" } })} title="Toggle visibility">
                            <ShieldCheck size={15} />
                          </button>
                          <button type="button" className="admin-icon-btn" onClick={() => moderationMutation.mutate({ id: item.id, payload: { active: !item.active } })} title="Toggle active">
                            <Save size={15} />
                          </button>
                          <button type="button" className="admin-icon-btn admin-icon-btn--danger" onClick={() => deleteMutation.mutate(item.id)} title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {item.deletedAt && (
                        <button type="button" className="admin-icon-btn" onClick={() => restoreMutation.mutate(item.id)} title="Restore">
                          <Save size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="admin-table-pagination">
            <span className="admin-table-pagination__meta">Page {page + 1} of {totalPages}</span>
            <div className="admin-table-pagination__btns">
              <button type="button" className="admin-table-pagination__btn" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={page === 0}>Previous</button>
              <button type="button" className="admin-table-pagination__btn" onClick={() => setPage((current) => current + 1)} disabled={page + 1 >= totalPages}>Next</button>
            </div>
          </div>
        )}
      </section>

      <div className="resources-admin-grid">
        <section className="card">
          <div className="project-actions">
            <div>
              <span className="resources-eyebrow">Academic Structure</span>
              <h3>Institutions, years, and semesters</h3>
            </div>
            <div className="card-icon-box warning"><FolderTree size={18} /></div>
          </div>

          <div className="resources-admin-structure">
            <div>
              <strong>Institutions</strong>
              <div className="resources-admin-list">
                {(institutionsQuery.data || []).map((item) => (
                  <button key={item.id} type="button" className={`resources-admin-item ${String(item.id) === selectedInstitutionId ? "active" : ""}`} onClick={() => { setSelectedInstitutionId(String(item.id)); setSelectedYearId(""); }}>
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <strong>Academic Years</strong>
              <div className="resources-admin-list">
                {(yearsQuery.data || []).map((item) => (
                  <button key={item.id} type="button" className={`resources-admin-item ${String(item.id) === selectedYearId ? "active" : ""}`} onClick={() => setSelectedYearId(String(item.id))}>
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <strong>Semesters</strong>
              <div className="resources-admin-list">
                {(semestersQuery.data || []).map((item) => (
                  <div key={item.id} className="resources-admin-item resources-admin-item--static">
                    <span>{item.name}</span>
                    <button type="button" className="resources-mini-btn resources-mini-btn--ghost" onClick={() => structureUpdateMutation.mutate({ id: item.id, payload: { name: item.name, folderType: item.folderType, active: !item.active, sortOrder: item.sortOrder } })}>
                      {item.active ? "Disable" : "Enable"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="resources-admin-form">
            <select value={structureDraft.type} onChange={(event) => setStructureDraft((current) => ({ ...current, type: event.target.value }))}>
              <option value="INSTITUTION">Institution</option>
              <option value="ACADEMIC_YEAR">Academic year</option>
              <option value="SEMESTER">Semester</option>
            </select>
            <input value={structureDraft.name} placeholder="Name" onChange={(event) => setStructureDraft((current) => ({ ...current, name: event.target.value }))} />
            <input type="number" value={structureDraft.sortOrder} placeholder="Sort order" onChange={(event) => setStructureDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
            <button type="button" className="btn-glow-danger" onClick={() => structureMutation.mutate({ ...structureDraft, parentId: structureParentId ? Number(structureParentId) : undefined })}>
              <Wrench size={16} />
              Create Structure Node
            </button>
          </div>
        </section>

        <section className="card">
          <div className="project-actions">
            <div>
              <span className="resources-eyebrow">Default Categories</span>
              <h3>Guided upload category list</h3>
            </div>
          </div>

          <div className="resources-admin-form">
            <input value={categoryDraft.name} placeholder="Category name" onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))} />
            <input value={categoryDraft.description} placeholder="Description" onChange={(event) => setCategoryDraft((current) => ({ ...current, description: event.target.value }))} />
            <input value={categoryDraft.icon} placeholder="Icon token" onChange={(event) => setCategoryDraft((current) => ({ ...current, icon: event.target.value }))} />
            <button type="button" className="btn-glow-danger" onClick={() => categoryCreateMutation.mutate(categoryDraft)}>
              Create Category
            </button>
          </div>

          <div className="resources-admin-list">
            {(categoriesQuery.data || []).map((category) => (
              <div key={category.id} className="resources-admin-item resources-admin-item--static">
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.description}</span>
                </div>
                <button type="button" className="resources-mini-btn resources-mini-btn--ghost" onClick={() => categoryUpdateMutation.mutate({ id: category.id, payload: { ...category, active: !category.active } })}>
                  {category.active ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
