import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/Seo';

export function NotFoundPage() {
  return (
    <div className="container flex flex-col items-center py-32 text-center">
      <Seo title="Página no encontrada" noindex />
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Página no encontrada</h1>
      <p className="section-lead">
        La página que buscas no existe o cambió de dirección.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
