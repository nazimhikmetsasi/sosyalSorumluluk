import React from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy } from 'lucide-react';

export const LeaderboardView = () => {
  const { leaderboard, currentUser } = useApp();

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="text-center space-y-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D1FEE5] text-[#006C48] text-[10px] font-bold rounded-full">
          <Trophy className="w-3 h-3 text-[#52B788]" />
          <span>Haftalık Sıfır İsraf Liderleri</span>
        </div>
        <h1 className="text-sm font-black text-[#0F5238]">Topluluk Sıralaması</h1>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-3 gap-2 items-end pt-3">
        
        {/* Rank 2 */}
        <div className="bg-white rounded-2xl p-2 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <span className="text-base">🥈</span>
          <img
            src={leaderboard[1]?.avatar}
            alt={leaderboard[1]?.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-gray-300 shadow mt-0.5"
          />
          <h4 className="text-[9px] font-bold text-[#0F5238] mt-1 truncate w-full">{leaderboard[1]?.name}</h4>
          <p className="text-[9px] font-extrabold text-[#52B788]">{leaderboard[1]?.kg} kg</p>
          <span className="text-[8px] text-gray-400">{leaderboard[1]?.points} P</span>
        </div>

        {/* Rank 1 (Tallest) */}
        <div className="bg-gradient-to-b from-[#FEF3C7] to-white rounded-2xl p-2.5 text-center border-2 border-amber-300 shadow-md flex flex-col items-center -translate-y-2">
          <span className="text-xl">👑</span>
          <img
            src={leaderboard[0]?.avatar}
            alt={leaderboard[0]?.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow mt-0.5"
          />
          <h4 className="text-[10px] font-black text-[#0F5238] mt-1 truncate w-full">{leaderboard[0]?.name}</h4>
          <span className="px-1 py-0.2 bg-amber-400 text-[#002114] text-[8px] font-black rounded-full mt-0.5">
            {leaderboard[0]?.badge}
          </span>
          <p className="text-[10px] font-black text-[#0F5238] mt-0.5">{leaderboard[0]?.kg} kg</p>
          <span className="text-[9px] font-bold text-amber-600">{leaderboard[0]?.points} P</span>
        </div>

        {/* Rank 3 */}
        <div className="bg-white rounded-2xl p-2 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <span className="text-base">🥉</span>
          <img
            src={leaderboard[2]?.avatar}
            alt={leaderboard[2]?.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-amber-700 shadow mt-0.5"
          />
          <h4 className="text-[9px] font-bold text-[#0F5238] mt-1 truncate w-full">{leaderboard[2]?.name}</h4>
          <p className="text-[9px] font-extrabold text-[#52B788]">{leaderboard[2]?.kg} kg</p>
          <span className="text-[8px] text-gray-400">{leaderboard[2]?.points} P</span>
        </div>

      </div>

      {/* Full Leaderboard List */}
      <div className="bg-white rounded-2xl p-2.5 border border-gray-100 shadow-sm space-y-1.5">
        {leaderboard.map((user) => {
          const isMe = user.isCurrentUser;
          const displayName = isMe ? currentUser.name : user.name;
          const displayAvatar = isMe ? currentUser.avatar : user.avatar;
          const displayKg = isMe ? currentUser.savedKg : user.kg;
          const displayPoints = isMe ? currentUser.points : user.points;

          return (
            <div
              key={user.rank}
              className={`flex items-center justify-between p-2 rounded-xl transition ${
                isMe
                  ? 'bg-[#E8FFF0] border border-[#52B788]'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-5 text-center font-black text-xs flex-shrink-0 ${user.rank <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                  #{user.rank}
                </span>

                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0"
                />

                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-[#0F5238] flex items-center gap-1 truncate">
                    <span className="truncate">{displayName}</span>
                    {isMe && (
                      <span className="px-1 py-0.2 bg-[#2D6A4F] text-white text-[8px] font-bold rounded flex-shrink-0">
                        Sen
                      </span>
                    )}
                  </h4>
                  <p className="text-[9px] text-gray-400 truncate">{user.badge}</p>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-[11px] font-black text-[#0F5238]">{displayKg} kg</p>
                <p className="text-[9px] text-gray-400">{displayPoints} P</p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
