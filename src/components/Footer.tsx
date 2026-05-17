'use client';

export default function Footer() {
  return (
    <footer className="bg-[#0d253d] text-[#64748d]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <span className="text-white/60">&copy; {new Date().getFullYear()} swiftcode.xin</span>
          <div className="flex gap-6">
            <a href="/about" className="hover:text-white transition-colors">About</a>
            <a href="/docs" className="hover:text-white transition-colors">API</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
