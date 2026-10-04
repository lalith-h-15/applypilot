import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, AlertTriangle, X, ShieldCheck, ShieldAlert } from "lucide-react";
import { getOpportunity } from "./api";
import "./OpportunityDetail.css";

// Backend status -> look. We only map values, never decide them.
const STATUS = {
  ELIGIBLE: { label: "Eligible", tone: "green", Icon: Check },
  UNCLEAR: { label: "Needs input", tone: "amber", Icon: AlertTriangle },
  NOT_ELIGIBLE: { label: "Not eligible", tone: "red", Icon: X },
};
const CHECK = { PASS: STATUS.ELIGIBLE, UNCLEAR: STATUS.UNCLEAR, FAIL: STATUS.NOT_ELIGIBLE };
const PRIORITY = { HIGH: "High priority", MEDIUM: "Medium priority", LOW: "Low priority" };

function Badge({ status }) {
  const { label, tone, Icon } = status;
  return (
    <span className={`od-badge ${tone}`}>
      <Icon size={14} /> {label}
    </span>
  );
}

function JobDescription({ text, quote }) {
  const i = quote ? text.indexOf(quote) : -1;
  if (i < 0) return <p className="od-jd">{text}</p>;
  const end = i + quote.length;
  return (
    <p className="od-jd">
      {text.slice(0, i)}
      <mark ref={(el) => el?.scrollIntoView({ block: "nearest" })}>{text.slice(i, end)}</mark>
      {text.slice(end)}
    </p>
  );
}

function SkillGroup({ title, skills, active, onPick }) {
  if (!skills.length) return null;
  return (
    <div className="od-group">
      <h4>{title}</h4>
      {skills.map((s) => (
        <button
          key={s.name}
          className={`od-row ${active === s.quote ? "active" : ""}`}
          onClick={() => onPick(s.quote)}
        >
          <span className={`od-mark ${s.matched ? "green" : ""}`}>{s.matched && <Check size={12} />}</span>
          <span className="od-name">{s.name}</span>
          <span className="od-sub">{s.matched ? "You have this" : "Not on your profile"}</span>
        </button>
      ))}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="od">
      <Link to="/opportunities" className="od-back">
        <ArrowLeft size={16} /> Opportunities
      </Link>
      {children}
    </div>
  );
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing | error
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    let stale = false;
    setState("loading");
    getOpportunity(id)
      .then((d) => {
        if (stale) return;
        setData(d);
        setState(d ? "ready" : "missing");
      })
      .catch(() => !stale && setState("error"));
    return () => {
      stale = true;
    };
  }, [id]);

  if (state === "loading") return <Shell><p className="od-note">Loading opportunity…</p></Shell>;
  if (state === "missing") return <Shell><p className="od-note">We couldn't find this opportunity.</p></Shell>;
  if (state === "error")
    return <Shell><p className="od-note">Couldn't load this opportunity. Check your connection and refresh.</p></Shell>;

  const status = STATUS[data.eligibility.status] ?? STATUS.UNCLEAR;
  const required = data.skills.filter((s) => s.type === "required");
  const preferred = data.skills.filter((s) => s.type === "preferred");

  return (
    <Shell>
      <header className="od-head">
        <div>
          <h1>{data.title}</h1>
          <p className="od-company">{data.company}</p>
        </div>
        <span className={`od-priority ${data.priority}`}>
          <i /> {PRIORITY[data.priority] ?? data.priority}
        </span>
      </header>

      <div className="od-grid">
        <section className="od-card">
          <h2>Job description</h2>
          <JobDescription text={data.jdText} quote={quote} />
        </section>

        <div className="od-side">
          <section className="od-card">
            <h2>Extracted requirements</h2>
            <p className="od-hint">Select a skill to see where it appears in the job description.</p>
            <SkillGroup title="Required" skills={required} active={quote} onPick={setQuote} />
            <SkillGroup title="Preferred" skills={preferred} active={quote} onPick={setQuote} />
            <div className={`od-verify ${data.verified ? "ok" : "warn"}`}>
              {data.verified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
              {data.verified ? "Source verified" : "Source not verified"}
            </div>
          </section>

          <section className="od-card">
            <div className="od-split">
              <h2>Eligibility</h2>
              <Badge status={status} />
            </div>
            {data.eligibility.checks.map((c) => (
              <button
                key={c.rule}
                className={`od-row ${quote === c.quote ? "active" : ""}`}
                onClick={() => setQuote(c.quote)}
              >
                <span className={`od-mark ${CHECK[c.status]?.tone}`}>
                  {c.status === "PASS" ? <Check size={12} /> : c.status === "FAIL" ? <X size={12} /> : "!"}
                </span>
                <span className="od-name">{c.rule}</span>
              </button>
            ))}
          </section>

          <section className="od-card">
            <div className="od-split">
              <h2>Match score</h2>
              <strong className="od-score">{data.matchScore}%</strong>
            </div>
            <div className="od-bar" role="img" aria-label={`Match score ${data.matchScore}%`}>
              <div style={{ width: `${data.matchScore}%` }} />
            </div>
          </section>

          <button
            className="od-btn"
            disabled={!data.canPrepare}
            onClick={() => navigate(`/opportunities/${data.id}/application`)} // confirm route with Vikas
          >
            Prepare application
          </button>
          {!data.canPrepare && <p className="od-hint">Application can't be prepared for this opportunity yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
