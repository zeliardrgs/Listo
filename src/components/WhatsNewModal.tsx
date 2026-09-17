import Modal from './Modal'

interface Feature {
  emoji: string
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    emoji: '🔀',
    title: 'Réorganisation des rayons',
    description:
      'Dans l\'onglet Courses, ouvre le menu (⋯) puis « Changer l\'ordre des rayons ». Fais glisser un rayon pour le déplacer où tu veux, puis enregistre — l\'ordre est mémorisé par magasin.'
  },
  {
    emoji: '💝',
    title: 'Onglet Souhaits',
    description: 'Un nouvel onglet pour noter les envies et cadeaux à faire (ou à recevoir), avec prix et lien optionnels.'
  },
  {
    emoji: '🌱',
    title: 'Explorer les articles',
    description:
      'Dans Articles > Explorer, parcours une sélection d\'articles courants par rayon et ajoute-les en un clic. Les fruits et légumes affichent un badge « De saison » basé sur le calendrier officiel de Greenpeace.'
  }
]

export default function WhatsNewModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Quoi de neuf" onClose={onClose}>
      <ul className="space-y-4">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-xl leading-none">{f.emoji}</span>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{f.title}</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">{f.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
