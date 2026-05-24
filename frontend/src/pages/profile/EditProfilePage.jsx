import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Info,
  Book,
  Github,
  Linkedin,
  Globe,
  Camera,
  Save,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Briefcase,
  School,
  University,
  Calendar,
  Layers,
  FlaskConical,
  Building2,
  Check
} from "lucide-react";
import { profileSchema } from "../../validation/profile.schema";
import {
  getMyProfile,
  updateMyProfile,
  updateProfileImage,
  updateCoverImage
} from "../../services/profile.service";
import "./edit-profile.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const SCHOOL_GRADES = [
  "OL", "AL"
];

const ROLES = [
  { value: "STUDENT", label: "Student" },
  { value: "INDUSTRIAL_EXPERT", label: "Industrial Expert" },
  { value: "SOFTWARE_ENGINEER", label: "Software Engineer" }
];

const UNIVERSITY_YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];
const SEMESTERS = ["Semester 1", "Semester 2"];

const WIZARD_STEPS = [
  { id: 1, label: "University / Institute", icon: Building2 },
  { id: 2, label: "Year & Semester", icon: Calendar },
  { id: 3, label: "Faculty", icon: FlaskConical }
];

// ─── Stepper Component ────────────────────────────────────────────────────────
function UniversityWizardStepper({ currentStep }) {
  return (
    <div className="wizard-stepper">
      {WIZARD_STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="wizard-step-item">
            <div className={`wizard-step-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
              {isCompleted ? <Check size={14} /> : <Icon size={14} />}
            </div>
            <span className={`wizard-step-label ${isActive ? "active" : ""}`}>{step.label}</span>
            {idx < WIZARD_STEPS.length - 1 && (
              <div className={`wizard-step-connector ${isCompleted ? "completed" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [eduStep, setEduStep] = useState(1); // wizard step for university flow
  const profileImageRef = useRef(null);
  const coverImageRef = useRef(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      bio: "",
      department: "",
      yearOfStudy: "",
      institution: "",
      skills: "",
      githubUrl: "",
      linkedinUrl: "",
      websiteUrl: "",
      role: "STUDENT",
      dob: "",
      educationType: "",
      institutionName: "",
      grade: "",
      academicYear: "",
      semester: "",
      faculty: ""
    }
  });

  const educationType = watch("educationType");
  const academicYear = watch("academicYear");

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || "",
        bio: profile.bio || "",
        department: profile.department || "",
        yearOfStudy: profile.yearOfStudy || "",
        institution: profile.institution || "",
        skills: (profile.skills || []).join(", "),
        githubUrl: profile.githubUrl || "",
        linkedinUrl: profile.linkedinUrl || "",
        websiteUrl: profile.websiteUrl || "",
        role: profile.role || "STUDENT",
        dob: profile.dob || "",
        educationType: profile.educationType || "",
        institutionName: profile.institutionName || "",
        grade: profile.grade || "",
        academicYear: profile.academicYear || "",
        semester: profile.semester || "",
        faculty: profile.faculty || ""
      });
    }
  }, [profile, reset]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        skills: values.skills
          ? values.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        dob: values.dob || null,
        educationType: values.educationType || null
      };
      await updateMyProfile(payload);
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      showFeedback("success", "Profile updated successfully!");
    } catch (err) {
      showFeedback("error", "Failed to update profile info.");
    }
  };

  const handleImageChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (type === "profile") {
        await updateProfileImage(file);
      } else {
        await updateCoverImage(file);
      }
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      showFeedback("success", `${type === "profile" ? "Avatar" : "Cover"} updated!`);
    } catch (err) {
      showFeedback("error", "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="edit-profile-shell" style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
        <div className="spinner">Loading your profile preferences...</div>
      </div>
    );
  }

  return (
    <div className="edit-profile-shell">
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="upload-feedback"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className={`feedback-card ${feedback.type}`}>
              {feedback.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{feedback.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{ marginBottom: "20px" }}>
        <button
          onClick={() => navigate(-1)}
          className="btn-cancel"
          style={{ display: "flex", alignItems: "center", gap: "8px", border: "none", paddingLeft: 0, background: "none" }}
        >
          <ChevronLeft size={20} />
          Back to Profile
        </button>
      </header>

      {/* Visual Header (Cover & Avatar) */}
      <section className="edit-profile-visuals">
        <div className="edit-cover-wrapper">
          {profile?.coverImage ? (
            <img src={profile.coverImage} alt="Cover" />
          ) : (
            <div className="profile-cover-placeholder" />
          )}
          <div className="edit-cover-overlay" onClick={() => coverImageRef.current?.click()}>
            <Camera size={24} color="#fff" />
            <span style={{ color: "#fff", marginLeft: "10px", fontWeight: 700 }}>Change Cover Photo</span>
          </div>
          <input
            type="file"
            ref={coverImageRef}
            hidden
            accept="image/*"
            onChange={(e) => handleImageChange(e, "cover")}
          />
        </div>

        <div className="edit-avatar-overlap">
          {profile?.profileImage ? (
            <img src={profile.profileImage} alt="Profile" />
          ) : (
            <div style={{ height: "100%", width: "100%", background: "#f1f5f9", display: "grid", placeItems: "center", fontSize: "2rem", fontWeight: 800 }}>
              {profile?.fullName?.[0] || profile?.username?.[0] || "V"}
            </div>
          )}
          <div className="edit-avatar-overlay" onClick={() => profileImageRef.current?.click()}>
            <Camera size={20} />
            Edit
          </div>
          <input
            type="file"
            ref={profileImageRef}
            hidden
            accept="image/*"
            onChange={(e) => handleImageChange(e, "profile")}
          />
        </div>
      </section>

      <form className="edit-profile-form" onSubmit={handleSubmit(onSubmit)}>

        {/* ─── Basic Section ─────────────────────────────────────────────────── */}
        <motion.div
          className="form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="form-header">
            <User size={20} />
            <h3>Basic Information</h3>
          </div>
          <div className="edit-grid">
            <div className="edit-field edit-field-full">
              <label>Full Name</label>
              <div className="edit-input-wrapper">
                <input type="text" {...register("fullName")} placeholder="e.g. John Doe" />
              </div>
              {errors.fullName && <span className="error">{errors.fullName.message}</span>}
            </div>

            <div className="edit-field edit-field-full">
              <label><Info size={16} /> Bio</label>
              <div className="edit-input-wrapper">
                <textarea
                  {...register("bio")}
                  placeholder="Tell others about your professional background and interests..."
                />
              </div>
              {errors.bio && <span className="error">{errors.bio.message}</span>}
            </div>
          </div>
        </motion.div>

        {/* ─── Identity & Education Section ──────────────────────────────────── */}
        <motion.div
          className="form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="form-header">
            <GraduationCap size={20} />
            <h3>Identity & Education</h3>
          </div>

          <div className="edit-grid">
            {/* Date of Birth */}
            <div className="edit-field">
              <label><Calendar size={16} /> Date of Birth</label>
              <div className="edit-input-wrapper">
                <input type="date" {...register("dob")} />
              </div>
            </div>

            <div className="edit-field">
              <label><User size={16} /> Role</label>
              <div className="edit-input-wrapper">
                <select {...register("role")} className="role-select" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Education Type Selection */}
          <div className="edu-type-section">
            <label className="edu-type-label"><Layers size={16} /> Education Type</label>
            <div className="edu-type-cards">
              <Controller
                name="educationType"
                control={control}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      className={`edu-type-card ${field.value === "SCHOOL" ? "selected" : ""}`}
                      onClick={() => {
                        field.onChange("SCHOOL");
                        setValue("academicYear", "");
                        setValue("semester", "");
                        setValue("faculty", "");
                        setEduStep(1);
                      }}
                    >
                      <School size={28} />
                      <span>School</span>
                      <small>Grades 1–10, OL, AL</small>
                    </button>
                    <button
                      type="button"
                      className={`edu-type-card ${field.value === "UNIVERSITY" ? "selected" : ""}`}
                      onClick={() => {
                        field.onChange("UNIVERSITY");
                        setValue("grade", "");
                        setEduStep(1);
                      }}
                    >
                      <University size={28} />
                      <span>University / Institute</span>
                      <small>Year 1–4, Multi-semester</small>
                    </button>
                  </>
                )}
              />
            </div>
          </div>

          {/* ─── School Flow ────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {educationType === "SCHOOL" && (
              <motion.div
                key="school-flow"
                className="edu-flow-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="edu-flow-header">
                  <School size={18} />
                  <h4>School Details</h4>
                </div>
                <div className="edit-grid">
                  <div className="edit-field edit-field-full">
                    <label><Building2 size={16} /> School Name</label>
                    <div className="edit-input-wrapper">
                      <input
                        type="text"
                        {...register("institutionName")}
                        placeholder="e.g. Royal College, D.S. Senanayake College"
                      />
                    </div>
                  </div>
                  <div className="edit-field edit-field-full">
                    <label><Book size={16} /> Grade</label>
                    <div className="edit-input-wrapper">
                      <Controller
                        name="grade"
                        control={control}
                        render={({ field }) => (
                          <div className="grade-chip-grid">
                            {SCHOOL_GRADES.map((g) => (
                              <button
                                key={g}
                                type="button"
                                className={`grade-chip ${field.value === g ? "selected" : ""}`}
                                onClick={() => field.onChange(g)}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── University Flow (Wizard) ──────────────────────────────────── */}
            {educationType === "UNIVERSITY" && (
              <motion.div
                key="university-flow"
                className="edu-flow-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="edu-flow-header">
                  <University size={18} />
                  <h4>University Details</h4>
                </div>

                <UniversityWizardStepper currentStep={eduStep} />

                <div className="wizard-step-content">
                  <AnimatePresence mode="wait">
                    {/* Step 1: University Name */}
                    {eduStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="wizard-step-pane"
                      >
                        <div className="edit-field">
                          <label><Building2 size={16} /> University / Institute Name</label>
                          <div className="edit-input-wrapper">
                            <input
                              type="text"
                              {...register("institutionName")}
                              placeholder="e.g. SLIIT, University of Moratuwa"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Academic Year + Semester */}
                    {eduStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="wizard-step-pane"
                      >
                        <div className="edit-field">
                          <label><Calendar size={16} /> Academic Year</label>
                          <Controller
                            name="academicYear"
                            control={control}
                            render={({ field }) => (
                              <div className="year-chip-row">
                                {UNIVERSITY_YEARS.map((y) => (
                                  <button
                                    key={y}
                                    type="button"
                                    className={`year-chip ${field.value === y ? "selected" : ""}`}
                                    onClick={() => {
                                      field.onChange(y);
                                      setValue("semester", "");
                                    }}
                                  >
                                    {y}
                                  </button>
                                ))}
                              </div>
                            )}
                          />
                        </div>

                        {academicYear && (
                          <motion.div
                            className="edit-field"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <label><Layers size={16} /> Semester</label>
                            <Controller
                              name="semester"
                              control={control}
                              render={({ field }) => (
                                <div className="year-chip-row">
                                  {SEMESTERS.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      className={`year-chip ${field.value === s ? "selected" : ""}`}
                                      onClick={() => field.onChange(s)}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Step 3: Faculty */}
                    {eduStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="wizard-step-pane"
                      >
                        <div className="edit-field">
                          <label><FlaskConical size={16} /> Faculty / Department</label>
                          <div className="edit-input-wrapper">
                            <input
                              type="text"
                              {...register("faculty")}
                              placeholder="e.g. Faculty of Computing, Engineering"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Wizard Navigation */}
                <div className="wizard-nav">
                  {eduStep > 1 && (
                    <button
                      type="button"
                      className="btn-cancel wizard-btn"
                      onClick={() => setEduStep((s) => s - 1)}
                    >
                      <ChevronLeft size={16} /> Back
                    </button>
                  )}
                  {eduStep < WIZARD_STEPS.length && (
                    <button
                      type="button"
                      className="btn-primary wizard-btn"
                      onClick={() => setEduStep((s) => s + 1)}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  )}
                  {eduStep === WIZARD_STEPS.length && (
                    <button type="submit" className="btn-primary wizard-btn" style={{ background: "#22c55e", borderColor: "#22c55e" }}>
                      <Save size={16} /> Save Profile
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {educationType === "SCHOOL" && (
            <div style={{ padding: "0 24px 24px 24px", display: "flex", justifyContent: "flex-end" }}>
               <button type="submit" className="btn-primary" style={{ background: "#22c55e", borderColor: "#22c55e", display: "flex", alignItems: "center", gap: "8px" }}>
                 <Save size={16} /> Save Profile
               </button>
            </div>
          )}
        </motion.div>

        {/* ─── Academic & Skills Section ──────────────────────────────────────── */}
        <motion.div
          className="form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="form-header">
            <Book size={20} />
            <h3>Skills & Keywords</h3>
          </div>
          <div className="edit-grid">
            <div className="edit-field edit-field-full">
              <label><Briefcase size={16} /> Skills (comma separated)</label>
              <div className="edit-input-wrapper">
                <input type="text" {...register("skills")} placeholder="e.g. React, Node.js, Spring Boot" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Social Connectivity Section ────────────────────────────────────── */}
        <motion.div
          className="form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="form-header">
            <Globe size={20} />
            <h3>Social Connectivity</h3>
          </div>
          <div className="edit-grid">
            <div className="edit-field">
              <label><Github size={16} /> GitHub Profile</label>
              <div className="edit-input-wrapper">
                <input type="url" {...register("githubUrl")} placeholder="https://github.com/your-profile" />
              </div>
              {errors.githubUrl && <span className="error">{errors.githubUrl.message}</span>}
            </div>

            <div className="edit-field">
              <label><Linkedin size={16} /> LinkedIn Profile</label>
              <div className="edit-input-wrapper">
                <input type="url" {...register("linkedinUrl")} placeholder="https://linkedin.com/in/your-profile" />
              </div>
              {errors.linkedinUrl && <span className="error">{errors.linkedinUrl.message}</span>}
            </div>

            <div className="edit-field edit-field-full">
              <label><Globe size={16} /> Personal Website / Portfolio</label>
              <div className="edit-input-wrapper">
                <input type="url" {...register("websiteUrl")} placeholder="https://yourwebsite.com" />
              </div>
              {errors.websiteUrl && <span className="error">{errors.websiteUrl.message}</span>}
            </div>
          </div>
        </motion.div>

        {/* Sticky Action Footer */}
        <div className="edit-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary btn-save"
            disabled={isSubmitting || (isUploading && !isDirty)}
          >
            {isSubmitting ? "Updating..." : "Save Changes"}
            <Save size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
