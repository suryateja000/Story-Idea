import React, { useState, useEffect } from 'react';
import './App.css'; // Your CSS file

// The base URL for your FastAPI backend API calls
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Story data is now defined directly in the frontend
const STORY_DATA = {
    genres: [
        "Fantasy", "Sci-Fi", "Mystery", "Romance", "Horror",
        "Thriller", "Historical", "Adventure", "Comedy", "Drama"
    ],
    themes: [
        "Love", "Identity", "Good vs Evil", "Survival", "Redemption",
        "Betrayal", "Family", "Friendship", "Sacrifice", "Justice"
    ],
    character_types: [
        "Hero", "Villain", "Mentor", "Sidekick"
    ]
};

function App() {
  // The storyData state is initialized directly with the constant
  const [storyData, setStoryData] = useState(STORY_DATA);
  
  const [formValues, setFormValues] = useState({ genres: "", themes: "", character_types: "" });
  const [storyResult, setStoryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // The useEffect hook for fetching story data is NO LONGER NEEDED and has been removed.

  // Handle dark mode toggling
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Function to show a temporary notification
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleInputChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const generateAIStory = async () => {
    setLoading(true);
    setStoryResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/generate-ai-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genres: formValues.genres ? [formValues.genres] : [],
          themes: formValues.themes ? [formValues.themes] : [],
          character_types: formValues.character_types ? [formValues.character_types] : [],
        }),
      });
      if (!res.ok) throw new Error("Failed to generate story");
      const data = await res.json();
      setStoryResult(data);
      showNotification("Idea forged!", "success");
    } catch {
      showNotification("Forging failed!", "error");
    } finally {
      setLoading(false);
    }
  };


  const resetForm = () => {
    setFormValues({ genres: "", themes: "", character_types: "" });
    setStoryResult(null);
  };

  const copyToClipboard = () => {
    if (!storyResult) return;
    navigator.clipboard.writeText(storyResult.story_prompt)
      .then(() => showNotification("Copied!", "success"))
      .catch(() => showNotification("Failed to copy", "error"));
  };

  const downloadStory = () => {
    if (!storyResult) return;
    const content = `${storyResult.story_prompt}\n\nForged by AI Story Forge on: ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `story-forge-idea-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("Downloaded!", "success");
  };

  return (
    <div className="main-container">
      <header className="header">
        <h1 className="header__title">AI Story Idea</h1>
        <p className="header__subtitle">Crafting narratives with Gemini AI</p>
        <button className="theme-toggle" onClick={() => setDarkMode((d) => !d)}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </header>

      <main className="content-area">
        <form id="storyForm" onSubmit={(e) => e.preventDefault()}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="genres">Genre</label>
              <select className="form-control" id="genres" name="genres" value={formValues.genres} onChange={handleInputChange}>
                <option value="">Any Genre</option>
                {storyData.genres.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="themes">Theme</label>
              <select className="form-control" id="themes" name="themes" value={formValues.themes} onChange={handleInputChange}>
                <option value="">Any Theme</option>
                {storyData.themes.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="character_types">Character</label>
              <select className="form-control" id="character_types" name="character_types" value={formValues.character_types} onChange={handleInputChange}>
                <option value="">Any Character</option>
                {storyData.character_types.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
          </div>
          <div className="btn-group">
            <button type="button" className="btn btn--primary" onClick={generateAIStory} disabled={loading}>
              {loading ? <span className="loading-spinner"></span> : "Create Idea"}
            </button>
            <button type="button" className="btn btn--secondary" onClick={resetForm}>
              Reset
            </button>
          </div>
        </form>

        {storyResult && (
          <section className="story-result" style={{ display: "block" }}>
            <div className={`story-text ${storyResult.ai_generated ? "ai-story-text" : ""}`}>
              {storyResult.story_prompt}
            </div>
            <div className="btn-group">
              <button className="btn btn--secondary" onClick={copyToClipboard}>Copy</button>
              <button className="btn btn--secondary" onClick={downloadStory}>Download</button>
            </div>
          </section>
        )}
      </main>

      {notification && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', padding: '0.6rem 1rem', borderRadius: '0.25rem',
          color: 'white', fontWeight: 500, fontSize: '0.85rem', zIndex: 1000,
          backgroundColor: notification.type === 'error' ? 'var(--color-error)' : 'var(--color-success)'
        }}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;
