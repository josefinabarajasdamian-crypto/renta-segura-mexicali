export type Property = {
  id: string
  image: string
  price: number
  title: string
  location: string
  tags: string[]
  whatsapp: string
}

export type Demand = {
  id: string
  name: string
  anonymous?: boolean
  message: string
  budget: string
  zone: string
  tenants: string
  postedAt: string
}

export const properties: Property[] = [
  {
    id: 'p1',
    image: '/images/depto-uabc.png',
    price: 6500,
    title: 'Departamento 2 Recámaras a 5 min de UABC Central',
    location: 'Fracc. Villafontana, cerca de UABC',
    tags: ['2 Minisplits', 'Servicios Incluidos', 'Acepta Mascotas'],
    whatsapp: '526861234567',
  },
  {
    id: 'p2',
    image: '/images/casa-prohogar.png',
    price: 8900,
    title: 'Casa 3 Recámaras con cochera en Prohogar',
    location: 'Col. Pro Hogar, Mexicali',
    tags: ['3 Recámaras', 'Cochera Techada', 'Patio Amplio'],
    whatsapp: '526862345678',
  },
  {
    id: 'p3',
    image: '/images/studio-palaco.png',
    price: 4800,
    title: 'Studio amueblado ideal para 1 persona en Palaco',
    location: 'Zona Palaco, Mexicali',
    tags: ['Amueblado', '1 Minisplit', 'Wifi Incluido'],
    whatsapp: '526863456789',
  },
]

export type PropertyDetail = {
  id: string
  title: string
  location: string
  price: number
  deposit: number
  contract: string
  servicesIncluded: string
  servicesIndependent: string
  gallery: { src: string; alt: string }[]
  whatsapp: string
  whatsappMessage: string
  specs: {
    climate: string
    parking: string
    pets: string
    layout: string
  }
  owner: {
    name: string
    role: string
    responseTime: string
    tenure: string
  }
}

export const propertyDetails: Record<string, PropertyDetail> = {
  p1: {
    id: 'p1',
    title: 'Departamento Amueblado cerca de UABC Central',
    location: 'Fracc. Villafontana · a 5 min de UABC Central, Mexicali',
    price: 6500,
    deposit: 6500,
    contract: 'Mínimo 6 meses / 1 año',
    servicesIncluded: 'Incluye Agua e Internet',
    servicesIndependent: 'Luz CFE independiente',
    gallery: [
      { src: '/images/depto-uabc.png', alt: 'Sala principal del departamento amueblado' },
      { src: '/images/depto-recamara.png', alt: 'Recámara principal con minisplit' },
      { src: '/images/depto-cocina.png', alt: 'Cocina equipada del departamento' },
      { src: '/images/depto-bano.png', alt: 'Baño completo del departamento' },
    ],
    whatsapp: '526861234567',
    whatsappMessage:
      'Hola, vi tu departamento de $6,500 en Renta Segura. Me interesa agendar una visita...',
    specs: {
      climate: '2 Minisplits Inverter (1.5 Toneladas cada uno)',
      parking: '1 Cajón dentro de privada con reja eléctrica',
      pets: 'Acepta gato o perro chico',
      layout: '2 Recámaras, 1 Baño completo',
    },
    owner: {
      name: 'Ing. Fernando R.',
      role: 'Dueño Directo',
      responseTime: 'Responde en menos de 1 hora',
      tenure: '3 años en la plataforma',
    },
  },
  p2: {
    id: 'p2',
    title: 'Casa 3 Recámaras con cochera en Prohogar',
    location: 'Col. Pro Hogar, Mexicali',
    price: 8900,
    deposit: 8900,
    contract: 'Mínimo 1 año',
    servicesIncluded: 'Incluye Agua',
    servicesIndependent: 'Luz CFE e Internet independientes',
    gallery: [
      { src: '/images/casa-prohogar.png', alt: 'Fachada de la casa en Prohogar' },
      { src: '/images/depto-recamara.png', alt: 'Recámara principal de la casa' },
      { src: '/images/depto-cocina.png', alt: 'Cocina de la casa' },
      { src: '/images/depto-bano.png', alt: 'Baño de la casa' },
    ],
    whatsapp: '526862345678',
    whatsappMessage:
      'Hola, vi tu casa de $8,900 en Renta Segura. Me interesa agendar una visita...',
    specs: {
      climate: '3 Minisplits Inverter en recámaras y sala',
      parking: 'Cochera techada para 2 autos',
      pets: 'Acepta mascotas con patio amplio',
      layout: '3 Recámaras, 2 Baños completos',
    },
    owner: {
      name: 'Lic. Marisol T.',
      role: 'Dueña Directa',
      responseTime: 'Responde en menos de 2 horas',
      tenure: '2 años en la plataforma',
    },
  },
  p3: {
    id: 'p3',
    title: 'Studio amueblado ideal para 1 persona en Palaco',
    location: 'Zona Palaco, Mexicali',
    price: 4800,
    deposit: 4800,
    contract: 'Mínimo 6 meses',
    servicesIncluded: 'Incluye Agua, Internet y Wifi',
    servicesIndependent: 'Luz CFE independiente',
    gallery: [
      { src: '/images/studio-palaco.png', alt: 'Interior del studio amueblado' },
      { src: '/images/depto-cocina.png', alt: 'Cocina integrada del studio' },
      { src: '/images/depto-bano.png', alt: 'Baño del studio' },
      { src: '/images/depto-recamara.png', alt: 'Área de descanso del studio' },
    ],
    whatsapp: '526863456789',
    whatsappMessage:
      'Hola, vi tu studio de $4,800 en Renta Segura. Me interesa agendar una visita...',
    specs: {
      climate: '1 Minisplit Inverter (1 Tonelada)',
      parking: '1 Cajón techado',
      pets: 'No se aceptan mascotas',
      layout: 'Studio con área integrada, 1 Baño completo',
    },
    owner: {
      name: 'Arq. Daniel G.',
      role: 'Dueño Directo',
      responseTime: 'Responde en menos de 30 minutos',
      tenure: '4 años en la plataforma',
    },
  },
}

export const demands: Demand[] = [
  {
    id: 'd1',
    name: 'Carlos M.',
    message:
      'Busco departamento de 4,000 a 6,000 por la Zona Industrial. Somos pareja sin niños, ambos trabajamos y tenemos comprobante de ingresos.',
    budget: '$6k max',
    zone: 'Industrial',
    tenants: '2',
    postedAt: 'Hace 2 horas',
  },
  {
    id: 'd2',
    name: 'Usuario Anónimo',
    anonymous: true,
    message:
      'Estudiante de UABC busca cuarto o studio cerca del campus por menos de $3,500. Tranquilo, sin fiestas, pago puntual cada mes.',
    budget: '$3.5k max',
    zone: 'UABC',
    tenants: '1',
    postedAt: 'Hace 5 horas',
  },
  {
    id: 'd3',
    name: 'Familia Rosales',
    message:
      'Necesitamos casa de 3 recámaras con patio en Prohogar o Nueva. Presupuesto hasta $9,000, tenemos un perro pequeño. Buscamos contrato de un año.',
    budget: '$9k max',
    zone: 'Prohogar',
    tenants: '4',
    postedAt: 'Ayer',
  },
]
