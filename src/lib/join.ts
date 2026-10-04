/// Enlace que abre el formulario de inscripción. En el CMS, los botones de
/// «unirse» llevan este href.
export const JOIN_HREF = '#unirse';

/// Un botón del CMS que abre el formulario en vez de navegar. También se
/// interceptan los enlaces directos al grupo de WhatsApp que pudieran quedar
/// en contenido antiguo: la invitación solo se entrega tras inscribirse.
export function isJoinHref(href: string) {
  return href === JOIN_HREF || /chat\.whatsapp\.com/i.test(href);
}

export type ArcheryExperience = 'NONE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export const EXPERIENCE_OPTIONS: { value: ArcheryExperience; label: string }[] = [
  { value: 'NONE', label: 'Nunca he tirado con arco' },
  { value: 'BEGINNER', label: 'Lo he probado alguna vez' },
  { value: 'INTERMEDIATE', label: 'Practico con regularidad' },
  { value: 'ADVANCED', label: 'Compito o tengo experiencia avanzada' },
];
