import React from 'react';
import { GameServer } from '../types';

interface ServerSelectorProps {
  servers: GameServer[];
  activeServer: GameServer | null;
  onSelectServer: (server: GameServer) => void;
}

export const ServerSelector: React.FC<ServerSelectorProps> = ({
  servers,
  activeServer,
  onSelectServer,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-1.5 bg-[#0e1422] border border-gray-800 rounded-2xl">
      {servers.map((server) => {
        const isSelected = activeServer?.id === server.id;
        return (
          <button
            key={server.id}
            onClick={() => onSelectServer(server)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-black font-black shadow-glow-sky border border-sky-400/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/80 border border-transparent'
            }`}
          >
            <span className="text-lg">{server.icon || '⚔️'}</span>
            <span>{server.name}</span>
            {server._count && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-black/20 text-sky-900' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {server._count.products} ชิ้น
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
