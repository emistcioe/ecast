import { useEffect, useState } from "react";
import Router from "next/router";
import NavBar from "@/components/nav";
import Sidebar from "@/components/Sidebar";
import ProfileEditModal from "@/components/ProfileEditModal";
import Footer from "@/components/footar";
import { useNotices } from "@/lib/hooks/notices";
import { useBlogs } from "@/lib/hooks/blogs";
import { useProjects } from "@/lib/hooks/projects";
import { useEvents } from "@/lib/hooks/events";
import { useTasks } from "@/lib/hooks/tasks";
import { useGallery } from "@/lib/hooks/gallery";
import { useResearch } from "@/lib/hooks/research";
import MySubmissions from "@/components/MySubmissions";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";
import CreateNoticeModal from "@/components/modals/CreateNoticeModal";
import CreateBlogModal from "@/components/modals/CreateBlogModal";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import CreateEventModal from "@/components/modals/CreateEventModal";
import CreateGalleryModal from "@/components/modals/CreateGalleryModal";
import LagAdminSection from "@/components/lag/LagAdminSection";
import LagVerificationSection from "@/components/lag/LagVerificationSection";
// Section Components
import OverviewSection from "@/components/dashboard-member/sections/OverviewSection";
import NoticesSection from "@/components/dashboard-member/sections/NoticesSection";
import BlogsSection from "@/components/dashboard-member/sections/BlogsSection";
import ProjectsSection from "@/components/dashboard-member/sections/ProjectsSection";
import EventsSection from "@/components/dashboard-member/sections/EventsSection";
import GallerySection from "@/components/dashboard-member/sections/GallerySection";
import ResearchSection from "@/components/dashboard-member/sections/ResearchSection";
// Modals
import CreateResearchModal from "@/components/dashboard-member/modals/CreateResearchModal";
import EditResearchModal from "@/components/dashboard-member/modals/EditResearchModal";
import EditProjectModal from "@/components/dashboard-member/modals/EditProjectModal";
import {
  BellIcon,
  DocumentTextIcon,
  FolderIcon,
  CalendarIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  PaperAirplaneIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  LinkIcon,
  GlobeAltIcon,
  MapPinIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  FolderIcon as FolderIconSolid,
  CalendarIcon as CalendarIconSolid,
} from "@heroicons/react/24/solid";

const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const isImagePath = (p?: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(p || "");

type Notice = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  audience: string;
  published_by_username: string;
};

