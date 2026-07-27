import { Home, Users, FileCheck, Star } from 'lucide-react'

const stats = [
  {
    label: 'Propiedades Activas',
    value: '3',
    icon: Home,
    hint: 'En el directorio verificado',
  },
  {
    label: 'Inquilinos Interesados',
    value: '12',
    icon: Users,
    hint: '+4 esta semana',
  },
  {
    label: 'Contratos Vigentes',
    value: '2',
    icon: FileCheck,
    hint: 'Al corriente de pagos',
  },
  {
    label: 'Score de Reputación',
    value: '4.9',
    icon: Star,
    hint: '100% puntuales',
    highlight: true,
  },
]

export function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              <span
                className={
                  stat.highlight
                    ? 'flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent'
                    : 'flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'
                }
              >
                <Icon className="size-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                {stat.value}
              </span>
              {stat.highlight && (
                <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
              )}
            </div>
            <span className="text-[0.7rem] text-muted-foreground">{stat.hint}</span>
          </div>
        )
      })}
    </div>
  )
}
