"use client";

import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const ActiveUsers = () => {
  const others = useOthers();
  const currentUser = useSelf();

  const users = [currentUser, ...others].filter(Boolean);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-x-2">
      <div className="flex -space-x-2 overflow-hidden px-2">
        {users.slice(0, 5).map((user) => {
          if (!user?.info) return null;

          return (
            <TooltipProvider key={user.connectionId}>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar
                    className="h-8 w-8 border-2 border-white/20 transition-transform hover:z-10 hover:scale-110"
                    style={{ borderColor: user.info.color as string | undefined }}
                  >
                    <AvatarImage src={user.info.avatar} alt={user.info.name} />
                    <AvatarFallback className="bg-neutral-800 text-xs text-white">
                      {user.info.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.info.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        {users.length > 5 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 bg-neutral-800 text-xs text-white z-0">
            +{users.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};
