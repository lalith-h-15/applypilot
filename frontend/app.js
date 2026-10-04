/**
 * ApplyPilot - Vikas Module Client Application
 * Handles reactive UI, cryptographic display, claim rule inspection,
 * server-side approval enforcement, idempotent submission, and 9-step demo guide.
 */

const API_BASE = "";
let currentAppId = "APP-2026-VIKAS-8492";
let appState = null;
let autoRefreshTimer = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadApplication();
  // Poll activity logs every 4 seconds
  autoRefreshTimer = setInterval(refreshLogs, 4000);
});

async function loadApplication() {
  try {
    const res = await fetch(`${API_BASE}/api/applications/${currentAppId}`);
    if (!res.ok) {
      // If db was empty or reset, try reset first
      await fetch(`${API_BASE}/api/demo/reset`, { method: "POST" });
      const retry = await fetch(`${API_BASE}/api/applications/${currentAppId}`);
      appState = await retry.json();
    } else {
      appState = await res.json();
    }

    renderAll();
  } catch (err) {
    showToast(`Error loading application: ${err.message}`, "error");
  }
}

function renderAll() {
  if (!appState) return;

  const app = appState.application;
  const cand = appState.candidate_profile;
  const versionData = appState.current_version;
  const report = appState.validation_report;
  const deadline = appState.deadline_status;

  // Header & Status Badges
  document.getElementById("header-target-role").textContent = app.target_role;
  document.getElementById("header-target-company").textContent = app.target_company;

  // System status badge
  const sysBadge = document.getElementById("badge-system-status");
  const txtSys = document.getElementById("txt-system-status");
  txtSys.textContent = app.system_status;
  sysBadge.className = `badge badge-state-${app.system_status.toLowerCase().replace(/\s+/g, "-")}`;

  // Manual status badge
  const manBadge = document.getElementById("badge-manual-status");
  const txtMan = document.getElementById("txt-manual-status");
  txtMan.textContent = app.manual_status || "None";

  // Version
  document.getElementById("badge-version").textContent = `v${app.current_version}`;
  document.getElementById("approval-version-num").textContent = `v${app.current_version}`;

  // Hash
  const hash = versionData.integrity_hash || "";
  document.getElementById("txt-hash-short").textContent = `SHA-256: ${hash.slice(0, 10)}...${hash.slice(-6)}`;
  document.getElementById("approval-full-hash").textContent = hash;

  // Deadline
  const dlText = document.getElementById("approval-deadline-text");
  if (deadline.is_expired) {
    dlText.innerHTML = `<span style="color:#ef4444; font-weight:700;">EXPIRED (${deadline.description})</span>`;
  } else {
    dlText.innerHTML = `<span style="color:#10b981;">ACTIVE (Expires in future)</span>`;
  }

  // Checkboxes state
  document.getElementById("chk-student-reviewed").checked = Boolean(app.reviewed_by_student);
  document.getElementById("chk-student-approved").checked = Boolean(app.approved_by_student);

  // Token Box
  const tokenBox = document.getElementById("token-issued-container");
  if (app.is_approved && app.approval_token) {
    tokenBox.style.display = "flex";
    document.getElementById("token-val-text").textContent = app.approval_token;
    document.getElementById("token-expires-text").textContent = `Expires at: ${new Date(app.token_expires_at).toLocaleTimeString()} UTC`;
  } else {
    tokenBox.style.display = "none";
  }

  // Render Candidate Profile
  renderCandidateProfile(cand);

  // Render Preparation & Answers
  renderAnswersAndClaims(versionData.answers || [], report.all_claims || []);

  // Render Missing Info
  renderMissingInfo(report.missing_information || []);

  // Render Pipeline States
  renderPipeline(app.system_status);

  // Render Manual Status buttons
  renderManualStatusControls(app.manual_status);

  // If already submitted and receipts exist, show receipt
  if (appState.receipts && appState.receipts.length > 0) {
    displayReceipt(appState.receipts[0], false);
  } else {
    document.getElementById("receipt-display-card").style.display = "none";
  }

  refreshLogs();
}

