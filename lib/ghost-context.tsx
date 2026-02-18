"use client"

import { createContext, useContext } from "react"

interface GhostCtx { ghostId: string | null }
export const GhostContext = createContext<GhostCtx>({ ghostId: null })
export const useGhost = () => useContext(GhostContext)
