import React from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Medal, Sparkles, Leaf, TrendingUp } from 'lucide-react';

export const LeaderboardView = () => {
  const { leaderboard } = useApp();

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-3xl mx-auto animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D1FEE5] text-[#006C48] text-xs font-bold rounded-full">
          <Trophy className="w-3.5 h-3.5 text-[#52B788]" />
          <span>Haftalık Sıfır İsraf Sıralaması</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F5238]">Topluluk Liderlik Tablosu</h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          En çok gıda kurtararak doğaya ve topluma en büyük pozitif etkiyi yaratan süper kahramanlarımız!
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-3 gap-3 items-end pt-6">
        
        {/* Rank 2 */}
        <div className="bg-white rounded-3xl p-4 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <span className="text-xl">🥈</span>
          <img
            src={leaderboard[1]?.avatar}
            alt={leaderboard[1]?.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-300 shadow mt-2"
          />
          <h4 className="text-xs font-bold text-[#0F5238] mt-2 truncate w-full">{leaderboard[1]?.name}</h4>
          <p className="text-[11px] font-extrabold text-[#52B788]">{leaderboard[1]?.kg} kg</p>
          <span className="text-[10px] text-gray-400">{leaderboard[1]?.points} Puan</span>
        </div>

        {/* Rank 1 (Tallest) */}
        <div className="bg-gradient-to-b from-[#FEF3C7] to-white rounded-3xl p-5 text-center border-2 border-amber-300 shadow-lg flex flex-col items-center -translate-y-4">
          <span className="text-3xl">👑</span>
          <img
            src={leaderboard[0]?.avatar}
            alt={leaderboard[0]?.name}
            className="w-18 h-18 rounded-full object-cover border-4 border-amber-400 shadow-lg mt-1"
          />
          <h4 className="text-sm font-black text-[#0F5238] mt-2 truncate w-full">{leaderboard[0]?.name}</h4>
          <span className="px-2 py-0.5 bg-amber-400 text-[#002114] text-[10px] font-black rounded-full mt-1">
            {leaderboard[0]?.badge}
          </span>
          <p className="text-sm font-black text-[#0F5238] mt-1.5">{leaderboard[0]?.kg} kg Gıda</p>
          <span className="text-xs font-bold text-amber-600">{leaderboard[0]?.points} Puan</span>
        </div>

        {/* Rank 3 */}
        <div className="bg-white rounded-3xl p-4 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <span className="text-xl">🥉</span>
          <img
            src={leaderboard[2]?.avatar}
            alt={leaderboard[2]?.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-amber-700 shadow mt-2"
          />
          <h4 className="text-xs font-bold text-[#0F5238] mt-2 truncate w-full">{leaderboard[2]?.name}</h4>
          <p className="text-[11px] font-extrabold text-[#52B788]">{leaderboard[2]?.kg} kg</p>
          <span className="text-[10px] text-gray-400">{leaderboard[2]?.points} Puan</span>
        </div>

      </div>

      {/* Full Leaderboard List */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-2">
        {leaderboard.map((user) => (
          <div
            key={user.rank}
            className={`flex items-center justify-between p-3.5 rounded-2xl transition ${
              user.isCurrentUser
                ? 'bg-[#E8FFF0] border-2 border-[#52B788]'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className={`w-7 text-center font-black text-sm ${user.rank <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                #{user.rank}
              </span>

              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />

              <div>
                <h4 className="text-xs font-bold text-[#0F5238] flex items-center gap-1.5">
                  {user.name}
                  {user.isCurrentUser && (
                    <span className="px-2 py-0.2 bg-[#2D6A4F] text-white text-[9px] font-bold rounded-full">
                      Sen
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-gray-500">{user.badge}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-black text-[#0F5238]">{user.kg} kg</p>
              <p className="text-[10px] text-gray-400">{user.points} Puan</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
