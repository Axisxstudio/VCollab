import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { routes } from "../../config/routes";
import { useQuery } from "@tanstack/react-query";
import { searchPublicProfiles } from "../../services/profile.service";
import {
  ROLE_FILTER_OPTIONS,
  buildDiscoveryParams,
  buildDiscoveryQueryKey,
  formatRole,
  getProfilePath,
  truncateText
} from "../../utils/discovery";

export default function ContributorSearchPanel() {
  const [filters, setFilters] = useState({
    query: "",
    role: ""
  });
  const [size, setSize] = useState(6);

  const queryKey = buildDiscoveryQueryKey("contributor-discovery", filters, size);
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey,
    queryFn: () => searchPublicProfiles(buildDiscoveryParams(filters, 0, size))
  });

  const contributors = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || contributors.length;

  const handleChange = (field, value) => {
    setSize(6);
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const handleReset = () => {
    setSize(6);
    setFilters({
      query: "",
      role: ""
    });
  };

  const gridRef = useRef(null);

  // Auto-scroll logic for mobile carousel
  useEffect(() => {
    if (!gridRef.current || contributors.length <= 1) return;

    let isMobile = window.innerWidth <= 900;
    const handleResize = () => { isMobile = window.innerWidth <= 900; };
    window.addEventListener("resize", handleResize);

    const interval = setInterval(() => {
      if (isMobile && gridRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = gridRef.current;
        const cardWidth = gridRef.current.children[0]?.offsetWidth || 0;
        
        // If we've reached the end, snap back to start
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          gridRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll to the next card
          gridRef.current.scrollBy({ left: cardWidth + 16, behavior: 'smooth' }); // 16 is the gap
        }
      }
    }, 4000); // Swipe every 4 seconds

    // Pause auto-scroll on interaction
    const handleTouchStart = () => clearInterval(interval);
    gridRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
      if (gridRef.current) {
        gridRef.current.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [contributors.length]);

  return (
    <section className="card" style={{ padding: '16px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#65676b' }}>Suggested for you</h3>
        <Link to={routes.projects} style={{ fontSize: '0.85rem', color: '#1877f2', textDecoration: 'none', fontWeight: 600 }}>See All</Link>
      </div>


      {isLoading ? (
        <div className="card discovery-empty">Loading contributors...</div>
      ) : isError ? (
        <div className="card discovery-empty">We could not load contributor discovery right now.</div>
      ) : contributors.length === 0 ? (
        <div className="card discovery-empty">
          <h4>No contributors match these filters yet</h4>
          <p>Try a broader role filter or remove your search terms.</p>
        </div>
      ) : (
        <div className="contributor-grid" ref={gridRef}>
          {contributors.map((contributor) => {
            const profilePath = getProfilePath(contributor.username);
            const avatarLabel = (contributor.fullName || contributor.username || "V")
              .charAt(0)
              .toUpperCase();

            return (
              <article key={contributor.id} className="contributor-card-ig">
                <button className="ig-card-close">×</button>
                <Link to={profilePath} className="ig-avatar-wrapper">
                  {contributor.profileImage ? (
                    <img src={contributor.profileImage} alt={contributor.fullName || contributor.username} />
                  ) : (
                    <div className="ig-avatar-placeholder">{avatarLabel}</div>
                  )}
                </Link>

                <div className="ig-card-info">
                  <Link to={profilePath} className="ig-username">
                    {contributor.username || "user"}
                  </Link>
                  <div className="ig-fullname">
                    {contributor.fullName}
                  </div>
                  <div className="ig-meta">
                    {formatRole(contributor.role)}
                  </div>
                </div>

                <div className="ig-card-footer">
                  <Link to={profilePath} className="btn-ig-primary">
                    View Profile
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {contributors.length < totalElements && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="btn-outline"
            style={{ width: '100%', padding: '8px', fontSize: '0.85rem', borderRadius: '8px', fontWeight: 600 }}
            onClick={() => setSize((current) => current + 6)}
            disabled={isFetching}
          >
            {isFetching ? "Loading..." : "View More"}
          </button>
        </div>
      )}
    </section>
  );
}