function renderCandidateProfile(cand) {
  if (!cand) return;
  const skillsContainer = document.getElementById("candidate-skills-list");
  skillsContainer.innerHTML = (cand.skills || []).map(s => `<span class="pill-skill">${escapeHtml(s)}</span>`).join("");

  const expContainer = document.getElementById("candidate-exp-list");
  if (cand.experience && cand.experience.length > 0) {
    expContainer.innerHTML = cand.experience.map(e => `
      <div style="margin-top:0.35rem; padding:0.4rem; background:rgba(0,0,0,0.2); border-radius:4px;">
        <strong>${escapeHtml(e.role)}</strong> at <em>${escapeHtml(e.company)}</em> (${escapeHtml(e.period)})
        <div style="font-size:0.7rem; color:#94a3b8; margin-top:2px;">${escapeHtml(e.summary)}</div>
      </div>
    `).join("");
  } else {
    expContainer.innerHTML = "<em>No verified work experience listed.</em>";
  }
}

function renderAnswersAndClaims(answers, allClaims) {
  const container = document.getElementById("answers-container");
  if (!answers.length) {
    container.innerHTML = "<em>No answers drafted yet.</em>";
    return;
  }

  container.innerHTML = answers.map((ans, idx) => {
    // Find claims matching this question
    const qClaims = (allClaims || []).filter(c => {
      return ans.answer_text.includes(c.claim_text) || c.claim_text.includes(ans.answer_text.slice(0, 20));
    });

    return `
      <div class="answer-block">
        <div class="answer-question">
          <span style="color:#38bdf8;">Q${idx + 1}:</span> ${escapeHtml(ans.question_text)}
        </div>
        <div class="answer-text">${escapeHtml(ans.answer_text)}</div>

        <div style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); margin-top:0.35rem;">
          CLAIM VALIDATION & EVIDENCE TRACEABILITY:
        </div>
        <div class="claims-list">
          ${(ans.claims || qClaims || []).map(c => renderClaimCard(c)).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function renderClaimCard(claim) {
  let cardClass = "supported";
  let statusBadge = `<span class="badge" style="background:rgba(16,185,129,0.2); color:#6ee7b7; border-color:#10b981;">✓ SUPPORTED</span>`;

  if (claim.status === "UNSUPPORTED_EXPERIENCE_CLAIM") {
    cardClass = "violation";
    statusBadge = `<span class="badge" style="background:rgba(239,68,68,0.2); color:#fca5a5; border-color:#ef4444;">✗ VIOLATION: UNSUPPORTED EXPERIENCE</span>`;
  } else if (!claim.is_valid) {
    cardClass = "missing";
    statusBadge = `<span class="badge" style="background:rgba(245,158,11,0.2); color:#fde68a; border-color:#f59e0b;">⚠️ UNVERIFIED</span>`;
  }

  return `
    <div class="claim-card ${cardClass}">
      <div class="claim-header">
        <span class="claim-text">"${escapeHtml(claim.claim_text)}"</span>
        ${statusBadge}
      </div>
      <div class="claim-reason">${escapeHtml(claim.reason)}</div>
      ${claim.recommendation ? `<div class="claim-recommendation"><strong>Action:</strong> ${escapeHtml(claim.recommendation)}</div>` : ""}
    </div>
  `;
}

function renderMissingInfo(missingList) {
  const container = document.getElementById("missing-info-container");
  const listEl = document.getElementById("missing-info-list");
  if (!missingList || missingList.length === 0) {
    container.style.display = "none";
    return;
  }
  container.style.display = "block";
  listEl.innerHTML = missingList.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderPipeline(currentStatus) {
  const steps = ["Prepared", "Needs input", "Awaiting approval", "Approved", "Submitted", "Expired"];
  steps.forEach(s => {
    const el = document.getElementById(`step-state-${s}`);
    if (!el) return;
    el.className = "pipeline-step";
    if (s === currentStatus) {
      el.classList.add("active");
    }
  });
}

function renderManualStatusControls(activeManual) {
  ["none", "Interview", "Selected", "Rejected"].forEach(s => {
    const btn = document.getElementById(`btn-manual-${s}`);
    if (!btn) return;
    if ((s === "none" && !activeManual) || s === activeManual) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

async function testCustomClaim() {
  const input = document.getElementById("custom-claim-input");
  const text = input.value.trim();
  if (!text) {
    showToast("Please enter claim text to test.", "warning");
    return;
  }

  const resultBox = document.getElementById("custom-claim-result");
  resultBox.style.display = "block";
  resultBox.innerHTML = "<span style='font-size:0.75rem; color:#94a3b8;'>Testing claim against candidate profile...</span>";

  try {
    const res = await fetch(`${API_BASE}/api/validate-claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim_text: text, candidate_id: "CAND-VIKAS-01" })
    });
    const data = await res.json();
    resultBox.innerHTML = renderClaimCard(data);
  } catch (err) {
    resultBox.innerHTML = `<span style='color:#ef4444;'>Error: ${err.message}</span>`;
  }
}

