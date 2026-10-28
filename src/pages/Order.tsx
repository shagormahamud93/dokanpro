import { Construction } from 'lucide-react'



interface OrderProps {
  title: string
}

export function Order({ title }: OrderProps) {
  return (
    <div className="mx-auto max-w-[1440px] p-8">
      <h1 className="text-h1 text-text">{title}</h1>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-surface p-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Construction className="h-6 w-6" />
        </div>
        <p className="text-body font-medium text-text">Order Management</p>
        <p className="max-w-sm text-body-sm text-text-muted">
          This page follows the same design system. Wire it up next using the layouts and components already built.
        </p>
      </div>
    </div>
  )
}
