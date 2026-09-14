import {
  Activity,
  Award,
  Calendar,
  Circle,
  Compass,
  Flag,
  Heart,
  MapPin,
  Shield,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { CardsData } from '@/types';

/// Iconos disponibles para las tarjetas del CMS. Se importan uno a uno a
/// propósito: un `import * as Icons` mete toda la librería (~1 MB) en el
/// bundle de la landing. Para añadir uno nuevo, agrégalo a esta tabla.
const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  award: Award,
  calendar: Calendar,
  compass: Compass,
  flag: Flag,
  heart: Heart,
  'map-pin': MapPin,
  shield: Shield,
  target: Target,
  trophy: Trophy,
  users: Users,
};

function Icon({ name }: { name?: string }) {
  if (!name) return null;
  const Cmp = ICONS[name.toLowerCase()] ?? Circle;
  return <Cmp className="h-6 w-6 text-accent" aria-hidden="true" />;
}

export function CardsBlock({ data }: { data: Record<string, unknown> }) {
  const { title, items = [] } = data as CardsData;

  return (
    <section className="section">
      {title && (
        <h2 className="section-title mb-10 text-center">
          {title}
        </h2>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Card key={index} className="transition-shadow hover:shadow-md">
            <CardContent className="pt-6">
              <Icon name={item.icon} />
              {item.title && (
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              )}
              {item.text && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