function updateApprovalBtnState() {
  // Can provide visual feedback
}

async function executeApprove() {
  const reviewed = document.getElementById("chk-student-reviewed").checked;
  const approved = document.getElementById("chk-student-approved").checked;

  if (!reviewed || !approved) {
    showToast("Both Requirement 1 (Reviewed) and Requirement 2 (Approved) checkboxes must be checked!", "warning");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/applications/${currentAppId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewed_by_student: reviewed,
        approved_by_student: approved
      })
    });

    const data = await res.json();
    displayResponseInspector(res.status, data);

    if (res.ok) {
      showToast(`Application approved! Single-use token issued.`, "success");
      await loadApplication();
    } else {
      showToast(`Approval rejected: ${data.message || data.error}`, "error");
    }
  } catch (err) {
    showToast(`Approval error: ${err.message}`, "error");
  }
}

async function executeSubmit() {
  try {
    const startTime = performance.now();
    const res = await fetch(`${API_BASE}/api/applications/${currentAppId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const latency = Math.round(performance.now() - startTime);
    const data = await res.json();

    displayResponseInspector(res.status, data, latency);

    if (res.status === 403) {
      showToast(`HTTP 403 Forbidden: ${data.message}`, "error");
    } else if (res.status === 200) {
      if (data.is_duplicate) {
        showToast(`Idempotency enforced: Original receipt returned (0 duplicates)!`, "info");
      } else {
        showToast(`Submission successful! Receipt: ${data.receipt.receipt_id}`, "success");
      }
      displayReceipt(data.receipt, data.is_duplicate);
      await loadApplication();
    } else {
      showToast(`Submission failed (${res.status}): ${data.message || data.error}`, "error");
    }
  } catch (err) {
    showToast(`Submission error: ${err.message}`, "error");
  }
}

function displayResponseInspector(status, data, latency = 12) {
  const badge = document.getElementById("resp-status-badge");
  const bodyText = document.getElementById("resp-body-text");

  if (status === 200) {
    badge.innerHTML = `<span style="color:#10b981;">HTTP 200 OK (${latency}ms)</span>`;
  } else if (status === 403) {
    badge.innerHTML = `<span style="color:#ef4444;">HTTP 403 Forbidden (${latency}ms)</span>`;
  } else if (status === 422) {
    badge.innerHTML = `<span style="color:#f59e0b;">HTTP 422 Unprocessable (${latency}ms)</span>`;
  } else {
    badge.innerHTML = `<span style="color:#94a3b8;">HTTP ${status} (${latency}ms)</span>`;
  }

  bodyText.textContent = JSON.stringify(data, null, 2);
}

function displayReceipt(receipt, isDuplicate) {
  if (!receipt) return;
  const box = document.getElementById("receipt-display-card");
  box.style.display = "flex";

  const badge = document.getElementById("receipt-idempotency-badge");
  if (isDuplicate) {
    badge.textContent = "IDEMPOTENT CALL (SAME RECEIPT - NO DUPLICATE)";
    badge.style.background = "rgba(59, 130, 246, 0.2)";
    badge.style.borderColor = "#3b82f6";
    badge.style.color = "#93c5fd";
  } else {
    badge.textContent = "ORIGINAL SUBMISSION RECEIPT";
    badge.style.background = "rgba(16, 185, 129, 0.2)";
    badge.style.borderColor = "#10b981";
    badge.style.color = "#6ee7b7";
  }

  document.getElementById("rcpt-id-val").textContent = receipt.receipt_id;
  document.getElementById("rcpt-app-id-val").textContent = receipt.application_id;
  document.getElementById("rcpt-version-val").textContent = `v${receipt.version_number}`;
  document.getElementById("rcpt-hash-val").textContent = receipt.integrity_hash;
  document.getElementById("rcpt-timestamp-val").textContent = receipt.submitted_at;
  document.getElementById("rcpt-conf-val").textContent = receipt.portal_confirmation;
}

async function setManualStatus(status) {
  try {
    const res = await fetch(`${API_BASE}/api/applications/${currentAppId}/manual-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manual_status: status })
    });
    if (res.ok) {
      showToast(`Manual status updated to: ${status || 'None'}`, "info");
      await loadApplication();
    }
  } catch (err) {
    showToast(`Error updating manual status: ${err.message}`, "error");
  }
}

