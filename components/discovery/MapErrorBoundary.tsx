'use client'

import { Component, ReactNode } from 'react'
import { MapPin } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-400">
          <MapPin className="w-8 h-8" />
          <p className="text-sm">マップを読み込めませんでした</p>
        </div>
      )
    }
    return this.props.children
  }
}
