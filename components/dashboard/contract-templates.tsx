import { FileText, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

const templates = [
  {
    name: 'Contrato de Arrendamiento Estándar',
    description: 'Renta de departamento o casa por 12 meses, con cláusulas de depósito y aval.',
    file: '/contratos/contrato-arrendamiento-estandar.pdf',
  },
  {
    name: 'Contrato Amueblado / Corta Estancia',
    description: 'Ideal para rentas de 1 a 6 meses con inventario de mobiliario incluido.',
    file: '/contratos/contrato-amueblado-corta-estancia.pdf',
  },
  {
    name: 'Anexo de Aval y Referencias',
    description: 'Formato complementario para respaldar al inquilino con un aval verificado.',
    file: '/contratos/anexo-aval-y-referencias.pdf',
  },
]

export function ContractTemplates() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <article
          key={template.name}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{template.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {template.description}
            </p>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            Plantilla general — revísala con un abogado antes de usarla.
          </p>
          <div className="mt-auto flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              nativeButton={false}
              render={<a href={template.file} target="_blank" rel="noopener noreferrer" />}
            >
              <Eye className="size-3.5" />
              Ver
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              nativeButton={false}
              render={<a href={template.file} download />}
            >
              <Download className="size-3.5" />
              Descargar
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}
