
export default function Tabs({ setActiveTab, activeTab, tabs }) {
     // Default to first tab

    return (
        <div className="w-full mt-4">
            {/* Scrollable Tabs Container */}
            <div className="relative">
                <nav
                    className="flex space-x-1 overflow-x-auto  scrollbar-hide"
                    aria-label="Tabs"
                >
                    {tabs.map((tab, index) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap flex items-center py-3 px-4 text-sm font-medium transition-colors cursor-pointer${
                                activeTab === tab
                                    ? "border-black text-black font-bold cursor-pointer"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer"
                            }`}
                        >
                            {tab}
                            {/*<span*/}
                            {/*    className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${*/}
                            {/*        activeTab === tab*/}
                            {/*            ? "bg-black text-white"*/}
                            {/*            : "bg-gray-100 text-gray-900"*/}
                            {/*    }`}*/}
                            {/*>*/}
                            {/*    {index + 3}*/}
                            {/*</span>*/}
                        </button>
                    ))}
                </nav>
            </div>

        </div>
    );
}
