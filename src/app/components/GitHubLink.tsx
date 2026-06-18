import { Github, ExternalLink, Star } from "lucide-react";

export const REPO_URL = "https://github.com/nhatnhm1405/API-Testing-Lab";

type Variant = "icon" | "pill" | "card";

interface GitHubLinkProps {
  /** "icon" = nút tròn nhỏ (NavBar) · "pill" = thanh bo tròn · "card" = thẻ to có viền */
  variant?: Variant;
  url?: string;
  label?: string;
}

/**
 * Nút nhỏ dẫn tới repo GitHub. Dùng <a> + target _blank nên hợp với mọi màn.
 * Giữ đúng ngôn ngữ giấy ấm / tactile của app (Bricolage display, viền #ECE8E1…).
 */
export function GitHubLink({
  variant = "pill",
  url = REPO_URL,
  label = "View on GitHub",
}: GitHubLinkProps) {
  const common = {
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": "Open the project on GitHub",
  } as const;

  if (variant === "icon") {
    return (
      <a
        {...common}
        title="View source on GitHub"
        style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6B6A7B', textDecoration: 'none', transition: 'background .15s,color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F2EFEA'; e.currentTarget.style.color = '#1C1B2A'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B6A7B'; }}
      >
        <Github size={19} strokeWidth={2} />
      </a>
    );
  }

  if (variant === "card") {
    return (
      <a
        {...common}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: '#FFF', border: '1.5px solid #ECE8E1', borderRadius: 16,
          padding: '14px 18px', textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(28,27,42,.05)', transition: 'transform .18s,box-shadow .18s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(28,27,42,.10)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(28,27,42,.05)'; }}
      >
        <div style={{
          width: 40, height: 40, flexShrink: 0, borderRadius: 12,
          background: 'linear-gradient(135deg,#1C1B2A,#3A3950)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18),0 4px 12px rgba(28,27,42,.25)',
        }}>
          <Github size={20} color="white" strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--atl-font-display)', fontSize: '15px', fontWeight: 800, color: '#1C1B2A', lineHeight: 1.2 }}>
            {label}
          </div>
          <div style={{ fontFamily: 'var(--atl-font-body)', fontSize: '12px', color: '#A7A3AD', fontWeight: 500 }}>
            nhatnhm1405/API-Testing-Lab
          </div>
        </div>
        <ExternalLink size={16} color="#A7A3AD" style={{ flexShrink: 0 }} />
      </a>
    );
  }

  // pill (default)
  return (
    <a
      {...common}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: '#1C1B2A', color: '#FFF', textDecoration: 'none',
        borderRadius: '100px', padding: '8px 14px',
        fontFamily: 'var(--atl-font-body)', fontSize: '13px', fontWeight: 700,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.15),0 4px 12px rgba(28,27,42,.22)',
        transition: 'transform .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
    >
      <Github size={15} strokeWidth={2.2} />
      <span>{label}</span>
      <Star size={12} fill="#E0A815" color="#E0A815" strokeWidth={0} />
    </a>
  );
}