// TaskCard component for expandable task display
function TaskCard({ task, onSubmit }: { task: any; onSubmit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const formattedDate = dueDate
    ? dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No deadline";

  return (
    <div className="group bg-gradient-to-r from-gray-900/60 to-gray-800/60 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h4 className="font-semibold text-lg text-white group-hover:text-blue-300 transition-colors">
                {task.title}
              </h4>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  task.status === "COMPLETED"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : task.status === "SUBMITTED"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {task.status || "OPEN"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                <span className={isOverdue ? "text-red-400 font-semibold" : ""}>
                  Due: {formattedDate}
                  {isOverdue && " (Overdue!)"}
                </span>
              </div>
            </div>
            {task.description && (
              <div className="mt-2">
                <p
                  className={`text-sm text-gray-300 leading-relaxed transition-all duration-300 ${
                    expanded ? "" : "line-clamp-2"
                  }`}
                >
                  {task.description}
                </p>
                {task.description.length > 100 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1.5 font-medium flex items-center gap-1"
                  >
                    {expanded ? (
                      <>
                        <span>Show less</span>
                        <span className="text-lg leading-none">↑</span>
                      </>
                    ) : (
                      <>
                        <span>Read more</span>
                        <span className="text-lg leading-none">↓</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg font-medium transition-all duration-300 hover:scale-105 border border-blue-500/30 whitespace-nowrap flex items-center gap-1.5"
          >
            Submit <span className="text-lg leading-none">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MemberDashboard() {
  const [authReady, setAuthReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Collapse sidebar on small screens for better mobile responsiveness
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarUser, setSidebarUser] = useState<{
    name: string;
    role?: string;
    committee_position?: string;
    avatarUrl?: string;
  }>();
  const lagApproverPositions = [
    "President",
    "Vice President",
    "Secretary",
    "Secretary/Treasurer",
  ];
  const canLagApprove = lagApproverPositions.includes(
    sidebarUser?.committee_position || ""
  );
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [notices, setNotices] = useState<Notice[]>([]);
  const toast = useToast();
  const {
    create: createNoticeApi,
    list: listNotices,
    update: updateNotice,
    remove: deleteNotice,
  } = useNotices();
  const {
    create: createBlogApi,
    list: listBlogs,
    update: updateBlog,
    remove: deleteBlog,
  } = useBlogs();
  const {
    create: createProjectApi,
    list: listProjects,
    update: updateProject,
    remove: deleteProject,
  } = useProjects();
  const {
    create: createEventApi,
    list: listEvents,
    update: updateEvent,
    remove: deleteEvent,
  } = useEvents();
  const {
    create: createGalleryApi,
    list: listGallery,
    remove: deleteGallery,
  } = useGallery();
  const {
    create: createResearchApi,
    list: listResearch,
    update: updateResearch,
    remove: deleteResearch,
  } = useResearch();
  const { listAssigned, submit } = useTasks();
  const [role, setRole] = useState<string | null>(null);
  const [nTitle, setNTitle] = useState("");
  const [nContent, setNContent] = useState("");
  const [nAudience, setNAudience] = useState("ALL");
  const [nFile, setNFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [myNotices, setMyNotices] = useState<any[]>([]);
  const [myBlogs, setMyBlogs] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [myGallery, setMyGallery] = useState<any[]>([]);
  const [myResearch, setMyResearch] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Blog
  const [bTitle, setBTitle] = useState("");
  const [bDesc, setBDesc] = useState("");
  const [bContent, setBContent] = useState("");
  const [bCover, setBCover] = useState<File | null>(null);

  // Project
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pRepo, setPRepo] = useState("");
  const [pLive, setPLive] = useState("");
  const [pImage, setPImage] = useState<File | null>(null);

  // Event
  const [eTitle, setETitle] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eDate, setEDate] = useState("");
  const [eTime, setETime] = useState("");
  const [eLoc, setELoc] = useState("");
  const [eImage, setEImage] = useState<File | null>(null);
  // Tasks
  const [tasks, setTasks] = useState<any[]>([]);
  const [subMsg, setSubMsg] = useState("");
  const [selTask, setSelTask] = useState("");
  const [subText, setSubText] = useState("");
  const [subFile, setSubFile] = useState<File | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const access = localStorage.getItem("access");
    const urole = userStr ? JSON.parse(userStr)?.role : null;

    if (!access || urole !== "MEMBER") {
      Router.replace("/login");
    } else {
      setAuthReady(true);
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          const raw = u.user_photo || u.committee_member_photo || "";
          const avatar = raw
            ? raw.startsWith("http")
              ? raw
              : `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}${raw}`
            : undefined;
          setSidebarUser({
            name: u.full_name || u.username,
            role: u.role,
            committee_position: u.committee_position,
            avatarUrl: avatar,
          });
          setRole(u.role || null);
        } catch {}
      }
      // Fetch both ALL and MEMBERS notices for feed (deduped)
      const normalize = (data: any): any[] => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray((data as any).results))
          return (data as any).results;
        return [];
      };
      Promise.all([
        listNotices({ audience: "ALL" }),
        listNotices({ audience: "MEMBERS" }),
      ])
        .then(([allData, memberData]) => {
          const merged = [...normalize(allData), ...normalize(memberData)];
          const seen = new Set<string>();
          const unique = merged.filter((n: any) => {
            const key = String(n.id || n.uuid || n.slug || JSON.stringify(n));
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setNotices(unique);
        })
        .catch(() => {});
      // Fetch my own items for CRUD
      listNotices({ mine: "1" })
        .then(setMyNotices)
        .catch(() => {});
      listBlogs({ mine: "1" })
        .then(setMyBlogs)
        .catch(() => {});
      listProjects({ mine: "1" })
        .then(setMyProjects)
        .catch(() => {});
      listEvents({ mine: "1" })
        .then(setMyEvents)
        .catch(() => {});
      listGallery({ mine: "1" })
        .then(setMyGallery)
        .catch(() => {});
      listResearch({ mine: "1" })
        .then(setMyResearch)
        .catch(() => {});
      listAssigned()
        .then((data: any[]) => {
          // Filter to show only OPEN tasks (backend should handle this, but just in case)
          const openTasks = Array.isArray(data)
            ? data.filter((t: any) => t.status !== "CLOSED")
            : [];
          setTasks(openTasks);
        })
        .catch(() => {});
    }
  }, []);

  // Clear messages when switching sections
  useEffect(() => {
    setMsg("");
    setSubMsg("");
  }, [activeSection]);

  // Note: Do not early-return before all hooks run.
  // We gate rendering later to keep hooks order consistent across renders.

  const sorted = [...notices].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const createNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("title", nTitle);
      form.append("content", nContent);
      form.append("audience", nAudience);
      if (nFile) form.append("attachment", nFile);
      await createNoticeApi(form);
      setMsg("Notice submitted for approval");
      setNTitle("");
      setNContent("");
      setNAudience("ALL");
      setNFile(null);
      // Refresh the list immediately
      listNotices({ mine: "1" }).then(setMyNotices);
    } catch {
      setMsg("Failed to submit notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setIsSubmitting(true);
    const form = new FormData();
    form.append("title", bTitle);
    form.append("description", bDesc);
    form.append("content", bContent);
    if (bCover) form.append("cover_image", bCover);
    try {
      await createBlogApi(form);
      setMsg("Blog submitted for approval");
      setBTitle("");
      setBDesc("");
      setBContent("");
      setBCover(null);
      // Refresh the list immediately
      listBlogs({ mine: "1" }).then(setMyBlogs);
    } catch {
      setMsg("Failed to submit blog");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setIsSubmitting(true);
    const form = new FormData();
    form.append("title", pTitle);
    form.append("description", pDesc);
    form.append("repo_link", pRepo);
    if (pLive) form.append("live_link", pLive);
    if (pImage) form.append("image", pImage);
    try {
      await createProjectApi(form);
      setMsg("Project submitted for approval");
      setPTitle("");
      setPDesc("");
      setPRepo("");
      setPLive("");
      setPImage(null);
    } catch {
      setMsg("Failed to submit project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setIsSubmitting(true);
    const form = new FormData();
    form.append("title", eTitle);
    form.append("description", eDesc);
    form.append("date", eDate);
    form.append("time", eTime);
    form.append("location", eLoc);
    form.append("image", eImage as any);
    form.append("registration_required", "false");
    form.append("coming_soon", "false");
    form.append("contact_email", "info@example.com");
    try {
      await createEventApi(form);
      setMsg("Event submitted for approval");
      setETitle("");
      setEDesc("");
      setEDate("");
      setETime("");
      setELoc("");
      setEImage(null);
    } catch {
      setMsg("Failed to submit event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSave = async (data: {
    email?: string;
    phone_number?: string;
    linkedin_url?: string;
    github_url?: string;
    alumni_workplace?: string;
    photo?: File;
  }) => {
    const formData = new FormData();

    // Add all the fields to FormData
    if (data.email) formData.append("email", data.email);
    if (data.phone_number) formData.append("phone_number", data.phone_number);
    if (data.linkedin_url) formData.append("linkedin_url", data.linkedin_url);
    if (data.github_url) formData.append("github_url", data.github_url);
    if (data.alumni_workplace)
      formData.append("alumni_workplace", data.alumni_workplace);
    if (data.photo) formData.append("photo", data.photo);

    const access = localStorage.getItem("access");
    const response = await fetch(`${base}/api/auth/me/profile/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${access}` },
      body: formData,
    });

    if (!response.ok) throw new Error("Update failed");

    const updated = await response.json();
    const raw = updated.user_photo || updated.committee_member_photo || "";
    const avatar = raw
      ? raw.startsWith("http")
        ? raw
        : `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}${raw}`
      : undefined;
    // Update sidebar user
    setSidebarUser({
      name: updated.full_name || updated.username,
      role: updated.role,
      committee_position: updated.committee_position,
      avatarUrl: avatar,
    });
    // Update localStorage with all updated fields
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      Object.assign(user, updated);
      localStorage.setItem("user", JSON.stringify(user));
    }

    toast.success("Profile updated successfully!");
  };

  const handleProfileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);

    const access = localStorage.getItem("access");
    const response = await fetch(`${base}/api/auth/me/profile/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${access}` },
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");

    const updated = await response.json();
    const raw = updated.user_photo || updated.committee_member_photo || "";
    const avatar = raw
      ? raw.startsWith("http")
        ? raw
        : `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}${raw}`
      : undefined;
    // Update sidebar user
    setSidebarUser((prev) => ({
      ...prev!,
      avatarUrl: avatar,
    }));
    // Update localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      user.user_photo = updated.user_photo;
      user.committee_member_photo = updated.committee_member_photo;
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  const canEditOrDeleteNotice = (n: any) => n.status !== "APPROVED";
  const canEditOrDeleteBlog = (b: any) => b.status !== "APPROVED";

  // Modal states
  const [showCreateNoticeModal, setShowCreateNoticeModal] = useState(false);
  const [showCreateBlogModal, setShowCreateBlogModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateGalleryModal, setShowCreateGalleryModal] = useState(false);
  const [showCreateResearchModal, setShowCreateResearchModal] = useState(false);
  const [showEditResearchModal, setShowEditResearchModal] = useState(false);
  const [editingResearch, setEditingResearch] = useState<any>(null);

  const menuItems = [
    { id: "overview", name: "Overview", icon: HomeIcon },
    { id: "notices", name: "My Notices", icon: BellIcon },
    { id: "blogs", name: "My Blogs", icon: DocumentTextIcon },
    { id: "research", name: "My Research", icon: DocumentTextIcon },
    { id: "projects", name: "My Projects", icon: FolderIcon },
    { id: "events", name: "My Events", icon: CalendarIcon },
    { id: "gallery", name: "My Gallery", icon: PhotoIcon },
    { id: "submit", name: "Submit Task", icon: PaperAirplaneIcon },
    { id: "submissions", name: "My Submissions", icon: DocumentTextIcon },
  ];

  // Initialize sidebar collapsed state based on viewport width (mobile first)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const preferCollapsed = window.innerWidth < 1024; // < lg
      setSidebarCollapsed(preferCollapsed);
    }
  }, []);

  if (!authReady)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Loading Dashboard
          </h2>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <NavBar />
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen w-full overflow-x-hidden">
        {/* Mobile Menu Button */}
        <div className="md:hidden fixed top-20 left-4 z-50">
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setSidebarCollapsed((v) => !v);
            }}
            className="bg-gray-800 p-3 rounded-lg shadow-lg hover:bg-gray-700 transition"
          >
            {sidebarOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Sidebar */}
        <Sidebar
          expanded={!sidebarCollapsed}
          setExpanded={(v) => setSidebarCollapsed(!v)}
          user={sidebarUser}
          onProfileClick={() => setShowProfileModal(true)}
          groups={[
            {
              title: "Main Menu",
              items: [
                {
                  id: "overview",
                  label: "Overview",
                  icon: HomeIcon as any,
                  active: activeSection === "overview",
                  onClick: () => setActiveSection("overview"),
                },
                {
                  id: "notices",
                  label: "My Notices",
                  icon: BellIcon as any,
                  active: activeSection === "notices",
                  onClick: () => setActiveSection("notices"),
                },
                {
                  id: "blog",
                  label: "My Blogs",
                  icon: DocumentTextIcon as any,
                  active: activeSection === "blog",
                  onClick: () => setActiveSection("blog"),
                },
                {
                  id: "project",
                  label: "My Projects",
                  icon: FolderIcon as any,
                  active: activeSection === "project",
                  onClick: () => setActiveSection("project"),
                },
                {
                  id: "event",
                  label: "My Events",
                  icon: CalendarIcon as any,
                  active: activeSection === "event",
                  onClick: () => setActiveSection("event"),
                },
                {
                  id: "gallery",
                  label: "My Gallery",
                  icon: PhotoIcon as any,
                  active: activeSection === "gallery",
                  onClick: () => setActiveSection("gallery"),
                },
                {
                  id: "research",
                  label: "My Research",
                  icon: DocumentTextIcon as any,
                  active: activeSection === "research",
                  onClick: () => setActiveSection("research"),
                },
                {
                  id: "submit",
                  label: "Submit Task",
                  icon: PaperAirplaneIcon as any,
                  active: activeSection === "submit",
                  onClick: () => setActiveSection("submit"),
                },
                {
                  id: "submissions",
                  label: "My Submissions",
                  icon: DocumentTextIcon as any,
                  active: activeSection === "submissions",
                  onClick: () => setActiveSection("submissions"),
                },
              ],
            },
            {
              title: "LAG",
              items: [
                ...(canLagApprove
                  ? [
                      {
                        id: "lag-admin",
                        label: "LAG Approvals",
                        icon: ClipboardDocumentCheckIcon as any,
                        active: activeSection === "lag-admin",
                        onClick: () => setActiveSection("lag-admin"),
                      },
                    ]
                  : []),
                {
                  id: "lag-verify",
                  label: "LAG Verification",
                  icon: CheckCircleIcon as any,
                  active: activeSection === "lag-verify",
                  onClick: () => setActiveSection("lag-verify"),
                },
              ],
            },
          ]}
        />

        {/* Mobile overlay when sidebar is open */}
        {!sidebarCollapsed && (
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => {
              setSidebarCollapsed(true);
              setSidebarOpen(false);
            }}
          />
        )}

        {/* Profile Edit Modal */}
        <ProfileEditModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSave={handleProfileSave}
          currentImage={sidebarUser?.avatarUrl}
          userName={sidebarUser?.name || ""}
          userEmail={(() => {
            const userStr = localStorage.getItem("user");
            return userStr ? JSON.parse(userStr).email || "" : "";
          })()}
          userRole={role || ""}
          userPhoneNumber={(() => {
            const userStr = localStorage.getItem("user");
            return userStr ? JSON.parse(userStr).phone_number || "" : "";
          })()}
          userLinkedIn={(() => {
            const userStr = localStorage.getItem("user");
            return userStr ? JSON.parse(userStr).linkedin_url || "" : "";
          })()}
          userGitHub={(() => {
            const userStr = localStorage.getItem("user");
            return userStr ? JSON.parse(userStr).github_url || "" : "";
          })()}
          userAlumniWorkplace={(() => {
            const userStr = localStorage.getItem("user");
            return userStr ? JSON.parse(userStr).alumni_workplace || "" : "";
          })()}
        />

        {/* Main Content */}
        <div
          className={`${
            sidebarCollapsed ? "md:ml-20" : "md:ml-64"
          } ml-0 p-4 md:p-6 pt-24 transition-all duration-300`}
        >
          {/* Overview Section */}
          {activeSection === "overview" && (
            <OverviewSection
              tasks={tasks}
              notices={notices}
              blogs={myBlogs}
              projects={myProjects}
              events={myEvents}
              research={myResearch}
              onNavigate={setActiveSection}
              onTaskSelect={setSelTask}
            />
          )}

          {/* Submit Task Section */}
          {activeSection === "submit" && (
            <div className="max-w-3xl mx-auto animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-3 flex items-center gap-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <PaperAirplaneIcon className="w-7 h-7 text-white" />
                  </div>
                  Submit Task
                </h1>
                <p className="text-gray-400 text-sm">
                  Complete your assigned tasks
                </p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selTask) {
                    setSubMsg("Please select a task.");
                    return;
                  }
                  if (!subText.trim() && !subFile) {
                    setSubMsg("Please add notes or attach a file.");
                    return;
                  }
                  setIsSubmitting(true);
                  const form = new FormData();
                  form.append("task", selTask);
                  form.append("content", subText);
                  if (subFile) form.append("attachment", subFile);
                  try {
                    await submit(form);
                    setSubMsg("Submitted for review");
                    setSelTask("");
                    setSubText("");
                    setSubFile(null);
                  } catch (err: any) {
                    setSubMsg(
                      `Submission failed${
                        err?.message ? ": " + err.message : ""
                      }`
                    );
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-900/60 backdrop-blur-xl p-10 rounded-3xl border border-gray-700/50 shadow-2xl space-y-6"
              >
                {subMsg && (
                  <div
                    className={`p-5 rounded-2xl font-medium text-sm flex items-center gap-3 ${
                      subMsg.includes("fail")
                        ? "bg-red-900/30 border border-red-500/50 text-red-300"
                        : "bg-green-900/30 border border-green-500/50 text-green-300"
                    }`}
                  >
                    {subMsg.includes("fail") ? (
                      <XCircleIcon className="w-6 h-6" />
                    ) : (
                      <CheckCircleIcon className="w-6 h-6" />
                    )}
                    {subMsg}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-300 flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-400" />
                    Select Task
                  </label>
                  <select
                    className="w-full p-4 bg-gray-900/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-500/50 font-medium"
                    value={selTask}
                    onChange={(e) => setSelTask(e.target.value)}
                    required
                  >
                    <option value="">Choose a task to submit...</option>
                    {tasks
                      .filter((t: any) => t.status !== "CLOSED")
                      .map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-300 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                    Submission Notes
                  </label>
                  <textarea
                    className="w-full p-4 bg-gray-900/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-500/50 resize-none text-sm font-medium"
                    rows={5}
                    placeholder="Add details about your submission, challenges faced, or any notes for reviewers..."
                    value={subText}
                    onChange={(e) => setSubText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-300 flex items-center gap-2">
                    <ArrowUpTrayIcon className="w-5 h-5 text-blue-400" />
                    Attachment{" "}
                    {subFile && (
                      <span className="text-green-400 text-xs">
                        ({subFile.name})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      key={subFile ? "has-subfile" : "no-subfile"}
                      type="file"
                      onChange={(e) => setSubFile(e.target.files?.[0] || null)}
                      className="w-full p-4 bg-gray-900/80 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500/50 transition-all duration-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-cyan-600 file:text-white file:font-semibold hover:file:from-blue-700 hover:file:to-cyan-700 file:shadow-lg file:transition-all cursor-pointer"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 p-5 rounded-xl font-bold text-base shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      Submit Task
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* My Submissions */}
          {activeSection === "submissions" && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  My Submissions
                </h1>
                <p className="text-gray-400 text-sm">
                  Track all your submissions and their status
                </p>
              </div>
              <MySubmissions role={"MEMBER"} showTasks={true} />
            </div>
          )}

          {/* My Notices Section */}
          {activeSection === "notices" && (
            <NoticesSection
              myNotices={myNotices}
              isSubmitting={isSubmitting}
              canEditOrDeleteNotice={canEditOrDeleteNotice}
              onCreateClick={() => setShowCreateNoticeModal(true)}
              onUpdate={updateNotice}
              onDelete={deleteNotice}
              onRefresh={() => listNotices({ mine: "1" }).then(setMyNotices)}
            />
          )}

          {/* My Blogs Section */}
          {activeSection === "blog" && (
            <BlogsSection
              myBlogs={myBlogs}
              isSubmitting={isSubmitting}
              canEditOrDeleteBlog={canEditOrDeleteBlog}
              onCreateClick={() => setShowCreateBlogModal(true)}
              onUpdate={updateBlog}
              onDelete={deleteBlog}
              onRefresh={() => listBlogs({ mine: "1" }).then(setMyBlogs)}
            />
          )}

          {/* My Projects Section */}
          {activeSection === "project" && (
            <ProjectsSection
              myProjects={myProjects}
              onCreateClick={() => setShowCreateProjectModal(true)}
              onEditClick={(project) => {
                setEditingProject(project);
                setShowEditProjectModal(true);
              }}
              onDeleteClick={async (projectId: string) => {
                try {
                  await deleteProject(projectId);
                  toast.success("Project deleted successfully!");
                  listProjects({ mine: "1" }).then(setMyProjects);
                } catch (error) {
                  console.error("Project deletion error:", error);
                  toast.error("Failed to delete project");
                }
              }}
            />
          )}

          {/* My Events Section */}
          {activeSection === "event" && (
            <EventsSection
              myEvents={myEvents}
              onCreateClick={() => setShowCreateEventModal(true)}
              onUpdate={updateEvent}
              onDelete={async (slug: string) => {
                await deleteEvent(slug);
              }}
              onRefresh={() => listEvents({ mine: "1" }).then(setMyEvents)}
            />
          )}

          {/* My Gallery Section */}
          {activeSection === "gallery" && (
            <GallerySection
              myGallery={myGallery}
              onCreateClick={() => setShowCreateGalleryModal(true)}
              onDelete={async (id) => {
                await deleteGallery(id);
              }}
              onRefresh={() => listGallery({ mine: "1" }).then(setMyGallery)}
            />
          )}

          {/* My Research Section */}
          {activeSection === "research" && (
            <ResearchSection
              myResearch={myResearch}
              onCreateClick={() => setShowCreateResearchModal(true)}
              onEditClick={(research) => {
                setEditingResearch(research);
                setShowEditResearchModal(true);
              }}
              onDeleteClick={async (slug: string) => {
                try {
                  await deleteResearch(slug);
                  toast.success("Research paper deleted successfully");
                  listResearch({ mine: "1" }).then(setMyResearch);
                } catch (error) {
                  toast.error("Failed to delete research paper");
                }
              }}
            />
          )}

          {activeSection === "lag-admin" && canLagApprove && (
            <LagAdminSection />
          )}

          {activeSection === "lag-verify" && <LagVerificationSection />}
        </div>

        {/* Modals - Placed at root level for global accessibility */}
        <CreateNoticeModal
          isOpen={showCreateNoticeModal}
          onClose={() => setShowCreateNoticeModal(false)}
          onSubmit={async (data) => {
            const form = new FormData();
            form.append("title", data.title);
            form.append("content", data.content);
            form.append("audience", data.audience);
            if (data.flyer) form.append("flyer", data.flyer);
            if (data.document) form.append("document", data.document);

            await createNoticeApi(form);
            toast.success("Notice submitted for review successfully!");
            listNotices({ mine: "1" }).then(setMyNotices);
          }}
        />

        <CreateBlogModal
          isOpen={showCreateBlogModal}
          onClose={() => setShowCreateBlogModal(false)}
          onSubmit={async (data) => {
            const form = new FormData();
            form.append("title", data.title);
            form.append("description", data.description);
            form.append("content", data.content);
            if (data.coverImage) form.append("cover_image", data.coverImage);

            await createBlogApi(form);
            toast.success("Blog submitted for review successfully!");
            listBlogs({ mine: "1" }).then(setMyBlogs);
          }}
        />

        <CreateProjectModal
          isOpen={showCreateProjectModal}
          onClose={() => setShowCreateProjectModal(false)}
          onSubmit={async (data) => {
            try {
              const form = new FormData();
              form.append("title", data.title.trim());
              form.append("description", data.description.trim());
              if (data.repo_link && data.repo_link.trim()) {
                form.append("repo_link", data.repo_link.trim());
              }
              if (data.live_link && data.live_link.trim()) {
                form.append("live_link", data.live_link.trim());
              }
              if (data.image) form.append("image", data.image);

              await createProjectApi(form);
              toast.success("Project submitted for review successfully!");
              listProjects({ mine: "1" }).then(setMyProjects);
              setShowCreateProjectModal(false);
            } catch (error) {
              console.error("Project creation error:", error);
              toast.error(
                "Failed to create project. Please check your inputs."
              );
              throw error;
            }
          }}
        />

        <EditProjectModal
          project={editingProject}
          isOpen={showEditProjectModal}
          onClose={() => {
            setShowEditProjectModal(false);
            setEditingProject(null);
          }}
          onSave={async (formData) => {
            try {
              await updateProject(editingProject.id, formData);
              toast.success("Project updated successfully!");
              listProjects({ mine: "1" }).then(setMyProjects);
              setShowEditProjectModal(false);
              setEditingProject(null);
            } catch (error) {
              console.error("Project update error:", error);
              toast.error("Failed to update project");
              throw error;
            }
          }}
        />

        <CreateEventModal
          isOpen={showCreateEventModal}
          onClose={() => setShowCreateEventModal(false)}
          onSubmit={async (data) => {
            const form = new FormData();
            form.append("title", data.title);
            form.append("description", data.description);
            form.append("date", data.date);
            if (data.end_date) form.append("end_date", data.end_date);
            if (data.time) form.append("time", data.time);
            form.append("location", data.location);
            form.append("contact_email", data.contact_email);
            form.append("coming_soon", String(data.coming_soon));
            if (data.form_link) form.append("form_link", data.form_link);
            if (data.image) form.append("image", data.image);

            await createEventApi(form);
            toast.success("Event submitted for review successfully!");
            listEvents({ mine: "1" }).then(setMyEvents);
          }}
        />

        <CreateGalleryModal
          isOpen={showCreateGalleryModal}
          onClose={() => setShowCreateGalleryModal(false)}
          onSubmit={async (formData) => {
            await createGalleryApi(formData);
            toast.success(
              "Image uploaded successfully! It will be reviewed by admins."
            );
            listGallery({ mine: "1" }).then(setMyGallery);
          }}
        />

        <CreateResearchModal
          isOpen={showCreateResearchModal}
          onClose={() => setShowCreateResearchModal(false)}
          onSubmit={async (formData) => {
            await createResearchApi(formData);
            toast.success("Research paper submitted for review successfully!");
            listResearch({ mine: "1" }).then(setMyResearch);
          }}
        />

        <EditResearchModal
          isOpen={showEditResearchModal}
          onClose={() => {
            setShowEditResearchModal(false);
            setEditingResearch(null);
          }}
          research={editingResearch}
          onSubmit={async (slug, data) => {
            await updateResearch(slug, data);
            toast.success("Research paper updated successfully!");
            listResearch({ mine: "1" }).then(setMyResearch);
          }}
        />
      </div>
      <Footer />
    </>
  );
}