async function toggleDeadlineExpired() {
  const currentExpired = appState?.deadline_status?.is_expired;
  const newMode = currentExpired ? "future" : "past";
  try {
    await fetch(`${API_BASE}/api/applications/${currentAppId}/set-deadline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode })
    });
    showToast(`Deadline toggled to ${newMode}.`, "info");
    await loadApplication();
  } catch (err) {
    showToast(`Error toggling deadline: ${err.message}`, "error");
  }
}

function openEditAnswersModal() {
  if (!appState || !appState.current_version) return;
  const modal = document.getElementById("modal-edit-answers");
  const fields = document.getElementById("modal-edit-fields");
  const answers = appState.current_version.answers || [];

  fields.innerHTML = answers.map((a, i) => `
    <div>
      <label style="font-size:0.8rem; font-weight:600; color:#e2e8f0; display:block; margin-bottom:0.35rem;">
        Q${i + 1}: ${escapeHtml(a.question_text)}
      </label>
      <textarea id="edit-ans-${i}" rows="3" style="width:100%; background:#0b0f19; border:1px solid #334155; border-radius:var(--radius-sm); color:#f8fafc; padding:0.6rem; font-size:0.8rem; font-family:var(--font-sans);">${escapeHtml(a.answer_text)}</textarea>
    </div>
  `).join("");

  modal.classList.add("open");
}

function closeEditAnswersModal() {
  document.getElementById("modal-edit-answers").classList.remove("open");
}

async function saveEditedAnswers() {
  if (!appState || !appState.current_version) return;
  const currentAnswers = appState.current_version.answers || [];
  const updatedAnswers = currentAnswers.map((a, i) => {
    const val = document.getElementById(`edit-ans-${i}`).value;
    return {
      question_id: a.question_id,
      question_text: a.question_text,
      answer_text: val
    };
  });

  try {
    const res = await fetch(`${API_BASE}/api/applications/${currentAppId}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: updatedAnswers })
    });
    const data = await res.json();

    closeEditAnswersModal();
    if (res.ok) {
      if (data.approval_invalidated) {
        showToast(`Edited! Version bumped to v${data.new_version}. Previous approval was invalidated.`, "warning");
      } else {
        showToast(`Edited! Version bumped to v${data.new_version}.`, "success");
      }
      await loadApplication();
    } else {
      showToast(`Edit failed: ${data.error}`, "error");
    }
  } catch (err) {
    showToast(`Error saving edits: ${err.message}`, "error");
  }
}

function openPayloadModal() {
  if (!appState || !appState.current_version) return;
  const modal = document.getElementById("modal-payload");
  document.getElementById("modal-hash-full").textContent = `SHA-256 Digest: ${appState.current_version.integrity_hash}`;
  document.getElementById("modal-payload-content").textContent = appState.current_version.canonical_payload;
  modal.classList.add("open");
}

function closePayloadModal() {
  document.getElementById("modal-payload").classList.remove("open");
}

