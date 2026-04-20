"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-surface-muted">
        <Avatar className="h-7 w-7"><AvatarFallback>DM</AvatarFallback></Avatar>
        <span className="text-sm">Demo User</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>Profile</DropdownMenuItem>
        <DropdownMenuItem disabled>Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
