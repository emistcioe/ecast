import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/router";
import { useIntake, IntakeStatus, IntakeInfo } from "@/lib/hooks/intake";
import NavBar from "@/components/nav";
import Footer from "@/components/footar";

const ALLOWED_DEPARTMENTS = [
  { code: "BAS", label: "Department Of Applied Science" },
  { code: "BAR", label: "Department Of Architecture" },
  {
    code: "BAM",
    label: "Department Of Automobile And Mechanical Engineering",
  },
  { code: "BCE", label: "Department Of Civil Engineering" },
  {
    code: "BEC",
    label: "Department Of Electronics And Computer Engineering",
  },
  { code: "BIE", label: "Department Of Industrial Engineering" },
];
const ALLOWED_DEPARTMENT_CODES = new Set(
  ALLOWED_DEPARTMENTS.map((dept) => dept.code)
);
const CAMPUS_ROLL_PATTERN = /^THA\d{3}B[A-Z]{2}\d{3}$/;

const JoinUs = () => {
  const router = useRouter();
  const { fetchStatus, fetchInfo, submitForm } = useIntake();

  // Smart redirect from /join-us to the open intake (members or ambassadors)
  const [redirectChecked, setRedirectChecked] = useState(false);
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!router || router.pathname !== "/join-us") return;
      try {
        const [mRes, aRes] = await Promise.all([
          fetch("/api/intake/status"),
          fetch("/api/ambassador-intake/status"),
        ]);
        const m = await mRes.json().catch(() => ({}));
        const a = await aRes.json().catch(() => ({}));
        if (m?.is_open) {
          router.replace("/join-us/members");
          return;
        }
        if (a?.is_open) {
          router.replace("/join-us/ambassadors");
          return;
        }
      } catch {}
      setRedirectChecked(true);
    };
    checkAndRedirect();
  }, [router]);

  const [intakeStatus, setIntakeStatus] = useState<IntakeStatus | null>(null);
  const [intakeInfo, setIntakeInfo] = useState<IntakeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState<string>("");
  const [rollNo, setRollNo] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [batch, setBatch] = useState<string>("");
  const [about, setAbout] = useState<string>("");
  const [reason_to_join, setReason_to_join] = useState<string>("");
  const [interest, setInterest] = useState<string>("");
  const [timeAvailability, setTimeAvailability] = useState<string>("");
  const [resume, setResume] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string>("");
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [positions, setPositions] = useState<string>("");

  const [link1, setLink1] = useState<string>("");
  const [link2, setLink2] = useState<string>("");
  const [link3, setLink3] = useState<string>("");

  const departmentOptions =
    intakeInfo?.departments && intakeInfo.departments.length > 0
      ? (() => {
          const filtered = intakeInfo.departments.filter((dept) =>
            ALLOWED_DEPARTMENT_CODES.has(dept.code)
          );
          if (!filtered.length) return ALLOWED_DEPARTMENTS;
          return filtered.map((dept) => {
            const override = ALLOWED_DEPARTMENTS.find(
              (item) => item.code === dept.code
            );
            return {
              code: dept.code,
              label: override?.label || dept.label,
            };
          });
        })()
      : ALLOWED_DEPARTMENTS;

  // Fetch intake status and info
  useEffect(() => {
    const fetchIntakeData = async () => {
      try {
        setLoading(true);

        // Fetch intake status using hook
        const statusData = await fetchStatus();
        setIntakeStatus(statusData);

        // Fetch intake info (batches and departments) using hook
        const infoData = await fetchInfo();
        setIntakeInfo(infoData);

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch intake information. Please try again later.");
        setLoading(false);
      }
    };

    fetchIntakeData();
  }, [fetchStatus, fetchInfo]);

  const showAlert = (message: string) => {
    const bgOverlay = document.createElement("div");
    bgOverlay.className = "fixed inset-0 bg-black bg-opacity-50 z-50";

    const alertBox = document.createElement("div");
    alertBox.className =
      "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black p-6 rounded shadow-lg z-50 max-w-xs w-full text-center";

    const closeButton = document.createElement("button");
    closeButton.className = "absolute top-0 right-0 mt-2 mr-2 text-black";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = () => {
      document.body.removeChild(alertBox);
      document.body.removeChild(bgOverlay);
    };

    alertBox.appendChild(closeButton);

    const messageParagraph = document.createElement("p");
    messageParagraph.innerText = message;

    alertBox.appendChild(messageParagraph);

    document.body.appendChild(bgOverlay);
    document.body.appendChild(alertBox);
  };

  const redirectToHome = () => {
    router.push("/");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!intakeStatus?.is_open) {
      showAlert("Enrollment is currently closed. Please check back later.");
      return;
    }

    const normalizedRoll = rollNo.trim().toUpperCase();
    if (!CAMPUS_ROLL_PATTERN.test(normalizedRoll)) {
      showAlert(
        "Campus roll must follow the format THA000BXX000 (all uppercase)."
      );
      setRollNo(normalizedRoll);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.append("name", name);
    formData.append("campus_roll", normalizedRoll);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("department", department);
    formData.append("batch", batch);
    formData.append("about", about);
    formData.append("reason_to_join", reason_to_join);
    formData.append("interests", interest);
    formData.append("post", positions);
    if (resume) {
      formData.append("resume", resume);
    }
    formData.append("github_link", link2);
    formData.append("facebook_link", link3);
    formData.append("linkedin_link", link1);
    formData.append("time_availability", timeAvailability);

    try {
      // Submit to Google Sheets (non-critical, fire and forget)
      try {
        const gasUrl =
          "https://script.google.com/macros/s/AKfycbxAg8p9TENsGAjj59dRNS6T_PfUfGSdTmCK79rnppMCAzSjmoCUTxgXIis-S4DhbZRO/exec";

        const dataToSend = {
          name: name,
          campus_roll: rollNo,
          email: email,
          phone: phone,
          department: department,
          batch: batch,
          about: about,
          reason_to_join: reason_to_join,
          interests: interest,
          post: positions,
          resume: resume ? resume.name : "",
          github_link: link2,
          facebook_link: link3,
          linkedin_link: link1,
          time_availability: timeAvailability,
        };

        await fetch(gasUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
          mode: "no-cors",
        });
      } catch (gasError) {
        console.log("Google Sheets error (non-critical):", gasError);
      }

      // Submit using hook
      await submitForm(formData);

      setIsSubmitting(false);
      setFormSubmitted(true);

      setTimeout(() => {
        redirectToHome();
      }, 3000);
    } catch (error: any) {
      console.log("Submission error:", error);
      setIsSubmitting(false);

      const errorMessage =
        error?.message || "An unexpected error occurred. Please try again.";
      showAlert(errorMessage);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
      setResumeName(e.target.files[0].name);
    }
  };

  const handleFileClick = () => {
    const cvElement = document.getElementById("cv") as HTMLInputElement | null;
    if (cvElement) {
      cvElement.click();
    }
  };

  // Check if the selected batch is available for enrollment
  const isBatchAvailable = (batchCode: string): boolean => {
    if (!intakeStatus?.available_batches) return true; // If no restriction, allow all
    return intakeStatus.available_batches.includes(batchCode);
  };

  // On /join-us, wait for redirect decision first
  if (
    typeof window !== "undefined" &&
    router.pathname === "/join-us" &&
    !redirectChecked
  ) {
    return (
      <>
        <NavBar />
        <div className="bg-black min-h-screen flex items-center justify-center pt-20">
          <div className="text-gray-800 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-xl">Checking enrollment status...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="bg-black min-h-screen flex items-center justify-center pt-20">
          <div className="text-gray-800 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-xl">Loading intake information...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className="bg-gray-50 min-h-screen flex items-center justify-center pt-20">
          <div className="text-gray-800 text-center max-w-md mx-4">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xl mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition"
            >
              Go Back Home
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!intakeStatus?.is_open) {
    return (
      <>
        <NavBar />
        <div className="bg-black min-h-screen flex items-center justify-center pt-20 pb-10">
          <div className="max-w-4xl mx-4 px-6">
            {/* Main Closed Message */}
            <div className="text-center mb-12 p-8 bg-gray-900 border border-gray-800 rounded-lg shadow-lg">
              <svg
                className="w-20 h-20 mx-auto mb-6 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h1 className="text-3xl font-bold mb-4 text-slate-600">
                Enrollment Closed
              </h1>
              <p className="text-xl mb-6 text-gray-400">
                {intakeStatus?.message || "Intake is currently closed"}
              </p>
              {intakeStatus?.start_date && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">Next Intake Opens:</p>
                  <p className="text-lg font-semibold text-green-400 mt-2">
                    {new Date(intakeStatus.start_date).toLocaleString("en-NP", {
                      timeZone: "Asia/Kathmandu",
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              )}
              <p className="text-gray-300 mb-2">
                While you wait, explore what we're working on!
              </p>
            </div>

            {/* Suggestions Section */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Projects */}
              <div
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-red-500 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push("/projects")}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-red-600/20 rounded-lg mb-4 group-hover:bg-red-600/30 transition">
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">
                  Explore Projects
                </h3>
                <p className="text-gray-400 text-sm">
                  Check out innovative projects by our members
                </p>
              </div>

              {/* Blog */}
              <div
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-red-500 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push("/blogs")}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-lg mb-4 group-hover:bg-blue-600/30 transition">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">
                  Read Our Blogs
                </h3>
                <p className="text-gray-400 text-sm">
                  Learn from articles and insights shared by our community
                </p>
              </div>

              {/* Events */}
              <div
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-red-500 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push("/events")}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-green-600/20 rounded-lg mb-4 group-hover:bg-green-600/30 transition">
                  <svg
                    className="w-6 h-6 text-green-500"
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
                </div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">
                  View Events
                </h3>
                <p className="text-gray-400 text-sm">
                  Stay updated with our upcoming and past events
                </p>
              </div>
            </div>

            {/* Home Button */}
            <div className="text-center">
              <button
                onClick={() => router.push("/")}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition font-bold shadow-lg hover:shadow-xl"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="bg-black min-h-screen pt-20 pb-10">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-600 mb-4">
              Join ECAST
            </h1>
            <p className="text-lg text-gray-400">
              Become a part of our community of innovators and learners
            </p>
            <div className="w-24 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>

          {/* Status Banner */}
          <div className="mb-8 bg-green-900/30 border-l-4 border-green-500 p-6 rounded-r-lg shadow-sm">
            <div className="flex items-center mb-2">
              <svg
                className="w-6 h-6 mr-3 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-green-400 font-semibold text-lg">
                Enrollment is Currently Open!
              </span>
            </div>
            {intakeStatus.end_date && (
              <p className="text-sm text-green-300 ml-9">
                Deadline:{" "}
                {new Date(intakeStatus.end_date).toLocaleString("en-NP", {
                  timeZone: "Asia/Kathmandu",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>

          {/* Available Batches */}
          {intakeStatus.available_batches &&
            intakeStatus.available_batches.length > 0 && (
              <div className="mb-8 bg-blue-900/30 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm">
                <p className="text-blue-300 font-semibold mb-3">
                  Available for Batches:
                </p>
                <div className="flex flex-wrap gap-2">
                  {intakeStatus.available_batches.map((batchCode) => {
                    const batchInfo = intakeInfo?.batches.find(
                      (b) => b.code === batchCode
                    );
                    return (
                      <span
                        key={batchCode}
                        className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium shadow-sm"
                      >
                        {batchInfo?.label || batchCode}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Form Container */}
          <div className="bg-gray-900 rounded-lg shadow-lg p-8 md:p-10 border border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label
                  className="block text-gray-300 font-semibold mb-2"
                  htmlFor="name"
                >
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition placeholder-gray-500"
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={isSubmitting || formSubmitted}
                />
              </div>

              {/* Roll No */}
              <div>
                <label
                  className="block text-gray-300 font-semibold mb-2"
                  htmlFor="rollNo"
                >
                  Campus Roll Number <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition placeholder-gray-500"
                  type="text"
                  id="rollNo"
                  name="rollNo"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                  placeholder="e.g., THA080BEI01"
                  required
                  disabled={isSubmitting || formSubmitted}
                />
              </div>

              {/* Batch and Department in Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Batch */}
                <div>
                  <label
                    className="block text-gray-300 font-semibold mb-2"
                    htmlFor="batch"
                  >
                    Batch <span className="text-red-600">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    id="batch"
                    name="batch"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    required
                    disabled={isSubmitting || formSubmitted}
                  >
                    <option value="">Select Year</option>
                    {intakeInfo?.batches.map((b) => {
                      const available = isBatchAvailable(b.code);
                      return (
                        <option
                          key={b.code}
                          value={b.code}
                          disabled={!available}
                          className={!available ? "text-gray-500" : ""}
                        >
                          {b.label} {!available ? "(Not Available)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label
                    className="block text-gray-300 font-semibold mb-2"
                    htmlFor="department"
                  >
                    Department <span className="text-red-600">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    id="department"
                    name="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    disabled={isSubmitting || formSubmitted}
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept.code} value={dept.code}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact and Email in Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Phone */}
                <div>
                  <label
                    className="block text-gray-300 font-semibold mb-2"
                    htmlFor="phone"
                  >
                    Contact Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition placeholder-gray-500"
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number"
                    required
                    disabled={isSubmitting || formSubmitted}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    className="block text-gray-300 font-semibold mb-2"
                    htmlFor="email"
                  >
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition placeholder-gray-500"
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    disabled={isSubmitting || formSubmitted}
                  />
                </div>
              </div>

              {/* About */}
              <div>
                <label
                  className="block text-gray-300 font-semibold mb-2"
                  htmlFor="about"
                >
                  About Yourself <span className="text-red-600">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none placeholder-gray-500"
                  id="about"
                  name="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell us about yourself in a few words"
                  rows={4}
                  required
                  disabled={isSubmitting || formSubmitted}
                />
              </div>

              {/* Position */}
              <div>
                <label
                  className="block text-gray-300 font-semibold mb-2"
                  htmlFor="positions"
                >
                  Position You Want To Apply For{" "}
                  <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  id="positions"
                  name="positions"
                  value={positions}
                  onChange={(e) => setPositions(e.target.value)}
                  required
                  disabled={isSubmitting || formSubmitted}
                >
                  <option value="">Select Position</option>
                  <option value="TRD">
                    Technical Research & Development Unit
                  </option>
                  <option value="SMM">Social Media Manager</option>

                  <option value="GD">Graphic Design</option>
                  <option value="VE">Video Editor</option>
                  <option value="CW">Content Writer</option>
                  <option value="EC">External Affairs</option>
                </select>
              </div>

              {/* Reason to Join */}
              <div>
                <label
                  className="block text-gray-300 font-semibold mb-2"
                  htmlFor="reason_to_join"
                >
                  Why Do You Want To Join ECAST?{" "}
                  <span className="text-red-600">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none placeholder-gray-500"
                  id="reason_to_join"
                  name="reason_to_join"
                  value={reason_to_join}
                  onChange={(e) => setReason_to_join(e.target.value)}
                  placeholder="Tell us why you're interested in joining ECAST"
                  rows={4}
                  required
                  disabled={isSubmitting || formSubmitted}
                />
              </div>

              {/* Skills and Interests */}
              <div>
                <label
                  className="block text-gray-300 font-semibold mb-2"
                  htmlFor="interest"
                >
                  Skills and Interests <span className="text-red-600">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none placeholder-gray-500"
                  id="interest"
                  name="interest"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  placeholder="Mention your skills, interests, and any additional positions you'd like to consider"
                  rows={4}
                  required
                  disabled={isSubmitting || formSubmitted}
                />
              </div>

              {/* Time Availability */}
              <div>
                <label
                  className="block text-gray-300 font-semibold mb-2"
                  htmlFor="time_availability"
                >
                  Time Availability
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none placeholder-gray-500"
                  id="time_availability"
                  name="time_availability"
                  value={timeAvailability}
                  onChange={(e) => setTimeAvailability(e.target.value)}
                  placeholder="When can you typically contribute? e.g., 5 hrs/week, evenings, weekends"
                  rows={3}
                  disabled={isSubmitting || formSubmitted}
                />
              </div>

              {/* Resume Upload */}
              <div>
                <label
                  className="block text-gray-300 font-semibold mb-2"
                  htmlFor="cv"
                >
                  Upload Your CV <span className="text-red-600">*</span>{" "}
                  <span className="text-sm text-gray-500 font-normal">
                    (PDF only)
                  </span>
                </label>
                <input
                  className="hidden"
                  type="file"
                  id="cv"
                  name="cv"
                  onChange={handleFileChange}
                  accept=".pdf"
                  required
                  disabled={isSubmitting || formSubmitted}
                />
                <button
                  type="button"
                  onClick={handleFileClick}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-700 bg-gray-800 rounded-lg hover:border-red-500 transition text-gray-400 hover:text-red-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || formSubmitted}
                >
                  {resumeName ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {resumeName}
                    </span>
                  ) : (
                    "Choose PDF File"
                  )}
                </button>
              </div>

              {/* Social Links */}
              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">
                  Social Media Links
                </h3>

                {/* Facebook */}
                <div className="mb-4">
                  <label
                    className="block text-gray-300 font-semibold mb-2"
                    htmlFor="link3"
                  >
                    Facebook Profile <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition placeholder-gray-500"
                    type="url"
                    id="link3"
                    name="link3"
                    value={link3}
                    onChange={(e) => setLink3(e.target.value)}
                    placeholder="https://facebook.com/yourprofile"
                    required
                    disabled={isSubmitting || formSubmitted}
                  />
                </div>

                {/* LinkedIn */}
                <div className="mb-4">
                  <label
                    className="block text-gray-300 font-semibold mb-2"
                    htmlFor="link1"
                  >
                    LinkedIn Profile{" "}
                    <span className="text-gray-500 text-sm font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition placeholder-gray-500"
                    type="url"
                    id="link1"
                    name="link1"
                    value={link1}
                    onChange={(e) => setLink1(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    disabled={isSubmitting || formSubmitted}
                  />
                </div>

                {/* GitHub */}
                <div>
                  <label
                    className="block text-gray-300 font-semibold mb-2"
                    htmlFor="link2"
                  >
                    GitHub Profile{" "}
                    <span className="text-gray-500 text-sm font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition placeholder-gray-500"
                    type="url"
                    id="link2"
                    name="link2"
                    value={link2}
                    onChange={(e) => setLink2(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    disabled={isSubmitting || formSubmitted}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-300 ${
                    isSubmitting || formSubmitted
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                  disabled={isSubmitting || formSubmitted}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-3"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Submitting...
                    </span>
                  ) : formSubmitted ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="w-6 h-6 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Submitted Successfully!
                    </span>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Success Modal */}
          {formSubmitted && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
              <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg
                      className="h-10 w-10 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Application Submitted!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for your application. We'll review it and get back
                    to you soon.
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Redirecting to homepage...
                  </p>
                </div>
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                  onClick={() => redirectToHome()}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default JoinUs;
