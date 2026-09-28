
export default function Settings() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-white/10 px-[48px] py-6">
        <h1 className="text-2xl font-medium">Settings</h1>
      </header>

      <main className="flex-1 px-[48px] py-8 max-w-2xl">
        <section className="space-y-8">
          <div>
            <h2 className="text-lg font-medium mb-4">Account</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-[#ccc]">Email notifications</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 accent-[#e8a940] rounded border-white/20 bg-white/5"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-[#ccc]">Push notifications</span>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#e8a940] rounded border-white/20 bg-white/5"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-[#ccc]">Auto-play next episode</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 accent-[#e8a940] rounded border-white/20 bg-white/5"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-medium mb-4">Playback</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-[#ccc]">Video quality</span>
                <select className="bg-white/5 text-white px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e8a940]">
                  <option value="auto">Auto</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-[#ccc]">Subtitle language</span>
                <select className="bg-white/5 text-white px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e8a940]">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </label>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-medium mb-4">Appearance</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-[#ccc]">Dark mode</span>
                <input
                  type="checkbox"
                  defaultChecked
                  disabled
                  className="w-5 h-5 accent-[#e8a940] rounded border-white/20 bg-white/5"
                />
              </label>
              <p className="text-xs text-[#999]">PlexFin is designed exclusively for dark mode viewing.</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-medium mb-4">Privacy & Data</h2>
            <div className="space-y-4">
              <button className="w-full text-left px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors">
                Clear watch history
              </button>
              <button className="w-full text-left px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors">
                Clear search history
              </button>
              <button className="w-full text-left px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors">
                Download my data
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-medium mb-4">About</h2>
            <p className="text-[#999] text-sm">
              PlexFin v1.0.0
              <br />
              A free streaming website for short films and TV shows across genres.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}