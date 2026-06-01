import { useState, useEffect, useRef, useCallback } from "react";

// Securely read the token from environment variables instead of hardcoding it
const API_TOKEN = import.meta.env.VITE_TMDB_API_TOKEN; 
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const headers = { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" };

const fetcher = (url) => fetch(url, { headers }).then((r) => r.json());

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; } catch { return init; }
  });
  const write = useCallback((v) => {
    setVal(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  return [val, write];
}

const GENRES_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize: 22,
            cursor: "pointer",
            color: s <= (hover || value) ? "#E6B31E" : "#444",
            transition: "color 0.15s",
          }}
        >★</span>
      ))}
    </div>
  );
}

function ScoreBadge({ score }) {
  const pct = Math.round(score * 10);
  const color = pct >= 70 ? "#21D07A" : pct >= 50 ? "#D2D531" : "#DB2360";
  return (
    <div style={{
      width: 46, height: 46, borderRadius: "50%",
      background: "#081C22", border: `3px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>
        {pct}<span style={{ fontSize: 8 }}>%</span>
      </span>
    </div>
  );
}

function MovieCard({ movie, onClick, isInWatchlist, onWatchlistToggle }) {
  const [hovered, setHovered] = useState(false);
  const poster = movie.poster_path ? `${IMG}/w342${movie.poster_path}` : null;
  const year = movie.release_date?.slice(0, 4);

  return (
    <div
      onClick={() => onClick(movie)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", cursor: "pointer", borderRadius: 6, overflow: "hidden",
        background: "#1a1a2e",
        transform: hovered ? "scale(1.04) translateY(-4px)" : "scale(1)",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s",
        boxShadow: hovered ? "0 20px 60px rgba(0,0,0,0.7)" : "0 4px 16px rgba(0,0,0,0.4)",
        zIndex: hovered ? 2 : 1,
      }}
    >
      <div style={{ aspectRatio: "2/3", background: "#111" }}>
        {poster ? (
          <img src={poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a2e", padding: 16, textAlign: "center" }}>
            <span style={{ color: "#666", fontSize: 13 }}>{movie.title}</span>
          </div>
        )}
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
        padding: "32px 10px 10px",
        opacity: hovered ? 1 : 0, transition: "opacity 0.2s",
      }}>
        <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, margin: "0 0 4px", lineHeight: 1.3 }}>{movie.title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {year && <span style={{ color: "#aaa", fontSize: 11 }}>{year}</span>}
          <span style={{ color: "#E6B31E", fontSize: 11 }}>★ {movie.vote_average?.toFixed(1)}</span>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onWatchlistToggle(movie); }}
        style={{
          position: "absolute", top: 8, right: 8,
          background: isInWatchlist ? "#E6B31E" : "rgba(0,0,0,0.7)",
          border: "none", borderRadius: "50%", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 14, transition: "all 0.2s",
          opacity: hovered ? 1 : 0,
          color: isInWatchlist ? "#000" : "#fff",
        }}
        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        {isInWatchlist ? "✓" : "+"}
      </button>
    </div>
  );
}

function HeroSlider({ movies, onMovieClick }) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timer = useRef(null);

  const go = useCallback((i) => {
    setFade(false);
    setTimeout(() => { setIndex(i); setFade(true); }, 300);
  }, []);

  useEffect(() => {
    if (!movies.length) return;
    timer.current = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIndex((p) => (p + 1) % Math.min(movies.length, 8)); setFade(true); }, 300);
    }, 6000);
    return () => clearInterval(timer.current);
  }, [movies.length]);

  const movie = movies[index];
  if (!movie) return null;

  const backdrop = movie.backdrop_path ? `${IMG}/original${movie.backdrop_path}` : null;
  const year = movie.release_date?.slice(0, 4);
  const genres = (movie.genre_ids || []).slice(0, 3).map((id) => GENRES_MAP[id]).filter(Boolean);

  return (
    <div style={{ position: "relative", height: "80vh", minHeight: 520, overflow: "hidden", background: "#060606" }}>
      {backdrop && (
        <div style={{ position: "absolute", inset: 0, opacity: fade ? 1 : 0, transition: "opacity 0.4s" }}>
          <img src={backdrop} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(6,6,6,0.95) 0%, rgba(6,6,6,0.6) 50%, rgba(6,6,6,0.15) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,6,6,1) 0%, rgba(6,6,6,0) 40%)" }} />
        </div>
      )}

      <div style={{
        position: "absolute", bottom: "12%", left: 0, right: 0, padding: "0 5%",
        opacity: fade ? 1 : 0, transition: "opacity 0.4s",
        maxWidth: 620,
        zIndex: 5
      }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {genres.map((g) => (
            <span key={g} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E6B31E", border: "1px solid rgba(230,179,30,0.4)", padding: "3px 10px", borderRadius: 3 }}>{g}</span>
          ))}
        </div>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", lineHeight: 1.1, fontFamily: "'Playfair Display', serif", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
          {movie.title}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <span style={{ color: "#E6B31E", fontWeight: 700 }}>★ {movie.vote_average?.toFixed(1)}</span>
          {year && <span style={{ color: "#888" }}>{year}</span>}
          <ScoreBadge score={movie.vote_average} />
        </div>
        <p style={{ color: "#ccc", fontSize: 15, lineHeight: 1.7, margin: "0 0 24px", maxWidth: 520 }}>
          {movie.overview?.slice(0, 200)}{movie.overview?.length > 200 ? "..." : ""}
        </p>
        <button
          onClick={() => onMovieClick(movie)}
          style={{
            background: "#E6B31E", color: "#000", border: "none", borderRadius: 6,
            padding: "12px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer",
            letterSpacing: "0.04em", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f5c842"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#E6B31E"; }}
        >
          View Details
        </button>
      </div>

      <div style={{ position: "absolute", bottom: "10%", right: "5%", display: "flex", gap: 8, zIndex: 5 }}>
        {movies.slice(0, 8).map((_, i) => (
          <button
            key={i} onClick={() => go(i)}
            style={{
              width: i === index ? 28 : 8, height: 8, borderRadius: 4, border: "none",
              background: i === index ? "#E6B31E" : "rgba(255,255,255,0.3)",
              cursor: "pointer", transition: "all 0.3s", padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MovieRow({ title, movies, onMovieClick, watchlist, onWatchlistToggle, accentColor = "#E6B31E" }) {
  const rowRef = useRef(null);
  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 5%", marginBottom: 16 }}>
        <span style={{ width: 4, height: 24, background: accentColor, borderRadius: 2, flexShrink: 0 }} />
        <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "'Playfair Display', serif" }}>{title}</h3>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {["‹", "›"].map((arrow, i) => (
            <button key={arrow} onClick={() => scroll(i === 0 ? -1 : 1)}
              style={{
                background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
                width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            >{arrow}</button>
          ))}
        </div>
      </div>

      <div ref={rowRef} style={{
        display: "flex", gap: 12, padding: "8px 5%",
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {movies.map((m) => (
          <div key={m.id} style={{ flexShrink: 0, width: 160 }}>
            <MovieCard
              movie={m}
              onClick={onMovieClick}
              isInWatchlist={watchlist.some((w) => w.id === m.id)}
              onWatchlistToggle={onWatchlistToggle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CastCard({ person }) {
  const photo = person.profile_path ? `${IMG}/w185${person.profile_path}` : null;
  return (
    <div style={{ flexShrink: 0, width: 120, textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", margin: "0 auto 8px", background: "#1a1a2e", border: "2px solid #333" }}>
        {photo ? (
          <img src={photo} alt={person.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 22 }}>👤</div>
        )}
      </div>
      <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, margin: "0 0 3px" }}>{person.name}</p>
      <p style={{ color: "#888", fontSize: 11, margin: 0 }}>{person.character}</p>
    </div>
  );
}

function MovieModal({ movieId, onClose, watchlist, onWatchlistToggle, reviews, onAddReview }) {
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("about");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    setTab("about");
    scrollRef.current?.scrollTo(0, 0);
    Promise.all([
      fetcher(`${BASE}/movie/${movieId}?language=en-US`),
      fetcher(`${BASE}/movie/${movieId}/credits?language=en-US`),
      fetcher(`${BASE}/movie/${movieId}/similar?language=en-US&page=1`),
    ]).then(([m, c, s]) => {
      setMovie(m);
      setCredits(c);
      setSimilar(s.results?.slice(0, 12) || []);
      setLoading(false);
    });
  }, [movieId]);

  const handleReview = () => {
    if (!reviewText.trim() || !reviewRating) return;
    onAddReview(movieId, { text: reviewText, rating: reviewRating, date: new Date().toLocaleDateString() });
    setReviewText("");
    setReviewRating(0);
  };

  const movieReviews = reviews[movieId] || [];
  const isWatchlisted = watchlist.some((w) => w.id === movieId);

  if (!movieId) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "20px 16px", overflowY: "auto", backdropFilter: "blur(6px)",
      }}
    >
      <div
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0D0D0D", borderRadius: 12, width: "100%", maxWidth: 900,
          overflow: "hidden", border: "1px solid #222",
          boxShadow: "0 40px 120px rgba(0,0,0,0.9)",
        }}
      >
        {loading ? (
          <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #333", borderTopColor: "#E6B31E", borderRadius: "50%" }} />
          </div>
        ) : movie ? (
          <>
            <div style={{ position: "relative", height: 340, background: "#060606", overflow: "hidden" }}>
              {movie.backdrop_path && (
                <>
                  <img src={`${IMG}/original${movie.backdrop_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,13,13,0) 0%, rgba(13,13,13,0.85) 70%, rgba(13,13,13,1) 100%)" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,13,13,0.7) 0%, transparent 60%)" }} />
                </>
              )}
              <button
                onClick={onClose}
                style={{
                  position: "absolute", top: 16, right: 16,
                  background: "rgba(0,0,0,0.7)", border: "1px solid #333",
                  color: "#fff", borderRadius: "50%", width: 36, height: 36,
                  cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>

              <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {movie.genres?.map((g) => (
                    <span key={g.id} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E6B31E", border: "1px solid rgba(230,179,30,0.4)", padding: "3px 10px", borderRadius: 3 }}>{g.name}</span>
                  ))}
                </div>
                <h2 style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: "0 0 12px", fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>{movie.title}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <ScoreBadge score={movie.vote_average} />
                  <div>
                    <p style={{ color: "#888", fontSize: 11, margin: "0 0 2px" }}>User Score</p>
                    <p style={{ color: "#E6B31E", fontWeight: 700, margin: 0 }}>★ {movie.vote_average?.toFixed(1)} / 10</p>
                  </div>
                  {movie.release_date && <span style={{ color: "#888", fontSize: 14 }}>{movie.release_date?.slice(0, 4)}</span>}
                  {movie.runtime && <span style={{ color: "#888", fontSize: 14 }}>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
                  <button
                    onClick={() => onWatchlistToggle(movie)}
                    style={{
                      background: isWatchlisted ? "#E6B31E" : "transparent",
                      border: `1px solid ${isWatchlisted ? "#E6B31E" : "#555"}`,
                      color: isWatchlisted ? "#000" : "#fff",
                      borderRadius: 6, padding: "8px 20px", cursor: "pointer",
                      fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                    }}
                  >
                    {isWatchlisted ? "✓ Watchlisted" : "+ Watchlist"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", borderBottom: "1px solid #222", padding: "0 24px" }}>
              {["about", "cast", "reviews", "similar"].map((t) => (
                <button
                  key={t} onClick={() => setTab(t)}
                  style={{
                    background: "none", border: "none", color: tab === t ? "#E6B31E" : "#666",
                    borderBottom: tab === t ? "2px solid #E6B31E" : "2px solid transparent",
                    padding: "14px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14,
                    textTransform: "capitalize", transition: "color 0.2s", letterSpacing: "0.03em",
                  }}
                >{t}</button>
              ))}
            </div>

            <div style={{ padding: "28px 24px", minHeight: 280 }}>
              {tab === "about" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                  <div>
                    <p style={{ color: "#ccc", fontSize: 15, lineHeight: 1.8, margin: "0 0 24px" }}>{movie.overview || "No overview available."}</p>
                    {movie.tagline && (
                      <p style={{ color: "#E6B31E", fontStyle: "italic", borderLeft: "3px solid #E6B31E", paddingLeft: 16, margin: "0 0 24px" }}>"{movie.tagline}"</p>
                    )}
                  </div>
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {[
                        ["Status", movie.status],
                        ["Language", movie.original_language?.toUpperCase()],
                        ["Budget", movie.budget ? `$${(movie.budget / 1e6).toFixed(0)}M` : "N/A"],
                        ["Revenue", movie.revenue ? `$${(movie.revenue / 1e6).toFixed(0)}M` : "N/A"],
                      ].map(([label, value]) => value && (
                        <div key={label} style={{ background: "#161616", borderRadius: 8, padding: "14px 16px", border: "1px solid #222" }}>
                          <p style={{ color: "#666", fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                          <p style={{ color: "#fff", fontWeight: 600, margin: 0, fontSize: 15 }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === "cast" && (
                <div>
                  <div style={{ display: "flex", gap: 24, overflowX: "auto", padding: "8px 0", scrollbarWidth: "none" }}>
                    {credits?.cast?.slice(0, 20).map((p) => <CastCard key={p.id} person={p} />)}
                  </div>
                </div>
              )}

              {tab === "reviews" && (
                <div>
                  <div style={{ background: "#161616", borderRadius: 10, padding: "20px", border: "1px solid #222", marginBottom: 28 }}>
                    <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 12px" }}>Write your review</p>
                    <StarRating value={reviewRating} onChange={setReviewRating} />
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your thoughts..."
                      style={{
                        width: "100%", marginTop: 14, background: "#0a0a0a", border: "1px solid #333",
                        borderRadius: 8, color: "#fff", fontSize: 14, padding: "12px 14px",
                        resize: "vertical", minHeight: 90, outline: "none", fontFamily: "inherit",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      onClick={handleReview}
                      style={{
                        marginTop: 12, background: "#E6B31E", border: "none", color: "#000",
                        padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13,
                      }}
                    >Post Review</button>
                  </div>
                  {movieReviews.length === 0 ? (
                    <p style={{ color: "#555", textAlign: "center", padding: 32 }}>No reviews yet. Be the first.</p>
                  ) : movieReviews.map((r, i) => (
                    <div key={i} style={{ background: "#161616", borderRadius: 10, padding: 20, border: "1px solid #222", marginBottom: 12 }}>
                      <p style={{ color: "#E6B31E", fontSize: 13, margin: 0 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                      <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7, margin: "6px 0 0" }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === "similar" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                  {similar.map((m) => (
                    <MovieCard key={m.id} movie={m} onClick={() => {}} isInWatchlist={watchlist.some((w) => w.id === m.id)} onWatchlistToggle={onWatchlistToggle} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SearchOverlay({ onClose, onMovieClick, watchlist, onWatchlistToggle }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    debounce.current = setTimeout(() => {
      fetcher(`${BASE}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`)
        .then((d) => { setResults(d.results?.slice(0, 20) || []); setLoading(false); });
    }, 400);
  }, [query]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 2000, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px 40px" }}>
        <div style={{ position: "relative", marginBottom: 40 }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 22, color: "#666" }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies..."
            style={{
              width: "100%", background: "#161616", border: "1px solid #333",
              color: "#fff", fontSize: 20, padding: "16px 20px 16px 52px",
              borderRadius: 10, outline: "none", boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          <button onClick={onClose} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        {results.map((m) => (
          <MovieCard key={m.id} movie={m} onClick={(mv) => { onMovieClick(mv); onClose(); }} isInWatchlist={watchlist.some((w) => w.id === m.id)} onWatchlistToggle={onWatchlistToggle} />
        ))}
      </div>
    </div>
  );
}

function WatchlistPanel({ watchlist, onClose, onMovieClick, onRemove }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1500, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(420px, 100%)", background: "#0d0d0d", height: "100%",
        borderLeft: "1px solid #222", overflowY: "auto", padding: "28px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <h3 style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 22, margin: 0 }}>My Watchlist</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        {watchlist.length === 0 ? (
          <p style={{ color: "#555", textAlign: "center" }}>Your watchlist is empty.</p>
        ) : watchlist.map((m) => (
          <div key={m.id} style={{ display: "flex", gap: 14, marginBottom: 16, cursor: "pointer" }} onClick={() => { onMovieClick(m); onClose(); }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 600, margin: 0 }}>{m.title}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onRemove(m); }} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main App Component with completed hooks and content renderers
export default function App() {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  
  const [watchlist, setWatchlist] = useLocalStorage("watchlist", []);
  const [reviews, setReviews] = useLocalStorage("reviews", {});

  useEffect(() => {
    // Stop API calls if token isn't configured yet
    if (!API_TOKEN) return;

    Promise.all([
      fetcher(`${BASE}/trending/movie/day?language=en-US`),
      fetcher(`${BASE}/movie/popular?language=en-US&page=1`),
      fetcher(`${BASE}/movie/top_rated?language=en-US&page=1`)
    ]).then(([tData, pData, trData]) => {
      setTrending(tData.results || []);
      setPopular(pData.results || []);
      setTopRated(trData.results || []);
    }).catch(err => console.error("Error fetching TMDB metrics:", err));
  }, []);

  const toggleWatchlist = (movie) => {
    const exists = watchlist.some((m) => m.id === movie.id);
    if (exists) {
      setWatchlist(watchlist.filter((m) => m.id !== movie.id));
    } else {
      setWatchlist([...watchlist, movie]);
    }
  };

  const addReview = (movieId, review) => {
    setReviews({
      ...reviews,
      [movieId]: [review, ...(reviews[movieId] || [])]
    });
  };

  return (
    <div style={{ background: "#060606", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Navigation Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 5%", background: "rgba(6,6,6,0.8)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#E6B31E", fontFamily: "'Playfair Display', serif" }}>CINEPHILE</h1>
        <div style={{ display: "flex", gap: 20 }}>
          <button onClick={() => setSearchOpen(true)} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>🔍 Search</button>
          <button onClick={() => setWatchlistOpen(true)} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>🎬 Watchlist ({watchlist.length})</button>
        </div>
      </header>

      {/* Primary Layout views */}
      {trending.length > 0 && <HeroSlider movies={trending} onMovieClick={(m) => setSelectedId(m.id)} />}
      
      <main style={{ marginTop: 40 }}>
        <MovieRow title="Trending Today" movies={trending} watchlist={watchlist} onWatchlistToggle={toggleWatchlist} onMovieClick={(m) => setSelectedId(m.id)} />
        <MovieRow title="Popular Hits" movies={popular} watchlist={watchlist} onWatchlistToggle={toggleWatchlist} onMovieClick={(m) => setSelectedId(m.id)} accentColor="#21D07A" />
        <MovieRow title="Top Rated Classics" movies={topRated} watchlist={watchlist} onWatchlistToggle={toggleWatchlist} onMovieClick={(m) => setSelectedId(m.id)} accentColor="#DB2360" />
      </main>

      {/* Global Overlays and Modals */}
      {selectedId && (
        <MovieModal 
          movieId={selectedId} 
          onClose={() => setSelectedId(null)} 
          watchlist={watchlist} 
          onWatchlistToggle={toggleWatchlist}
          reviews={reviews}
          onAddReview={addReview}
        />
      )}

      {searchOpen && (
        <SearchOverlay 
          onClose={() => setSearchOpen(false)} 
          watchlist={watchlist} 
          onWatchlistToggle={toggleWatchlist} 
          onMovieClick={(m) => setSelectedId(m.id)} 
        />
      )}

      {watchlistOpen && (
        <WatchlistPanel 
          watchlist={watchlist} 
          onClose={() => setWatchlistOpen(false)} 
          onMovieClick={(m) => setSelectedId(m.id)} 
          onRemove={toggleWatchlist} 
        />
      )}
    </div>
  );
}
