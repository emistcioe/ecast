import { useEffect, useState } from "react";
import Router from "next/router";
import NavBar from "@/components/nav";
import Sidebar, { SidebarGroup } from "@/components/Sidebar";
import ProfileEditModal from "@/components/ProfileEditModal";
import Footer from "@/components/footar";
import { useBlogs } from "@/lib/hooks/blogs";
import { useNotices } from "@/lib/hooks/notices";
import { useAdmin } from "@/lib/hooks/admin";
import { useEvents } from "@/lib/hooks/events";
import { useTasks } from "@/lib/hooks/tasks";
import { useProjects } from "@/lib/hooks/projects";
import { useUsers } from "@/lib/hooks/users";
import { useIntake, IntakeStatus } from "@/lib/hooks/intake";
import { useAmbassadorIntake } from "@/lib/hooks/ambassadorIntake";
import { useResearch } from "@/lib/hooks/research";
import { authedFetch } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";
import AdminNoticesCrud from "@/components/admin/NoticesCrud";
import AdminBlogsCrud from "@/components/admin/BlogsCrud";
import AdminEventsCrud from "@/components/admin/EventsCrud";
import AdminProjectsCrud from "@/components/admin/ProjectsCrud";
import AdminGalleryCrud from "@/components/admin/GalleryCrud";
import ResearchSection from "@/components/dashboard-member/sections/ResearchSection";
import CreateResearchModal from "@/components/dashboard-member/modals/CreateResearchModal";
import EditResearchModal from "@/components/dashboard-member/modals/EditResearchModal";

import { ComprehensiveAnalyticsDashboard } from "@/components/analytics/ComprehensiveAnalyticsDashboard";
import { ChartCard } from "@/components/analytics/Charts";

