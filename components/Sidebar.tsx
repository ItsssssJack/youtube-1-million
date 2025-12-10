import React from 'react';
import { 
  LayoutDashboard, 
  Flame, 
  Users, 
  Lightbulb, 
  MessageSquare, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  
  const NavItem = ({ view, icon: Icon, label, badge }: { view: ViewState; icon: any; label: string; badge?: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 mb-2 rounded-xl transition-all duration-200 group ${
        currentView === view 
          ? 'bg-[#14452F] text-white shadow-lg shadow-[#14452F]/20' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={20} className={currentView === view ? 'text-emerald-300' : 'text-gray-400 group-hover:text-gray-600'} />
      <span className="font-medium text-sm">{label}</span>
      {badge && (
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
          currentView === view ? 'bg-emerald-500/30 text-emerald-100' : 'bg-gray-200 text-gray-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <aside className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-100 flex flex-col p-6 z-20">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 bg-[#14452F] rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20" />
                <circle cx="12" cy="12" r="10" />
            </svg>
        </div>
        <div>
            <h1 className="font-bold text-xl text-gray-900 leading-none">Growth</h1>
            <span className="text-xs text-gray-400 font-medium tracking-wide">INTELLIGENCE</span>
        </div>
      </div>

      <nav className="flex-1">
        <div className="text-xs font-bold text-gray-400 px-4 mb-4 uppercase tracking-wider">Menu</div>
        <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
        <NavItem view={ViewState.OUTLIERS} icon={Flame} label="Outlier Explorer" badge="3" />
        <NavItem view={ViewState.COMPETITORS} icon={Users} label="Competitors" />
        <NavItem view={ViewState.IDEAS} icon={Lightbulb} label="Idea Queue" badge="3" />
        <NavItem view={ViewState.SPARRING} icon={MessageSquare} label="Sparring Partner" />
      </nav>

      <div className="mt-auto">
        <div className="text-xs font-bold text-gray-400 px-4 mb-4 uppercase tracking-wider">General</div>
        <button 
            onClick={() => onChangeView(ViewState.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${
                currentView === ViewState.SETTINGS 
                ? 'bg-[#14452F] text-white shadow-lg shadow-[#14452F]/20' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
          <Settings size={20} className={currentView === ViewState.SETTINGS ? 'text-emerald-300' : 'text-gray-400'} />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 transition-colors">
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
      
      {/* User Profile Snippet */}
      <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-3">
        <img src="https://ui-avatars.com/api/?name=Jack&background=0D8ABC&color=fff" alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">Jack</p>
            <p className="text-xs text-gray-500 truncate">@Itssssss_Jack</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;