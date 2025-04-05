"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Menu, Search, X } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import DashboardSidebar from "./sidebar"

export default function DashboardHeader() {
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
            <SheetContent side="left" className="p-0">
              <DashboardSidebar isMobile />
            </SheetContent>
          </Sheet>
        </div>

        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-6 w-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="m18 16 4-4-4-4" />
                <path d="m6 8-4 4 4 4" />
                <path d="m14.5 4-5 16" />
              </svg>
            </div>
            <span className="font-bold">CodeCollab</span>
          </Link>
        </div>

        {showMobileSearch ? (
          <div className="flex flex-1 items-center">
            <Input placeholder="Search..." className="h-9 md:w-[200px] lg:w-[300px]" />
            <Button variant="ghost" size="icon" className="ml-2" onClick={() => setShowMobileSearch(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close search</span>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-1 items-center justify-end space-x-2 md:justify-end">
              <div className="hidden w-full md:flex md:w-auto md:flex-1 md:items-center md:justify-end md:space-x-2">
                <div className="w-full md:w-auto md:flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search..."
                      className="w-full rounded-lg pl-8 md:w-[200px] lg:w-[300px]"
                    />
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileSearch(true)}>
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@user" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