import {
  BellIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  HomeIcon,
  TrophyIcon,
  PlusCircleIcon,
  CalendarIcon,
  FolderIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  UserPlusIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function AdminDashboard() {
  const [authReady, setAuthReady] = useState(false);
  // Collapse sidebar by default on small screens to improve mobile UX
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarUser, setSidebarUser] = useState<{
    name: string;
    role?: string;
    avatarUrl?: string;
    position?: string;
  }>();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const toast = useToast();
  const { fetchStatus, updateStatus, fetchInfo } = useIntake();
  const {
    fetchStatus: fetchAmbStatus,
    updateStatus: updateAmbStatus,
  } = useAmbassadorIntake();

  const [tasks, setTasks] = useState<any[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [alumniLeaderboard, setAlumniLeaderboard] = useState<any[]>([]);
  const [ambassadorsLeaderboard, setAmbassadorsLeaderboard] = useState<any[]>(
    []
  );
  const [leaderboardTab, setLeaderboardTab] = useState<
    "alumni" | "ambassadors"
  >("ambassadors");
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);

  // Intake status state
  const [intakeStatus, setIntakeStatus] = useState<IntakeStatus | null>(null);
  const [isTogglingIntake, setIsTogglingIntake] = useState(false);
  const [showIntakeDialog, setShowIntakeDialog] = useState(false);
  const [intakeStartDate, setIntakeStartDate] = useState("");
  const [intakeEndDate, setIntakeEndDate] = useState("");
  const [createNewBatch, setCreateNewBatch] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  // Ambassador intake status state
  const [ambIntakeStatus, setAmbIntakeStatus] = useState<IntakeStatus | null>(
    null
  );
  const [isTogglingAmbIntake, setIsTogglingAmbIntake] = useState(false);
  const [showAmbIntakeDialog, setShowAmbIntakeDialog] = useState(false);
  const [ambIntakeStartDate, setAmbIntakeStartDate] = useState("");
  const [ambIntakeEndDate, setAmbIntakeEndDate] = useState("");

  // Task form
  const [assignees, setAssignees] = useState<any[]>([]);
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tAssignee, setTAssignee] = useState("");
  const [tDue, setTDue] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskMsg, setTaskMsg] = useState("");

  // Moderation lists (for overview counts only)
  const [pendingBlogs, setPendingBlogs] = useState<any[]>([]);
  const [pendingNotices, setPendingNotices] = useState<any[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [pendingResearch, setPendingResearch] = useState<any[]>([]);
  const [pendingSubs, setPendingSubs] = useState<any[]>([]);
  const [previewSub, setPreviewSub] = useState<any | null>(null);

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const { list: listBlogs } = useBlogs();
  const { list: listNotices } = useNotices();
  const { list: listEvents } = useEvents();
  const { list: listProjects } = useProjects();
  const { list: listResearch } = useResearch();
  const tasksApi = useTasks();
  const {
    listUsers,
    pendingSubmissions: pendingSubsApi,
    reviewSubmission: reviewApi,
    createTask: createTaskApi,
  } = useAdmin();
  const usersApi = useUsers();

  // Create user form state for UsersCrud
  const [cmUsername, setCmUsername] = useState("");
  const [cmEmail, setCmEmail] = useState("");
  const [cmFirst, setCmFirst] = useState("");
  const [cmLast, setCmLast] = useState("");
  const [cmPhone, setCmPhone] = useState("");
  const [cmRole, setCmRole] = useState<
    "MEMBER" | "AMBASSADOR" | "ALUMNI" | "ADMIN"
  >("MEMBER");
  const [cmPosition, setCmPosition] = useState("");
  const [cmStart, setCmStart] = useState("");
  const [cmTenure, setCmTenure] = useState<number | "">("");
  const [cmPhoto, setCmPhoto] = useState("");
  const [cmPhotoFile, setCmPhotoFile] = useState<File | null>(null);
  const [cmLinkedIn, setCmLinkedIn] = useState("");
  const [cmGithub, setCmGithub] = useState("");
  const [cmAmbYear, setCmAmbYear] = useState<string>("");
  const [cmAlumYear, setCmAlumYear] = useState<string>("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userMsg, setUserMsg] = useState("");

  // Research states
  const [myResearch, setMyResearch] = useState<any[]>([]);
  const [showCreateResearchModal, setShowCreateResearchModal] = useState(false);
  const [showEditResearchModal, setShowEditResearchModal] = useState(false);
  const [showDeleteResearchModal, setShowDeleteResearchModal] = useState(false);
  const [editingResearch, setEditingResearch] = useState<any>(null);
  const [deletingResearch, setDeletingResearch] = useState<any>(null);
  const researchApi = useResearch();

  // Initialize sidebar collapsed state based on viewport width (mobile first)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const preferCollapsed = window.innerWidth < 1024; // < lg
      setSidebarCollapsed(preferCollapsed);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const access = localStorage.getItem("access");
    const urole = userStr ? JSON.parse(userStr)?.role : null;
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
          avatarUrl: avatar,
          position:
            u.committee_position ||
            (u.committee && u.committee.position) ||
            undefined,
        });
        setRole(u.role || null);
      } catch {}
    }
    if (!access || urole !== "ADMIN") {
      Router.replace("/login");
    } else {
      setAuthReady(true);
      Promise.all([listUsers("AMBASSADOR"), listUsers("MEMBER")])
        .then(([amb, mem]) => setAssignees([...(amb || []), ...(mem || [])]))
        .catch(() => {});
      listBlogs({ status: "PENDING" })
        .then(setPendingBlogs)
        .catch(() => {});
      listBlogs()
        .then((all: any[]) => setLatestBlogs((all || []).slice(0, 3)))
        .catch(() => {});
      listNotices({ status: "PENDING" })
        .then(setPendingNotices)
        .catch(() => {});
      listEvents({ status: "PENDING" })
        .then(setPendingEvents)
        .catch(() => {});
      listProjects({ status: "PENDING" })
        .then(setPendingProjects)
        .catch(() => {});
      listResearch({ status: "PENDING" })
        .then(setPendingResearch)
        .catch(() => {});
      pendingSubsApi()
        .then(setPendingSubs)
        .catch(() => {});
      tasksApi
        .listAssigned()
        .then((d: any[]) => setTasks(Array.isArray(d) ? d : []))
        .catch(() => setTasks([]));

      // Load alumni leaderboard (top 5)
      authedFetch(`${base}/api/auth/leaderboard/alumni/`)
        .then((r) => r.json())
        .then((data) => {
          const top5 = Array.isArray(data) ? data.slice(0, 5) : [];
          setAlumniLeaderboard(top5);
        })
        .catch(() => {});

      // Load ambassadors leaderboard (current batch year only)
      const currentBatchYear = parseInt(
        process.env.NEXT_PUBLIC_CURRENT_BATCH_YEAR || "2082",
        10
      );
      authedFetch(`${base}/api/auth/leaderboard/ambassadors/`)
        .then((r) => r.json())
        .then((data) => {
          const currentBatch = Array.isArray(data)
            ? data.filter(
                (user: any) =>
                  user.batch_year_bs === currentBatchYear && user.is_active
              )
            : [];
          setAmbassadorsLeaderboard(currentBatch);
        })
        .catch(() => {});

      // Load analytics data (last 7 days)
      fetchAnalyticsData();

      // Load intake status
      loadIntakeStatus();
      // Load ambassador intake status
      loadAmbIntakeStatus();
    }
  }, []);

  // Auto-assign role based on committee position in create mode (only for committee mode)
  useEffect(() => {
    if (cmPosition === "President" || cmPosition === "Vice President") {
      setCmRole("ADMIN");
    } else if (cmPosition) {
      setCmRole("MEMBER");
    }
  }, [cmPosition]);

  const loadIntakeStatus = async () => {
    try {
      const status = await fetchStatus();
      console.log("Loaded intake status:", status);
      setIntakeStatus(status);

      // Also load batch information
      const info = await fetchInfo();
      setAvailableBatches(info.batches || []);
    } catch (error) {
      console.error("Failed to load intake status:", error);
    }
  };

  const loadAmbIntakeStatus = async () => {
    try {
      const status = await fetchAmbStatus();
      setAmbIntakeStatus(status);
    } catch (error) {
      console.error("Failed to load ambassador intake status:", error);
    }
  };

  const toggleIntakeStatus = async () => {
    if (!intakeStatus) {
      console.log("No intake status available");
      return;
    }

    // If opening, show dialog to collect parameters
    if (!intakeStatus.is_open) {
      console.log("Opening intake dialog...");
      setShowIntakeDialog(true);
      return;
    }

    // If closing, proceed directly
    setIsTogglingIntake(true);
    try {
      const newStatus = await updateStatus(!intakeStatus.is_open);
      setIntakeStatus(newStatus);
      toast.success(
        `Enrollment ${newStatus.is_open ? "opened" : "closed"} successfully!`
      );

      // Reload intake status to ensure we have the latest data
      await loadIntakeStatus();
    } catch (error) {
      console.error("Failed to toggle intake status:", error);
      toast.error("Failed to update enrollment status");
    } finally {
      setIsTogglingIntake(false);
    }
  };

  const handleOpenIntake = async () => {
    if (!intakeStartDate) {
      toast.error("Please set a start date and time");
      return;
    }

    setIsTogglingIntake(true);
    try {
      const params: any = {
        start_datetime: new Date(intakeStartDate).toISOString(),
        create_new_batch: createNewBatch,
      };

      if (intakeEndDate) {
        params.end_datetime = new Date(intakeEndDate).toISOString();
      }

      if (selectedBatches.length > 0) {
        params.available_batches = selectedBatches;
      }

      const newStatus = await updateStatus(true, params);
      setIntakeStatus(newStatus);
      toast.success("Enrollment opened successfully!");
      setShowIntakeDialog(false);
      // Reset form
      setIntakeStartDate("");
      setIntakeEndDate("");
      setCreateNewBatch(false);
      setSelectedBatches([]);

      // Reload intake status to ensure we have the latest data
      await loadIntakeStatus();
    } catch (error) {
      console.error("Failed to open intake:", error);
      toast.error("Failed to open enrollment");
    } finally {
      setIsTogglingIntake(false);
    }
  };

  const toggleAmbIntakeStatus = async () => {
    if (!ambIntakeStatus) return;
    if (!ambIntakeStatus.is_open) {
      setShowAmbIntakeDialog(true);
      return;
    }
    setIsTogglingAmbIntake(true);
    try {
      const newStatus = await updateAmbStatus(!ambIntakeStatus.is_open);
      setAmbIntakeStatus(newStatus);
      toast.success(
        `Ambassador enrollment ${newStatus.is_open ? "opened" : "closed"} successfully!`
      );
      await loadAmbIntakeStatus();
    } catch (error) {
      console.error("Failed to toggle ambassador intake status:", error);
      toast.error("Failed to update ambassador enrollment status");
    } finally {
      setIsTogglingAmbIntake(false);
    }
  };

  const handleOpenAmbIntake = async () => {
    if (!ambIntakeStartDate) {
      toast.error("Please set a start date and time");
      return;
    }
    setIsTogglingAmbIntake(true);
    try {
      const params: any = {
        start_datetime: new Date(ambIntakeStartDate).toISOString(),
      };
      if (ambIntakeEndDate) {
        params.end_datetime = new Date(ambIntakeEndDate).toISOString();
      }
      const newStatus = await updateAmbStatus(true, params);
      setAmbIntakeStatus(newStatus);
      toast.success("Ambassador enrollment opened successfully!");
      setShowAmbIntakeDialog(false);
      setAmbIntakeStartDate("");
      setAmbIntakeEndDate("");
      await loadAmbIntakeStatus();
    } catch (error) {
      console.error("Failed to open ambassador intake:", error);
      toast.error("Failed to open ambassador enrollment");
    } finally {
      setIsTogglingAmbIntake(false);
    }
  };

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
      if (!websiteId || websiteId === "your-website-id-here") {
        setAnalyticsLoading(false);
        return;
      }

      const endAt = new Date().getTime();
      const startAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();

      const response = await fetch(
        `/api/analytics/umami?websiteId=${websiteId}&startAt=${startAt}&endAt=${endAt}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const createCommitteeMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg("");
    setIsCreatingUser(true);
    try {
      const form = new FormData();
      form.append("username", cmUsername);
      form.append("email", cmEmail);
      if (cmPhone) form.append("phone_number", cmPhone);
      form.append("first_name", cmFirst);
      form.append("last_name", cmLast);
      form.append("role", cmRole as any);
      if (cmLinkedIn) form.append("linkedin_url", cmLinkedIn);
      if (cmGithub) form.append("github_url", cmGithub);
      if (cmRole === "AMBASSADOR" && cmAmbYear)
        form.append("ambassador_batch_year_bs", cmAmbYear);
      if (cmRole === "ALUMNI" && cmAlumYear)
        form.append("alumni_batch_year_bs", cmAlumYear);
      if (cmPosition) {
        form.append("committee.position", cmPosition);
        if (cmStart) form.append("committee.started_from", cmStart);
        if (cmTenure !== "" && cmTenure !== null)
          form.append("committee.tenure", String(cmTenure));
      }
      if (cmPhotoFile) form.append("photo", cmPhotoFile);
      try {
        await usersApi.create(form);
        setUserMsg("User created (email sent if configured).");
        toast.success("User created successfully!");

        // Reset form fields
        setCmUsername("");
        setCmEmail("");
        setCmFirst("");
        setCmLast("");
        setCmPhone("");
        setCmPosition("");
        setCmStart("");
        setCmTenure("");
        setCmPhotoFile(null);
        setCmLinkedIn("");
        setCmGithub("");
        setCmAmbYear("");
        setCmAlumYear("");

        // Small delay before clearing message to let user see it
        setTimeout(() => setUserMsg(""), 3000);
      } catch (err: any) {
        setUserMsg(err?.message || "Failed to create user");
        toast.error(err?.message || "Failed to create user");
        return;
      }
    } catch (e: any) {
      setUserMsg(e?.message || "Failed to create user");
      toast.error(e?.message || "Failed to create user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskMsg("");
    setIsCreatingTask(true);
    try {
      await createTaskApi({
        title: tTitle,
        description: tDesc,
        assigned_to: tAssignee,
        due_date: tDue,
      });
      setTaskMsg("Task assigned");
      toast.success("Task assigned successfully!");
      setTTitle("");
      setTDesc("");
      setTAssignee("");
      setTDue("");
      setShowTaskModal(false);
      tasksApi
        .listAssigned()
        .then((d: any[]) => setTasks(Array.isArray(d) ? d : []))
        .catch(() => {});
    } catch {
      setTaskMsg("Failed to assign task");
      toast.error("Failed to assign task");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const reviewSubmission = async (
    id: string,
    decision: "approve" | "reject"
  ) => {
    await reviewApi(id, decision);
    // Refresh both the pending submissions and the tasks list so status reflects immediately
    pendingSubsApi()
      .then(setPendingSubs)
      .catch(() => {});
    tasksApi
      .listAssigned()
      .then((d: any[]) => setTasks(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  // Research functions
  const loadMyResearch = async () => {
    try {
      const data = await researchApi.list();
      setMyResearch(data.results || data || []);
    } catch (error) {
      toast.error("Failed to load research papers");
    }
  };

  const handleCreateResearch = async (formData: FormData) => {
    try {
      await researchApi.create(formData);
      toast.success("Research paper created successfully");
      setShowCreateResearchModal(false);
      loadMyResearch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to create research paper"
      );
      throw error;
    }
  };

  const handleEditResearch = async (slug: string, data: any) => {
    try {
      await researchApi.update(slug, data);
      toast.success("Research paper updated successfully");
      setShowEditResearchModal(false);
      setEditingResearch(null);
      loadMyResearch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to update research paper"
      );
      throw error;
    }
  };

  const handleDeleteResearch = async (slug: string) => {
    // Find the research paper to delete
    const research = myResearch.find((r) => r.slug === slug);
    if (research) {
      setDeletingResearch(research);
      setShowDeleteResearchModal(true);
    }
  };

  const confirmDeleteResearch = async () => {
    if (!deletingResearch) return;
    try {
      await researchApi.remove(deletingResearch.slug);
      toast.success("Research paper deleted successfully");
      setShowDeleteResearchModal(false);
      setDeletingResearch(null);
      loadMyResearch();
    } catch (error) {
      toast.error("Failed to delete research paper");
    }
  };

  const handleApproveResearch = async (slug: string) => {
    try {
      await researchApi.approve(slug);
      toast.success("Research paper approved");
      loadMyResearch();
    } catch (error) {
      toast.error("Failed to approve research paper");
    }
  };

  const handleRejectResearch = async (slug: string) => {
    const reason = prompt("Enter rejection reason (optional):");
    try {
      await researchApi.reject(slug, reason || undefined);
      toast.success("Research paper rejected");
      loadMyResearch();
    } catch (error) {
      toast.error("Failed to reject research paper");
    }
  };

  // Load research when section changes
  useEffect(() => {
    if (activeSection === "research") {
      loadMyResearch();
    }
  }, [activeSection]);

  if (!authReady) return null;

  const contentMarginClass = sidebarCollapsed ? "md:ml-20" : "md:ml-64";

  return (
    <>
      <NavBar />
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <div className="flex bg-gray-950 text-white min-h-screen w-full overflow-x-hidden">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden fixed top-20 left-4 z-50">
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="bg-gray-800 p-3 rounded-lg shadow-lg hover:bg-gray-700 transition"
            aria-label="Toggle sidebar"
            aria-pressed={!sidebarCollapsed}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
        {/* Mobile overlay when sidebar is open */}
        {!sidebarCollapsed && (
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
        <Sidebar
          expanded={!sidebarCollapsed}
          setExpanded={(v) => setSidebarCollapsed(!v)}
          user={sidebarUser}
          onProfileClick={() => setShowProfileModal(true)}
          groups={
            [
              {
                title: "Main Menu",
                items: [
                  {
                    id: "overview",
                    label: "Overview",
                    icon: HomeIcon,
                    active: activeSection === "overview",
                    onClick: () => setActiveSection("overview"),
                  },
                  {
                    id: "notices",
                    label: "Notices",
                    icon: BellIcon,
                    active: activeSection === "notices",
                    onClick: () => setActiveSection("notices"),
                  },
                  {
                    id: "blogs",
                    label: "Blogs",
                    icon: DocumentTextIcon,
                    active: activeSection === "blogs",
                    onClick: () => setActiveSection("blogs"),
                  },
                  {
                    id: "events",
                    label: "Events",
                    icon: CalendarIcon,
                    active: activeSection === "events",
                    onClick: () => setActiveSection("events"),
                  },
                  {
                    id: "projects",
                    label: "Projects",
                    icon: FolderIcon,
                    active: activeSection === "projects",
                    onClick: () => setActiveSection("projects"),
                  },
                  {
                    id: "gallery",
                    label: "Gallery",
                    icon: FolderIcon,
                    active: activeSection === "gallery",
                    onClick: () => setActiveSection("gallery"),
                  },
                  {
                    id: "research",
                    label: "Research",
                    icon: DocumentTextIcon,
                    active: activeSection === "research",
                    onClick: () => setActiveSection("research"),
                  },
                ],
              },
              {
                title: "General",
                items: [
                  {
                    id: "tasks",
                    label: "Assign Task",
                    icon: ClipboardDocumentCheckIcon,
                    active: activeSection === "tasks",
                    onClick: () => setActiveSection("tasks"),
                  },
                  {
                    id: "leaderboard",
                    label: "Leaderboard",
                    icon: TrophyIcon,
                    active: activeSection === "leaderboard",
                    onClick: () => setActiveSection("leaderboard"),
                  },
                  {
                    id: "analytics",
                    label: "Analytics",
                    icon: PresentationChartLineIcon,
                    active: activeSection === "analytics",
                    onClick: () => setActiveSection("analytics"),
                  },
                ],
              },
              {
                title: "Account",
                items: [
                  {
                    id: "users",
                    label: "Users",
                    icon: UserGroupIcon,
                    active: activeSection === "users",
                    onClick: () => setActiveSection("users"),
                  },
                  {
                    id: "ambassadors-alumni",
                    label: "Ambassadors/Alumni",
                    icon: UserGroupIcon,
                    active: activeSection === "ambassadors-alumni",
                    onClick: () => setActiveSection("ambassadors-alumni"),
                  },
                ],
              },
            ] as SidebarGroup[]
          }
        />

        <div
          className={`flex-1 ml-0 ${contentMarginClass} transition-all duration-300 p-4 sm:p-6 md:p-8 mt-16`}
        >
          {activeSection === "overview" && (
            <div className="max-w-7xl mx-auto space-y-4">
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>

              {/* Enrollment Status Control */}
              <div className="mb-4 bg-gradient-to-br from-indigo-900/40 to-indigo-600/20 p-6 rounded-lg border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserPlusIcon className="w-8 h-8 text-indigo-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Enrollment Status
                      </h3>
                      <p className="text-sm text-gray-400">
                        {intakeStatus?.is_open
                          ? "Students can currently submit applications"
                          : "Enrollment is currently closed"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Status</div>
                      <div
                        className={`text-lg font-bold ${
                          intakeStatus?.is_open
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {intakeStatus?.is_open ? "OPEN" : "CLOSED"}
                      </div>
                    </div>
                    <button
                      onClick={toggleIntakeStatus}
                      disabled={isTogglingIntake || !intakeStatus}
                      className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-200 ease-in-out focus:outline-none ${
                        intakeStatus?.is_open ? "bg-green-600" : "bg-gray-600"
                      } ${
                        isTogglingIntake || !intakeStatus
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`inline-block w-6 h-6 transform transition-transform duration-200 ease-in-out bg-white rounded-full ${
                          intakeStatus?.is_open
                            ? "translate-x-9"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {intakeStatus?.message && (
                  <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold">Message: </span>
                      {intakeStatus.message}
                    </p>
                  </div>
                )}
                {intakeStatus?.end_date && intakeStatus.is_open && (
                  <div className="mt-2 text-sm text-gray-400">
                    Deadline:{" "}
                    {new Date(intakeStatus.end_date).toLocaleString("en-NP", {
                      timeZone: "Asia/Kathmandu",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                )}
              </div>

              {/* Ambassador Enrollment Status Control */}
              <div className="mb-4 bg-gradient-to-br from-fuchsia-900/40 to-fuchsia-600/20 p-6 rounded-lg border border-fuchsia-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserPlusIcon className="w-8 h-8 text-fuchsia-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Ambassador Enrollment Status
                      </h3>
                      <p className="text-sm text-gray-400">
                        {ambIntakeStatus?.is_open
                          ? "Ambassadors can currently submit applications"
                          : "Ambassador enrollment is currently closed"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Status</div>
                      <div
                        className={`text-lg font-bold ${
                          ambIntakeStatus?.is_open
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {ambIntakeStatus?.is_open ? "OPEN" : "CLOSED"}
                      </div>
                    </div>
                    <button
                      onClick={toggleAmbIntakeStatus}
                      disabled={isTogglingAmbIntake || !ambIntakeStatus}
                      className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-200 ease-in-out focus:outline-none ${
                        ambIntakeStatus?.is_open ? "bg-green-600" : "bg-gray-600"
                      } ${
                        isTogglingAmbIntake || !ambIntakeStatus
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`inline-block w-6 h-6 transform transition-transform duration-200 ease-in-out bg-white rounded-full ${
                          ambIntakeStatus?.is_open
                            ? "translate-x-9"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {ambIntakeStatus?.message && (
                  <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold">Message: </span>
                      {ambIntakeStatus.message}
                    </p>
                  </div>
                )}
                {ambIntakeStatus?.end_date && ambIntakeStatus.is_open && (
                  <div className="mt-2 text-sm text-gray-400">
                    Deadline:{" "}
                    {new Date(ambIntakeStatus.end_date).toLocaleString("en-NP", {
                      timeZone: "Asia/Kathmandu",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div
                  onClick={() => setActiveSection("notices")}
                  className="bg-gradient-to-br from-purple-900/30 to-purple-600/20 p-3 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition cursor-pointer group"
                >
                  <BellIcon className="w-7 h-7 mb-1.5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xs font-semibold mb-0.5">
                    Pending Notices
                  </h3>
                  <p className="text-lg font-bold text-purple-300">
                    {pendingNotices.length}
                  </p>
                </div>
                <div
                  onClick={() => setActiveSection("blogs")}
                  className="bg-gradient-to-br from-pink-900/30 to-pink-600/20 p-3 rounded-lg border border-pink-500/20 hover:border-pink-500/40 transition cursor-pointer group"
                >
                  <DocumentTextIcon className="w-7 h-7 mb-1.5 text-pink-400 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xs font-semibold mb-0.5">
                    Pending Blogs
                  </h3>
                  <p className="text-lg font-bold text-pink-300">
                    {pendingBlogs.length}
                  </p>
                </div>
                <div
                  onClick={() => setActiveSection("events")}
                  className="bg-gradient-to-br from-blue-900/30 to-blue-600/20 p-3 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition cursor-pointer group"
                >
                  <CalendarIcon className="w-7 h-7 mb-1.5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xs font-semibold mb-0.5">
                    Pending Events
                  </h3>
                  <p className="text-lg font-bold text-blue-300">
                    {pendingEvents.length}
                  </p>
                </div>
                <div
                  onClick={() => setActiveSection("projects")}
                  className="bg-gradient-to-br from-green-900/30 to-green-600/20 p-3 rounded-lg border border-green-500/20 hover:border-green-500/40 transition cursor-pointer group"
                >
                  <FolderIcon className="w-7 h-7 mb-1.5 text-green-400 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xs font-semibold mb-0.5">
                    Pending Projects
                  </h3>
                  <p className="text-lg font-bold text-green-300">
                    {pendingProjects.length}
                  </p>
                </div>
                <div
                  onClick={() => setActiveSection("research")}
                  className="bg-gradient-to-br from-amber-900/30 to-amber-600/20 p-3 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition cursor-pointer group"
                >
                  <ChartBarIcon className="w-7 h-7 mb-1.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xs font-semibold mb-0.5">
                    Pending Research
                  </h3>
                  <p className="text-lg font-bold text-amber-300">
                    {pendingResearch.length}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 lg:grid-cols-2 gap-3">
                <div className="bg-gray-900/50 backdrop-blur p-3 rounded-lg border border-gray-800">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-4 h-4 text-yellow-400" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setActiveSection("notices")}
                      className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium"
                    >
                      <PlusCircleIcon className="w-3 h-3" /> Notice
                    </button>
                    <button
                      onClick={() => setActiveSection("blogs")}
                      className="bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium"
                    >
                      <PlusCircleIcon className="w-3 h-3" /> Blog
                    </button>
                    <button
                      onClick={() => setActiveSection("projects")}
                      className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium"
                    >
                      <PlusCircleIcon className="w-3 h-3" /> Project
                    </button>
                    <button
                      onClick={() => setActiveSection("events")}
                      className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium"
                    >
                      <PlusCircleIcon className="w-3 h-3" /> Event
                    </button>
                    <button
                      onClick={() => setActiveSection("gallery")}
                      className="bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium"
                    >
                      <PlusCircleIcon className="w-3 h-3" /> Gallery
                    </button>
                    <button
                      onClick={() => setActiveSection("research")}
                      className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium"
                    >
                      <PlusCircleIcon className="w-3 h-3" /> Research
                    </button>
                    <button
                      onClick={() => setActiveSection("tasks")}
                      className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-medium col-span-2"
                    >
                      <PlusCircleIcon className="w-3 h-3" /> Assign Task
                    </button>
                  </div>
                </div>
                <div className="bg-gray-900/50 backdrop-blur p-3 rounded-lg border border-gray-800">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4 text-blue-400" />
                    Content Stats
                  </h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Blogs:</span>
                      <span className="font-semibold text-pink-400">
                        {pendingBlogs.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Notices:</span>
                      <span className="font-semibold text-purple-400">
                        {pendingNotices.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Events:</span>
                      <span className="font-semibold text-blue-400">
                        {pendingEvents.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Projects:</span>
                      <span className="font-semibold text-green-400">
                        {pendingProjects.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Research:</span>
                      <span className="font-semibold text-amber-400">
                        {pendingResearch.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Charts Section */}
              {analyticsLoading ? (
                <div className="bg-gray-900/50 backdrop-blur p-8 rounded-lg border border-gray-800 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading analytics...</p>
                </div>
              ) : analyticsData ? (
                <div className="space-y-4">
                  {/* Analytics Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-600/20 p-4 rounded-lg border border-blue-500/20">
                      <div className="text-sm text-gray-400 mb-1">
                        Total Visitors
                      </div>
                      <div className="text-2xl font-bold text-blue-300">
                        {analyticsData.summary?.visitors?.value?.toLocaleString() ||
                          0}
                      </div>
                      {analyticsData.summary?.visitors?.change !==
                        undefined && (
                        <div className="text-xs text-gray-400 mt-1">
                          {analyticsData.summary.visitors.change > 0 ? "+" : ""}
                          {analyticsData.summary.visitors.change}% vs prev
                          period
                        </div>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-600/20 p-4 rounded-lg border border-purple-500/20">
                      <div className="text-sm text-gray-400 mb-1">
                        Page Views
                      </div>
                      <div className="text-2xl font-bold text-purple-300">
                        {analyticsData.summary?.pageviews?.value?.toLocaleString() ||
                          0}
                      </div>
                      {analyticsData.summary?.pageviews?.change !==
                        undefined && (
                        <div className="text-xs text-gray-400 mt-1">
                          {analyticsData.summary.pageviews.change > 0
                            ? "+"
                            : ""}
                          {analyticsData.summary.pageviews.change}% vs prev
                          period
                        </div>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-green-600/20 p-4 rounded-lg border border-green-500/20">
                      <div className="text-sm text-gray-400 mb-1">
                        Total Visits
                      </div>
                      <div className="text-2xl font-bold text-green-300">
                        {analyticsData.summary?.visits?.value?.toLocaleString() ||
                          0}
                      </div>
                      {analyticsData.summary?.visits?.change !== undefined && (
                        <div className="text-xs text-gray-400 mt-1">
                          {analyticsData.summary.visits.change > 0 ? "+" : ""}
                          {analyticsData.summary.visits.change}% vs prev period
                        </div>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-orange-900/30 to-orange-600/20 p-4 rounded-lg border border-orange-500/20">
                      <div className="text-sm text-gray-400 mb-1">
                        Bounce Rate
                      </div>
                      <div className="text-2xl font-bold text-orange-300">
                        {analyticsData.summary?.visits?.value
                          ? Math.round(
                              (analyticsData.summary.bounces.value /
                                analyticsData.summary.visits.value) *
                                100
                            )
                          : 0}
                        %
                      </div>
                      {analyticsData.summary?.bounces?.change !== undefined && (
                        <div className="text-xs text-gray-400 mt-1">
                          {analyticsData.summary.bounces.change > 0 ? "+" : ""}
                          {analyticsData.summary.bounces.change}% vs prev period
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="space-y-4">
                    {/* Top row - Page views and Countries */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {analyticsData.pages &&
                        analyticsData.pages.length > 0 && (
                          <ChartCard
                            title="Top Pages (Last 7 Days)"
                            data={analyticsData.pages.slice(0, 5)}
                            type="bar"
                            color="#3B82F6"
                            height={250}
                          />
                        )}
                      {analyticsData.countries &&
                        analyticsData.countries.length > 0 && (
                          <ChartCard
                            title="Visitors by Country"
                            data={analyticsData.countries.slice(0, 5)}
                            type="bar"
                            color="#10B981"
                            height={250}
                          />
                        )}
                    </div>

                    {/* Second row - Devices and Browsers */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {analyticsData.devices &&
                        analyticsData.devices.length > 0 && (
                          <ChartCard
                            title="Devices"
                            data={analyticsData.devices.slice(0, 5)}
                            type="bar"
                            color="#8B5CF6"
                            height={250}
                          />
                        )}
                      {analyticsData.browsers &&
                        analyticsData.browsers.length > 0 && (
                          <ChartCard
                            title="Browsers"
                            data={analyticsData.browsers.slice(0, 5)}
                            type="bar"
                            color="#F59E0B"
                            height={250}
                          />
                        )}
                    </div>

                    {/* Third row - Referrers and Operating Systems */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {analyticsData.referrers &&
                        analyticsData.referrers.length > 0 && (
                          <ChartCard
                            title="Top Referrers"
                            data={analyticsData.referrers.slice(0, 5)}
                            type="bar"
                            color="#EC4899"
                            height={250}
                          />
                        )}
                      {analyticsData.os && analyticsData.os.length > 0 && (
                        <ChartCard
                          title="Operating Systems"
                          data={analyticsData.os.slice(0, 5)}
                          type="bar"
                          color="#14B8A6"
                          height={250}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/50 backdrop-blur p-8 rounded-lg border border-gray-800 text-center">
                  <PresentationChartLineIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Analytics data unavailable</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure Umami in .env file
                  </p>
                </div>
              )}

              <div className="bg-gray-900/50 backdrop-blur p-4 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold mb-3">Latest Blogs</h3>
                <div className="space-y-2">
                  {latestBlogs.slice(0, 5).map((b: any) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between bg-gray-950 border border-gray-800 rounded p-2"
                    >
                      <div>
                        <div className="font-semibold text-sm">{b.title}</div>
                        <div className="text-xs text-gray-400">
                          by {b.author_username} • {b.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "projects" && (
            <AdminProjectsCrud
              useProjectsHook={useProjects}
              role={role}
              toast={toast}
            />
          )}
          {activeSection === "events" && (
            <AdminEventsCrud
              useEventsHook={useEvents}
              role={role}
              toast={toast}
            />
          )}
          {activeSection === "notices" && (
            <AdminNoticesCrud
              useNoticesHook={useNotices}
              role={role}
              toast={toast}
            />
          )}
          {activeSection === "blogs" && (
            <AdminBlogsCrud useBlogsHook={useBlogs} role={role} toast={toast} />
          )}
          {activeSection === "gallery" && <AdminGalleryCrud toast={toast} />}
          {activeSection === "research" && (
            <ResearchSection
              myResearch={myResearch}
              onCreateClick={() => setShowCreateResearchModal(true)}
              onEditClick={(research) => {
                setEditingResearch(research);
                setShowEditResearchModal(true);
              }}
              onDeleteClick={handleDeleteResearch}
              isAdmin={true}
              onApprove={handleApproveResearch}
              onReject={handleRejectResearch}
            />
          )}

          {activeSection === "users" && (
            <UsersCrud
              usersApi={usersApi}
              toast={toast}
              isCreatingUser={isCreatingUser}
              cm={{
                cmUsername,
                setCmUsername,
                cmEmail,
                setCmEmail,
                cmPhone,
                setCmPhone,
                cmFirst,
                setCmFirst,
                cmLast,
                setCmLast,
                cmRole,
                setCmRole,
                cmPosition,
                setCmPosition,
                cmStart,
                setCmStart,
                cmTenure,
                setCmTenure,
                cmPhoto,
                setCmPhoto,
                cmPhotoFile,
                setCmPhotoFile,
                cmLinkedIn,
                setCmLinkedIn,
                cmGithub,
                setCmGithub,
                cmAmbYear,
                setCmAmbYear,
                cmAlumYear,
                setCmAlumYear,
              }}
              createUser={createCommitteeMember}
              userMsg={userMsg}
              mode="committee"
            />
          )}

          {activeSection === "ambassadors-alumni" && (
            <UsersCrud
              usersApi={usersApi}
              toast={toast}
              isCreatingUser={isCreatingUser}
              cm={{
                cmUsername,
                setCmUsername,
                cmEmail,
                setCmEmail,
                cmPhone,
                setCmPhone,
                cmFirst,
                setCmFirst,
                cmLast,
                setCmLast,
                cmRole,
                setCmRole,
                cmPosition,
                setCmPosition,
                cmStart,
                setCmStart,
                cmTenure,
                setCmTenure,
                cmPhoto,
                setCmPhoto,
                cmPhotoFile,
                setCmPhotoFile,
                cmLinkedIn,
                setCmLinkedIn,
                cmGithub,
                setCmGithub,
                cmAmbYear,
                setCmAmbYear,
                cmAlumYear,
                setCmAlumYear,
              }}
              createUser={createCommitteeMember}
              userMsg={userMsg}
              mode="ambassadors-alumni"
            />
          )}

          {activeSection === "tasks" && (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <ClipboardDocumentCheckIcon className="w-8 h-8 text-yellow-400" />
                  Tasks
                </h1>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 px-4 py-2 rounded-lg"
                >
                  New Task
                </button>
              </div>

              <div className="bg-gray-900/50 backdrop-blur p-6 rounded-xl border border-gray-800">
                <h3 className="text-xl font-semibold mb-4">
                  Pending Task Submissions
                </h3>
                <div className="space-y-3">
                  {pendingSubs.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">
                      No pending submissions
                    </p>
                  ) : (
                    pendingSubs.map((s: any) => (
                      <div
                        key={s.id}
                        className="bg-gray-950 border border-gray-800 rounded p-3 flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {s.task?.title ||
                              s.task_title ||
                              `Submission ${s.id}`}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            by {s.submitted_by_username}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                            onClick={async () => {
                              try {
                                // If task is not expanded, fetch details for richer preview
                                if (
                                  !s.task ||
                                  (typeof s.task === "string" && s.task)
                                ) {
                                  const taskId =
                                    typeof s.task === "string"
                                      ? s.task
                                      : s.task?.id;
                                  if (taskId) {
                                    const r = await authedFetch(
                                      `${base}/api/tasks/tasks/${taskId}/`
                                    );
                                    if (r.ok) {
                                      const task = await r.json();
                                      setPreviewSub({ ...s, task });
                                      return;
                                    }
                                  }
                                }
                              } catch {}
                              setPreviewSub(s);
                            }}
                          >
                            Preview
                          </button>
                          <button
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                            onClick={() => reviewSubmission(s.id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                            onClick={() => reviewSubmission(s.id, "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 bg-gray-900/50 backdrop-blur p-6 rounded-xl border border-gray-800">
                <h3 className="text-xl font-semibold mb-4">All Tasks</h3>
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-gray-400">No tasks yet</p>
                  ) : (
                    tasks.map((t: any) => (
                      <div
                        key={t.id}
                        className="bg-gray-950 border border-gray-800 rounded p-3 flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {t.title}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            to {t.assigned_to_username}{" "}
                            {t.due_date ? `• due ${t.due_date}` : ""}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            t.status === "OPEN"
                              ? "bg-yellow-900/40 text-yellow-200"
                              : "bg-green-900/40 text-green-200"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {previewSub && (
                <div
                  className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setPreviewSub(null)}
                >
                  <div
                    className="max-w-2xl w-full bg-gray-900 border border-gray-800 rounded-xl p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">
                          {previewSub.task?.title ||
                            previewSub.task_title ||
                            `Submission ${previewSub.id}`}
                        </h3>
                        <p className="text-xs text-gray-400">
                          by {previewSub.submitted_by_username} •{" "}
                          {new Date(previewSub.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        className="text-gray-400 hover:text-white"
                        onClick={() => setPreviewSub(null)}
                      >
                        ×
                      </button>
                    </div>

                    {(() => {
                      const taskDesc =
                        previewSub.task?.description ||
                        previewSub.task_description;
                      const taskDue =
                        previewSub.task?.due_date || previewSub.task_due_date;
                      if (!taskDesc && !taskDue) return null;
                      return (
                        <div className="mb-4 text-sm text-gray-300 space-y-1">
                          {taskDesc && (
                            <div>
                              <span className="text-gray-400">
                                Task Description:
                              </span>{" "}
                              {taskDesc}
                            </div>
                          )}
                          {taskDue && (
                            <div>
                              <span className="text-gray-400">
                                Assigned Deadline:
                              </span>{" "}
                              {new Date(taskDue).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {previewSub.content && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">
                          Submission Notes
                        </div>
                        <div className="whitespace-pre-wrap bg-gray-950 border border-gray-800 rounded p-3 text-gray-200 text-sm">
                          {previewSub.content}
                        </div>
                      </div>
                    )}

                    {previewSub.attachment && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">
                          Attachment
                        </div>
                        {(() => {
                          const raw = String(previewSub.attachment || "");
                          const pathOnly = raw.split("?")[0];
                          const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(
                            pathOnly
                          );
                          const isPdf = /\.(pdf)$/i.test(pathOnly);
                          const url = raw.startsWith("http")
                            ? raw
                            : `${
                                process.env.NEXT_PUBLIC_BACKEND_URL ||
                                "http://localhost:8000"
                              }${raw}`;
                          if (isImage) {
                            return (
                              <img
                                src={url}
                                alt="Submission attachment preview"
                                className="max-h-80 rounded border border-gray-800"
                              />
                            );
                          }
                          if (isPdf) {
                            return (
                              <div className="border border-gray-800 rounded overflow-hidden">
                                <iframe
                                  src={`${url}#toolbar=1`}
                                  className="w-full h-96 bg-white"
                                ></iframe>
                              </div>
                            );
                          }
                          return (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm bg-blue-500/10 px-3 py-1.5 rounded"
                            >
                              Open Attachment
                            </a>
                          );
                        })()}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                        onClick={async () => {
                          await reviewSubmission(previewSub.id, "approve");
                          setPreviewSub(null);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                        onClick={async () => {
                          await reviewSubmission(previewSub.id, "reject");
                          setPreviewSub(null);
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showTaskModal && (
                <div
                  className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setShowTaskModal(false)}
                >
                  <div
                    className="max-w-lg w-full bg-gray-900 border border-gray-800 rounded-xl p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Create Task</h3>
                      <button
                        className="text-gray-400 hover:text-white"
                        onClick={() => setShowTaskModal(false)}
                      >
                        ×
                      </button>
                    </div>
                    <form onSubmit={createTask} className="space-y-4">
                      {taskMsg && (
                        <div
                          className={`p-3 rounded ${
                            taskMsg.includes("Failed")
                              ? "bg-red-900/50 text-red-300"
                              : "bg-green-900/50 text-green-300"
                          }`}
                        >
                          {taskMsg}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm mb-1">Task Title</label>
                        <input
                          className="w-full p-3 bg-gray-900 border border-gray-700 rounded"
                          placeholder="Enter task title"
                          value={tTitle}
                          onChange={(e) => setTTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Description
                        </label>
                        <textarea
                          className="w-full p-3 bg-gray-900 border border-gray-700 rounded"
                          placeholder="Describe the task..."
                          value={tDesc}
                          onChange={(e) => setTDesc(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Assign to User
                        </label>
                        <select
                          className="w-full p-3 bg-gray-900 border border-gray-700 rounded"
                          value={tAssignee}
                          onChange={(e) => setTAssignee(e.target.value)}
                          required
                        >
                          <option value="">Select User</option>
                          {assignees.map((u: any) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name || u.username} • {u.role}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Due Date</label>
                        <input
                          type="date"
                          className="w-full p-3 bg-gray-900 border border-gray-700 rounded"
                          value={tDue}
                          onChange={(e) => setTDue(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          className="px-4 py-2 rounded bg-gray-800 border border-gray-700"
                          onClick={() => setShowTaskModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingTask}
                          className="px-4 py-2 rounded bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-semibold"
                        >
                          {isCreatingTask ? "Assigning..." : "Assign Task"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === "analytics" && (
            <div className="w-full">
              <ComprehensiveAnalyticsDashboard
                websiteId={
                  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "your-website-id"
                }
              />
            </div>
          )}

          {activeSection === "leaderboard" && (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrophyIcon className="w-8 h-8 text-yellow-400" />
                Leaderboard
              </h1>

              {/* Tab Navigation */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setLeaderboardTab("ambassadors")}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                    leaderboardTab === "ambassadors"
                      ? "bg-green-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Ambassadors (Current Batch)
                </button>
                <button
                  onClick={() => setLeaderboardTab("alumni")}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                    leaderboardTab === "alumni"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Alumni (Top 5)
                </button>
              </div>

              {/* Ambassadors Tab */}
              {leaderboardTab === "ambassadors" && (
                <div className="bg-gray-900/50 backdrop-blur p-6 rounded-xl border border-gray-800">
                  <div className="space-y-3">
                    {ambassadorsLeaderboard.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        No ambassadors in current batch
                      </p>
                    ) : (
                      ambassadorsLeaderboard.map((user, _index) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-4 p-4 bg-gray-950 rounded-lg border border-gray-800"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              _index === 0
                                ? "bg-yellow-500 text-gray-900"
                                : _index === 1
                                ? "bg-gray-400 text-gray-900"
                                : _index === 2
                                ? "bg-orange-600 text-white"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {_index + 1}
                          </div>
                          {user.photo && (
                            <img
                              src={
                                user.photo.startsWith("http")
                                  ? user.photo
                                  : `${base}${user.photo}`
                              }
                              alt={user.full_name || user.username}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {user.full_name || user.username}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {user.blogs || 0} blogs,{" "}
                              {user.tasks_completed || 0} tasks
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-yellow-400">
                              {user.points || 0}
                            </p>
                            <p className="text-xs text-gray-400">points</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Alumni Tab */}
              {leaderboardTab === "alumni" && (
                <div className="bg-gray-900/50 backdrop-blur p-6 rounded-xl border border-gray-800">
                  <div className="space-y-3">
                    {alumniLeaderboard.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        No alumni data available
                      </p>
                    ) : (
                      alumniLeaderboard.map((user, index) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-4 p-4 bg-gray-950 rounded-lg border border-gray-800"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? "bg-yellow-500 text-gray-900"
                                : index === 1
                                ? "bg-gray-400 text-gray-900"
                                : index === 2
                                ? "bg-orange-600 text-white"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {index + 1}
                          </div>
                          {user.photo && (
                            <img
                              src={
                                user.photo.startsWith("http")
                                  ? user.photo
                                  : `${base}${user.photo}`
                              }
                              alt={user.full_name || user.username}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {user.full_name || user.username}
                            </h3>
                            <p className="text-sm text-gray-400">
                              Batch {user.batch_year_bs} • {user.blogs || 0}{" "}
                              blogs
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-yellow-400">
                              {user.points || 0}
                            </p>
                            <p className="text-xs text-gray-400">points</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

  {/* Intake Opening Dialog */}
  {showIntakeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3a] rounded-2xl shadow-2xl max-w-2xl w-full border border-indigo-700 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
                  <UserPlusIcon className="w-7 h-7" />
                  Open Enrollment
                </h2>
                <button
                  onClick={() => {
                    setShowIntakeDialog(false);
                    setIntakeStartDate("");
                    setIntakeEndDate("");
                    setCreateNewBatch(false);
                    setSelectedBatches([]);
                  }}
                  className="text-gray-400 hover:text-white transition"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-gray-300">
                Configure the enrollment settings before opening registration.
              </p>

              {/* Start Date/Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date & Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                  value={intakeStartDate}
                  onChange={(e) => setIntakeStartDate(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  When should enrollment open?
                </p>
              </div>

              {/* End Date/Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                  value={intakeEndDate}
                  onChange={(e) => setIntakeEndDate(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty for no deadline
                </p>
              </div>

              {/* Create New Batch */}
              <div className="flex items-center gap-3 p-4 bg-[#252b47] rounded-xl border border-gray-600">
                <input
                  type="checkbox"
                  id="createNewBatch"
                  checked={createNewBatch}
                  onChange={(e) => setCreateNewBatch(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="createNewBatch"
                  className="text-gray-300 cursor-pointer"
                >
                  <div className="font-medium">Create New Batch</div>
                  <div className="text-xs text-gray-400">
                    Check this if you want to start a new batch for enrollment
                  </div>
                </label>
              </div>

              {/* Available Batches Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Batches (Optional)
                </label>
                <div className="bg-[#252b47] border border-gray-600 p-4 rounded-xl space-y-2 max-h-48 overflow-y-auto">
                  {availableBatches.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                      No batches available
                    </p>
                  ) : (
                    availableBatches.map((batch: any) => (
                      <div key={batch.code} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`batch-${batch.code}`}
                          checked={selectedBatches.includes(batch.code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBatches([
                                ...selectedBatches,
                                batch.code,
                              ]);
                            } else {
                              setSelectedBatches(
                                selectedBatches.filter(
                                  (b: string) => b !== batch.code
                                )
                              );
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                        />
                        <label
                          htmlFor={`batch-${batch.code}`}
                          className="text-gray-300 cursor-pointer flex-1"
                        >
                          {batch.label}
                        </label>
                      </div>
                    ))
  )}

  
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to allow all batches
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleOpenIntake}
                  disabled={isTogglingIntake || !intakeStartDate}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <CheckIcon className="w-5 h-5" />
                  {isTogglingIntake ? "Opening..." : "Open Enrollment"}
                </button>
                <button
                  onClick={() => {
                    setShowIntakeDialog(false);
                    setIntakeStartDate("");
                    setIntakeEndDate("");
                    setCreateNewBatch(false);
                    setSelectedBatches([]);
                  }}
                  disabled={isTogglingIntake}
                  className="px-6 py-3 rounded-xl border-2 border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

  {/* Ambassador Intake Opening Dialog */}
  {showAmbIntakeDialog && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Open Ambassador Enrollment</h3>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => {
              setShowAmbIntakeDialog(false);
              setAmbIntakeStartDate("");
              setAmbIntakeEndDate("");
            }}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2"
              value={ambIntakeStartDate}
              onChange={(e) => setAmbIntakeStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Optional End Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2"
              value={ambIntakeEndDate}
              onChange={(e) => setAmbIntakeEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
              onClick={() => {
                setShowAmbIntakeDialog(false);
                setAmbIntakeStartDate("");
                setAmbIntakeEndDate("");
              }}
              disabled={isTogglingAmbIntake}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
              onClick={handleOpenAmbIntake}
              disabled={isTogglingAmbIntake || !ambIntakeStartDate}
            >
              {isTogglingAmbIntake ? "Opening..." : "Open Ambassador Enrollment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Research Modals */}
      <CreateResearchModal
        isOpen={showCreateResearchModal}
        onClose={() => setShowCreateResearchModal(false)}
        onSubmit={handleCreateResearch}
      />
      <EditResearchModal
        isOpen={showEditResearchModal}
        onClose={() => {
          setShowEditResearchModal(false);
          setEditingResearch(null);
        }}
        research={editingResearch}
        onSubmit={handleEditResearch}
      />

      {/* Delete Research Confirmation Modal */}
      {showDeleteResearchModal && deletingResearch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3a] rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="bg-[#252b47] px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrashIcon className="w-6 h-6 text-red-400" /> Delete Research
              </h3>
              <button
                onClick={() => {
                  setShowDeleteResearchModal(false);
                  setDeletingResearch(null);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete the research paper "
                <span className="font-semibold text-white">
                  {deletingResearch.title}
                </span>
                "?
              </p>
              <p className="text-sm text-gray-400 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteResearch}
                  className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteResearchModal(false);
                    setDeletingResearch(null);
                  }}
                  className="flex-1 border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentImage={sidebarUser?.avatarUrl}
        userName={sidebarUser?.name || ""}
        userEmail={(() => {
          const userStr = localStorage.getItem("user");
          return userStr ? JSON.parse(userStr).email : "";
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
        onSave={async (data) => {
          const formData = new FormData();
          if (data.email) formData.append("email", data.email);
          if (data.phone_number)
            formData.append("phone_number", data.phone_number);
          if (data.linkedin_url)
            formData.append("linkedin_url", data.linkedin_url);
          if (data.github_url) formData.append("github_url", data.github_url);
          if (data.alumni_workplace)
            formData.append("alumni_workplace", data.alumni_workplace);
          if (data.photo) formData.append("photo", data.photo);

          const response = await fetch("/api/app/auth/profile", {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access")}`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to update profile");
          }

          const updatedUser = await response.json();
          localStorage.setItem("user", JSON.stringify(updatedUser));

          // Update sidebar user
          const raw =
            updatedUser.user_photo || updatedUser.committee_member_photo || "";
          const avatar = raw
            ? raw.startsWith("http")
              ? raw
              : `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}${raw}`
            : undefined;
          setSidebarUser({
            name: updatedUser.full_name || updatedUser.username,
            role: updatedUser.role,
            avatarUrl: avatar,
            position: updatedUser.committee_position,
          });

          toast.success("Profile updated successfully!");
        }}
      />

      <Footer />
    </>
  );
}

function UsersCrud({
  usersApi,
  cm,
  createUser,
  userMsg,
  mode = "committee",
  toast,
  isCreatingUser,
}: {
  usersApi: ReturnType<typeof useUsers>;
  cm: any;
  createUser: (e: React.FormEvent) => Promise<void>;
  userMsg: string;
  mode?: "committee" | "ambassadors-alumni";
  toast: ReturnType<typeof useToast>;
  isCreatingUser: boolean;
}) {
  const [list, setList] = useState<any[]>([]);
  const [roleTab, setRoleTab] = useState<
    "ALL" | "MEMBER" | "AMBASSADOR" | "ALUMNI"
  >("ALL");
  const [ambFilterYear, setAmbFilterYear] = useState<string>("");
  const [alumFilterYear, setAlumFilterYear] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showAlumniModal, setShowAlumniModal] = useState(false);
  const [userToMakeAlumni, setUserToMakeAlumni] = useState<any>(null);
  const [alumniBatchYear, setAlumniBatchYear] = useState<string>("");
  const [isMakingAlumni, setIsMakingAlumni] = useState(false);

  const refresh = async () => {
    try {
      const allUsers = await usersApi.list();
      let filteredUsers;
      if (mode === "ambassadors-alumni") {
        filteredUsers = allUsers.filter(
          (u: any) => u.role === "AMBASSADOR" || u.role === "ALUMNI"
        );
      } else {
        filteredUsers = allUsers.filter(
          (u: any) => u.role === "MEMBER" || u.role === "ADMIN"
        );
      }

      // Sort committee members by position hierarchy
      if (mode === "committee") {
        const positionOrder: { [key: string]: number } = {
          President: 1,
          "Vice President": 2,
          Secretary: 3,
          "Secretary/Treasurer": 4,
          "Technical Research & Development Unit": 5,
          "External Affairs": 6,
          "Editor In Chief": 7,
          "Graphics Designer": 8,
          "Video Editor": 9,
          "Content Writer": 10,
          "Social Media Manager": 11,
          Consultant: 12,
        };

        filteredUsers.sort((a: any, b: any) => {
          const posA =
            a.committee_position || (a.committee && a.committee.position) || "";
          const posB =
            b.committee_position || (b.committee && b.committee.position) || "";
          const orderA = positionOrder[posA] || 999;
          const orderB = positionOrder[posB] || 999;

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          // If same position, sort by name
          const nameA = a.full_name || a.username || "";
          const nameB = b.full_name || b.username || "";
          return nameA.localeCompare(nameB);
        });
      }

      setList(filteredUsers);
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, []);

  // Watch for successful user creation to close modal and refresh
  useEffect(() => {
    if (userMsg.includes("User created") && showCreateModal) {
      const timer = setTimeout(() => {
        setShowCreateModal(false);
        refresh();
      }, 1500); // Close modal after 1.5 seconds to let user see the success message
      return () => clearTimeout(timer);
    }
  }, [userMsg, showCreateModal]);

  useEffect(() => {
    if (mode === "ambassadors-alumni") {
      cm.setCmRole("AMBASSADOR");
      cm.setCmPosition("");
      cm.setCmStart("");
      cm.setCmTenure("");
    } else if (mode === "committee") {
      cm.setCmRole("MEMBER");
      cm.setCmPosition("President");
    }
  }, [mode]);

  const [editId, setEditId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState("MEMBER");
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editCommitteePos, setEditCommitteePos] = useState("");
  const [editCommitteeStart, setEditCommitteeStart] = useState("");
  const [editCommitteeTenure, setEditCommitteeTenure] = useState<
    string | number
  >("");
  const [editLinkedIn, setEditLinkedIn] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editAmbYear, setEditAmbYear] = useState<string>("");
  const [editAlumYear, setEditAlumYear] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-assign role based on committee position in edit mode (only for committee mode)
  useEffect(() => {
    if (mode === "committee") {
      if (
        editCommitteePos === "President" ||
        editCommitteePos === "Vice President"
      ) {
        setEditRole("ADMIN");
      } else if (editCommitteePos) {
        setEditRole("MEMBER");
      }
    }
  }, [editCommitteePos, mode]);

  const startEdit = (u: any) => {
    setEditId(u.id);
    setEditRole(u.role);
    setEditFirst(u.first_name || "");
    setEditLast(u.last_name || "");
    setEditEmail(u.email || "");
    setEditPhone(u.phone_number || "");
    setEditPhotoFile(null);
    const c = u.committee || {};
    setEditCommitteePos(c.position || u.committee_position || "");
    setEditCommitteeStart(c.started_from || u.committee_started_from || "");
    setEditCommitteeTenure(
      typeof c.tenure === "number"
        ? c.tenure
        : c.tenure || u.committee_tenure || ""
    );
    setEditLinkedIn(u.linkedin_url || "");
    setEditGithub(u.github_url || "");
    setEditAmbYear((u.ambassador_batch_year_bs ?? "").toString() || "");
    setEditAlumYear((u.alumni_batch_year_bs ?? "").toString() || "");
    setShowEditModal(true);
  };

  const doEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId == null) return;
    setIsUpdating(true);
    const form = new FormData();
    form.append("role", editRole);
    form.append("first_name", editFirst);
    form.append("last_name", editLast);
    form.append("email", editEmail);
    if (editPhone) form.append("phone_number", editPhone);
    if (editPhotoFile) form.append("photo", editPhotoFile);
    if (editCommitteePos) form.append("committee.position", editCommitteePos);
    if (editCommitteeStart)
      form.append("committee.started_from", editCommitteeStart);
    if (editCommitteeTenure !== "")
      form.append("committee.tenure", String(editCommitteeTenure));
    if (editLinkedIn) form.append("linkedin_url", editLinkedIn);
    if (editGithub) form.append("github_url", editGithub);
    if (editRole === "AMBASSADOR" && editAmbYear)
      form.append("ambassador_batch_year_bs", editAmbYear);
    if (editRole === "ALUMNI" && editAlumYear)
      form.append("alumni_batch_year_bs", editAlumYear);
    try {
      await usersApi.update(editId, form);
      setShowEditModal(false);
      toast.success("User updated successfully!");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = (u: any) => {
    setUserToDelete(u);
    setShowDeleteModal(true);
  };

  const doDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await usersApi.remove(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
      toast.success("User deleted successfully!");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmMakeAlumni = (user: any) => {
    setUserToMakeAlumni(user);
    setAlumniBatchYear("");
    setShowAlumniModal(true);
  };

  const makeAlumni = async () => {
    if (!userToMakeAlumni) return;

    if (!alumniBatchYear || !alumniBatchYear.trim()) {
      toast.error("Batch year is required");
      return;
    }

    const batchYearNum = parseInt(alumniBatchYear);
    if (isNaN(batchYearNum) || batchYearNum < 2000 || batchYearNum > 2100) {
      toast.error("Please enter a valid batch year (e.g., 2078)");
      return;
    }

    setIsMakingAlumni(true);
    try {
      const response = await authedFetch(`${base}/api/auth/transform/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userToMakeAlumni.id,
          role: "ALUMNI",
          alumni_batch_year_bs: batchYearNum,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to convert to alumni");
      }

      toast.success(
        `${
          userToMakeAlumni.full_name || userToMakeAlumni.username
        } converted to Alumni successfully!`
      );
      setShowAlumniModal(false);
      setUserToMakeAlumni(null);
      setAlumniBatchYear("");
      refresh();
    } catch (e: any) {
      toast.error(e?.message || "Failed to convert to alumni");
    } finally {
      setIsMakingAlumni(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {mode === "committee" ? "Committee Users" : "Ambassadors / Alumni"}
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
        >
          New User
        </button>
      </div>

      <div className="grid gap-4">
        {list.length === 0 ? (
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-8 text-center text-gray-400">
            No users found.
          </div>
        ) : (
          list.map((u: any) => {
            // Get photo URL - check committee object first, then user_photo field
            const getPhotoUrl = () => {
              let photoUrl = null;

              // Check if committee object exists and has memberPhoto
              if (u.committee && u.committee.memberPhoto) {
                photoUrl = u.committee.memberPhoto;
              } else if (u.user_photo) {
                photoUrl = u.user_photo;
              } else if (u.photo) {
                photoUrl = u.photo;
              }

              if (!photoUrl) return null;

              // If it's already a full URL, return it
              if (photoUrl.startsWith("http")) {
                return photoUrl;
              }

              // Otherwise, prepend the API base URL
              const base =
                process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
              return `${base}${photoUrl}`;
            };

            const photoUrl = getPhotoUrl();

            // For committee members, show their committee position instead of role
            const displayRole =
              u.committee_position ||
              (u.committee && u.committee.position) ||
              u.role;

            return (
              <div
                key={u.id}
                className="bg-gray-900/50 rounded-xl border border-gray-800 hover:border-purple-500/30 transition-all p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* User Photo & Basic Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={u.full_name || u.username}
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/50"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.nextElementSibling) {
                            (
                              target.nextElementSibling as HTMLElement
                            ).style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="w-16 h-16 rounded-full bg-purple-600/20 border-2 border-purple-500/50 flex items-center justify-center text-purple-400 font-bold text-xl"
                      style={{
                        display: photoUrl ? "none" : "flex",
                      }}
                    >
                      {(u.full_name || u.username || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name & Role */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {u.full_name || u.username}
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-600/20 text-purple-400 border border-purple-500/30 uppercase">
                          {displayRole}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                        {/* Email */}
                        {u.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">📧</span>
                            <span className="text-gray-300 truncate">
                              {u.email}
                            </span>
                          </div>
                        )}

                        {/* Phone */}
                        {(u.phone || u.phone_number) && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-gray-300">
                              {u.phone || u.phone_number}
                            </span>
                          </div>
                        )}

                        {/* Username */}
                        {u.username && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="text-gray-400 text-xs">
                              @{u.username}
                            </span>
                          </div>
                        )}

                        {/* Committee Position (if not already shown as badge) */}
                        {(u.committee_position ||
                          (u.committee && u.committee.position)) && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-gray-300 font-medium">
                              {u.committee_position || u.committee.position}
                            </span>
                          </div>
                        )}

                        {/* Committee Start */}
                        {(u.committee_started_from ||
                          (u.committee && u.committee.started_from)) && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-gray-300">
                              Started:{" "}
                              {new Date(
                                u.committee_started_from ||
                                  u.committee.started_from
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {/* Committee Tenure */}
                        {(u.committee_tenure ||
                          (u.committee && u.committee.tenure)) && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-gray-300">
                              Tenure: {u.committee_tenure || u.committee.tenure}{" "}
                              years
                            </span>
                          </div>
                        )}

                        {/* LinkedIn */}
                        {(u.linkedin_url || u.linkedin) && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            <a
                              href={u.linkedin_url || u.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 truncate"
                            >
                              LinkedIn
                            </a>
                          </div>
                        )}

                        {/* GitHub */}
                        {(u.github_url || u.github) && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <a
                              href={u.github_url || u.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 truncate"
                            >
                              GitHub
                            </a>
                          </div>
                        )}

                        {/* Ambassador Batch Year */}
                        {u.ambassador_batch_year_bs && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l9-5-9-5-9 5 9 5z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                              />
                            </svg>
                            <span className="text-gray-300">
                              Batch: {u.ambassador_batch_year_bs} BS
                            </span>
                          </div>
                        )}

                        {/* Alumni Batch Year */}
                        {u.alumni_batch_year_bs && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l9-5-9-5-9 5 9 5z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                              />
                            </svg>
                            <span className="text-gray-300">
                              Batch: {u.alumni_batch_year_bs} BS
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {/* Make Alumni button - only show for non-alumni users in committee mode */}
                    {mode === "committee" && u.role !== "ALUMNI" && (
                      <button
                        onClick={() => confirmMakeAlumni(u)}
                        className="p-2 hover:bg-green-600/20 rounded-lg transition-colors flex items-center gap-1"
                        title="Make Alumni"
                      >
                        <svg
                          className="w-4 h-4 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l9-5-9-5-9 5 9 5z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                          />
                        </svg>
                        <span className="text-green-400 text-sm font-semibold">
                          Change to Alumni
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(u)}
                      className="p-2 hover:bg-blue-600/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilSquareIcon className="w-5 h-5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => confirmDelete(u)}
                      className="p-2 hover:bg-red-600/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3a] rounded-2xl border border-gray-700 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#252b47]">
              <h3 className="text-xl font-bold">Create User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={createUser} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* For Committee Mode: Show committee position and locked role */}
                {mode === "committee" && (
                  <>
                    {/* Committee Position - FIRST */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Committee Position
                      </label>
                      <select
                        className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                        value={cm.cmPosition}
                        onChange={(e) => cm.setCmPosition(e.target.value)}
                      >
                        <option value="">Select Position</option>
                        <option value="President">President</option>
                        <option value="Vice President">Vice President</option>
                        <option value="Secretary">Secretary</option>
                        <option value="Secretary/Treasurer">
                          Secretary/Treasurer
                        </option>
                        <option value="Technical Research & Development Unit">
                          Technical Research & Development Unit
                        </option>
                        <option value="Graphics Designer">
                          Graphics Designer
                        </option>
                        <option value="Video Editor">Video Editor</option>
                        <option value="Content Writer">Content Writer</option>
                        <option value="External Affairs">
                          External Affairs
                        </option>
                        <option value="Social Media Manager">
                          Social Media Manager
                        </option>
                        <option value="Consultant">Consultant</option>
                        <option value="Editor In Chief">Editor In Chief</option>
                      </select>
                    </div>
                    {/* Role - LOCKED based on committee position */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Role (Auto-assigned)
                      </label>
                      <select
                        className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white opacity-60 cursor-not-allowed"
                        value={cm.cmRole}
                        disabled
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="AMBASSADOR">AMBASSADOR</option>
                        <option value="ALUMNI">ALUMNI</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        {cm.cmPosition === "President" ||
                        cm.cmPosition === "Vice President"
                          ? "President & Vice President are automatically assigned ADMIN role"
                          : "Other positions are assigned MEMBER role"}
                      </p>
                    </div>
                  </>
                )}

                {/* For Ambassadors/Alumni Mode: Show role selector (not locked) */}
                {mode === "ambassadors-alumni" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                      value={cm.cmRole}
                      onChange={(e) => cm.setCmRole(e.target.value)}
                    >
                      <option value="AMBASSADOR">AMBASSADOR</option>
                      <option value="ALUMNI">ALUMNI</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Choose between Ambassador or Alumni role
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={cm.cmUsername}
                    onChange={(e) => cm.setCmUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={cm.cmEmail}
                    onChange={(e) => cm.setCmEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={cm.cmFirst}
                    onChange={(e) => cm.setCmFirst(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={cm.cmLast}
                    onChange={(e) => cm.setCmLast(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={cm.cmPhone}
                    onChange={(e) => cm.setCmPhone(e.target.value)}
                  />
                </div>

                {/* Committee-specific fields */}
                {mode === "committee" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Committee Start
                      </label>
                      <input
                        type="date"
                        className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                        value={cm.cmStart}
                        onChange={(e) => cm.setCmStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Committee Tenure
                      </label>
                      <input
                        type="number"
                        className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                        value={cm.cmTenure as any}
                        onChange={(e) => cm.setCmTenure(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Batch year for Ambassadors/Alumni */}
                {mode === "ambassadors-alumni" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Batch Year (Nepali BS)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                      placeholder="e.g., 2078"
                      value={
                        cm.cmRole === "AMBASSADOR"
                          ? cm.cmAmbYear
                          : cm.cmAlumYear
                      }
                      onChange={(e) => {
                        if (cm.cmRole === "AMBASSADOR") {
                          cm.setCmAmbYear(e.target.value);
                        } else {
                          cm.setCmAlumYear(e.target.value);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Enter the batch year in Nepali calendar (BS)
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={cm.cmLinkedIn}
                    onChange={(e) => cm.setCmLinkedIn(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub URL
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={cm.cmGithub}
                    onChange={(e) => cm.setCmGithub(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Photo
                  </label>
                  <input
                    type="file"
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white file:bg-purple-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2"
                    onChange={(e) =>
                      cm.setCmPhotoFile(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <CheckIcon className="w-5 h-5" />{" "}
                  {isCreatingUser ? "Creating..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreatingUser}
                  className="px-6 py-3 rounded-xl border-2 border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
              {userMsg && (
                <p className="text-sm text-gray-300 mt-2">{userMsg}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3a] rounded-2xl border border-gray-700 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#252b47]">
              <h3 className="text-xl font-bold">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={doEdit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* For Committee Mode: Show committee position and locked role */}
                {mode === "committee" && (
                  <>
                    {/* Committee Position - FIRST */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Committee Position
                      </label>
                      <select
                        className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                        value={editCommitteePos}
                        onChange={(e) => setEditCommitteePos(e.target.value)}
                      >
                        <option value="">Select Position</option>
                        <option value="President">President</option>
                        <option value="Vice President">Vice President</option>
                        <option value="Secretary">Secretary</option>
                        <option value="Secretary/Treasurer">
                          Secretary/Treasurer
                        </option>
                        <option value="Technical Research & Development Unit">
                          Technical Research & Development Unit
                        </option>
                        <option value="Graphics Designer">
                          Graphics Designer
                        </option>
                        <option value="Video Editor">Video Editor</option>
                        <option value="Content Writer">Content Writer</option>
                        <option value="External Affairs">
                          External Affairs
                        </option>
                        <option value="Social Media Manager">
                          Social Media Manager
                        </option>
                        <option value="Consultant">Consultant</option>
                        <option value="Editor In Chief">Editor In Chief</option>
                      </select>
                    </div>
                    {/* Role - LOCKED based on committee position */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Role (Auto-assigned)
                      </label>
                      <select
                        className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white opacity-60 cursor-not-allowed"
                        value={editRole}
                        disabled
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="AMBASSADOR">AMBASSADOR</option>
                        <option value="ALUMNI">ALUMNI</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        {editCommitteePos === "President" ||
                        editCommitteePos === "Vice President"
                          ? "President & Vice President are automatically assigned ADMIN role"
                          : "Other positions are assigned MEMBER role"}
                      </p>
                    </div>
                  </>
                )}

                {/* For Ambassadors/Alumni Mode: Show role selector (not locked) */}
                {mode === "ambassadors-alumni" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                    >
                      <option value="AMBASSADOR">AMBASSADOR</option>
                      <option value="ALUMNI">ALUMNI</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Choose between Ambassador or Alumni role
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={editFirst}
                    onChange={(e) => setEditFirst(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={editLast}
                    onChange={(e) => setEditLast(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Photo
                  </label>
                  <input
                    type="file"
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white file:bg-purple-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2"
                    onChange={(e) =>
                      setEditPhotoFile(e.target.files?.[0] || null)
                    }
                  />
                </div>

                {/* Committee-specific fields */}
                {mode === "committee" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Committee Start
                      </label>
                      <input
                        type="date"
                        className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                        value={editCommitteeStart}
                        onChange={(e) => setEditCommitteeStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Committee Tenure
                      </label>
                      <input
                        type="number"
                        className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                        value={editCommitteeTenure as any}
                        onChange={(e) => setEditCommitteeTenure(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Batch year for Ambassadors/Alumni */}
                {mode === "ambassadors-alumni" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Batch Year (Nepali BS)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                      placeholder="e.g., 2078"
                      value={
                        editRole === "AMBASSADOR" ? editAmbYear : editAlumYear
                      }
                      onChange={(e) => {
                        if (editRole === "AMBASSADOR") {
                          setEditAmbYear(e.target.value);
                        } else {
                          setEditAlumYear(e.target.value);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Enter the batch year in Nepali calendar (BS)
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={editLinkedIn}
                    onChange={(e) => setEditLinkedIn(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub URL
                  </label>
                  <input
                    className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <CheckIcon className="w-5 h-5" />{" "}
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  className="px-6 py-3 rounded-xl border-2 border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3a] rounded-2xl shadow-2xl max-w-md w-full border border-red-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-red-400 flex items-center gap-2">
                <TrashIcon className="w-6 h-6" /> Delete User
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                Are you sure you want to delete{" "}
                <span className="font-bold text-white">
                  {userToDelete.full_name || userToDelete.username}
                </span>
                ?
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={doDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <TrashIcon className="w-5 h-5" />{" "}
                  {isDeleting ? "Deleting..." : "Yes, Delete User"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="px-6 py-3 rounded-xl border-2 border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAlumniModal && userToMakeAlumni && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f3a] rounded-2xl shadow-2xl max-w-md w-full border border-green-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
                Make Alumni
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                Convert{" "}
                <span className="font-bold text-white">
                  {userToMakeAlumni.full_name || userToMakeAlumni.username}
                </span>{" "}
                to Alumni?
              </p>
              <p className="text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30 flex items-start gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  This will clear their committee position, start date, and
                </span>
                tenure.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Alumni Batch Year (Nepali BS){" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  className="w-full bg-[#252b47] border border-gray-600 p-3 rounded-xl text-white"
                  placeholder="e.g., 2078"
                  value={alumniBatchYear}
                  onChange={(e) => setAlumniBatchYear(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isMakingAlumni) {
                      e.preventDefault();
                      makeAlumni();
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter the batch year in Nepali calendar (BS)
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={makeAlumni}
                  disabled={isMakingAlumni}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <CheckIcon className="w-5 h-5" />{" "}
                  {isMakingAlumni ? "Converting..." : "Confirm & Make Alumni"}
                </button>
                <button
                  onClick={() => {
                    setShowAlumniModal(false);
                    setUserToMakeAlumni(null);
                    setAlumniBatchYear("");
                  }}
                  disabled={isMakingAlumni}
                  className="px-6 py-3 rounded-xl border-2 border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
