import React, { useEffect, useState } from "react";
import { User } from "../types";
import { api } from "../services/api";
import { Sparkles, Gift, PartyPopper } from "lucide-react";

export const BirthdayBanner: React.FC = () => {
  const [birthdayUsers, setBirthdayUsers] = useState<User[]>([]);

  useEffect(() => {
    const checkBirthdays = async () => {
      try {
        const users = await api.searchDirectory("");
        const todayStr = new Date().toISOString().slice(5, 10); // "MM-DD"
        const celebrating = users.filter((u) => {
          if (!u.dob) return false;
          const clean = u.dob.trim();
          if (clean.length >= 5) {
            return clean.slice(-5) === todayStr;
          }
          return false;
        });
        setBirthdayUsers(celebrating);
      } catch (err) {
        console.warn("Could not check birthdays:", err);
      }
    };
    checkBirthdays();
  }, []);

  if (birthdayUsers.length === 0) return null;

  return (
    <div className="bg-linear-to-r from-amber-500 via-pink-500 to-purple-600 text-white px-4 py-3 shadow-md relative z-30 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <PartyPopper className="w-5 h-5 text-amber-200 animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-amber-100 flex items-center gap-1.5 justify-center sm:justify-start">
              <span>Campus Birthday Alert</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-sm font-bold">
              {birthdayUsers.map((u, idx) => (
                <span key={u.id}>
                  {idx > 0 && ", "}
                  🎂 {u.name} (@{u.username})
                </span>
              ))}
              {birthdayUsers.length === 1 ? " is celebrating their birthday today!" : " are celebrating their birthdays today!"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
          <Gift className="w-4 h-4 text-amber-200" />
          <span>Send them warm wishes & greetings in Campus Chat!</span>
        </div>
      </div>
    </div>
  );
};