async function refreshLogs() {
  try {
    const res = await fetch(`${API_BASE}/api/activity-logs?application_id=${currentAppId}`);
    if (!res.ok) return;
    const data = await res.json();
    const stream = document.getElementById("activity-log-stream");
    if (!stream) return;

    if (!data.logs || data.logs.length === 0) {
      stream.innerHTML = "<em style='font-size:0.8rem; color:var(--text-muted);'>No activity logged yet.</em>";
      return;
    }

    stream.innerHTML = data.logs.map(log => `
      <div class="log-entry ${log.severity}">
        <div class="log-meta">
          <span style="font-weight:700; text-transform:uppercase;">${escapeHtml(log.event_type)}</span>
          <span>${formatTime(log.timestamp)}</span>
        </div>
        <div class="log-desc">${escapeHtml(log.description)}</div>
      </div>
    `).join("");
  } catch (e) {
    // Silent polling error
  }
}

async function resetDemo() {
  try {
    const res = await fetch(`${API_BASE}/api/demo/reset`, { method: "POST" });
    if (res.ok) {
      showToast("Demo database reset to initial pristine state.", "info");
      document.querySelectorAll(".btn-demo-step").forEach(b => b.classList.remove("active"));
      await loadApplication();
    }
  } catch (e) {
    showToast(`Reset error: ${e.message}`, "error");
  }
}

// =========================================================================
// 9-STEP INTERACTIVE DEMO SEQUENCE
// =========================================================================
async function demoStep(step) {
  document.querySelectorAll(".btn-demo-step").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById(`step-btn-${step}`);
  if (btn) btn.classList.add("active");

  switch(step) {
    case 1:
      // Try submitting before approval -> 403 Forbidden
      showToast("Step 1: Attempting submission without approval...", "info");
      await executeSubmit();
      break;

    case 2:
      // Approve application
      showToast("Step 2: Checking review & approval checkboxes, then approving...", "info");
      document.getElementById("chk-student-reviewed").checked = true;
      document.getElementById("chk-student-approved").checked = true;
      await executeApprove();
      break;

    case 3:
      // View Token generated & Hash
      showToast("Step 3: Inspecting issued single-use token bound to SHA-256...", "info");
      openPayloadModal();
      break;

    case 4:
      // Submit successfully
      showToast("Step 4: Submitting approved application with single-use token...", "info");
      await executeSubmit();
      break;

    case 5:
      // Submit again -> Idempotency test
      showToast("Step 5: Submitting again to test idempotency (no duplicate)...", "info");
      await executeSubmit();
      break;

    case 6:
      // Edit application after approval -> invalidates approval
      showToast("Step 6: Modifying answer to fix claim rule. Invalidation triggered...", "warning");
      // Provide valid answer addressing the React rule violation
      const fixedAnswers = [
        {
          question_id: "q1",
          question_text: "Describe a complex backend system you engineered and its architectural impact.",
          answer_text: "At CloudScale Technologies, I engineered high-throughput Python microservices handling 25M daily requests and architected a PostgreSQL database layer with 99.99% uptime."
        },
        {
          question_id: "q2",
          question_text: "What practical experience do you have with modern UI development?",
          answer_text: "React is listed as a skill in my technical toolkit. I am familiar with React component lifecycles and modern state management patterns."
        }
      ];
      const editRes = await fetch(`${API_BASE}/api/applications/${currentAppId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: fixedAnswers })
      });
      const editData = await editRes.json();
      displayResponseInspector(editRes.status, editData);
      showToast(`Answer updated! Approval invalidated, version bumped to v${editData.new_version}.`, "warning");
      await loadApplication();
      break;

    case 7:
      // Show SHA-256 hash and version change
      showToast(`Step 7: Version changed to v${appState.application.current_version} with fresh SHA-256 integrity hash!`, "info");
      openPayloadModal();
      break;

    case 8:
      // Scroll and highlight activity log
      showToast("Step 8: Inspecting timestamped audit activity log...", "info");
      document.getElementById("section-activity-log").scrollIntoView({ behavior: "smooth" });
      refreshLogs();
      break;

    case 9:
      // Show tracker state transitions
      showToast("Step 9: Observing independent System States vs Manual States pipeline...", "info");
      document.getElementById("section-tracker").scrollIntoView({ behavior: "smooth" });
      await setManualStatus("Interview");
      break;
  }
}

function showToast(msg, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `show ${type}`;
  setTimeout(() => {
    toast.className = "";
  }, 4000);
}

function formatTime(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoStr;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
