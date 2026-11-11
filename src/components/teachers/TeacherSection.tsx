import {useState, type ReactNode} from 'react';

/** Native disclosure keeps controls keyboard accessible and mounted when folded. */
export default function TeacherSection({title, children, tone='sage', defaultOpen=false, meta}: {
  title: string; children: ReactNode; tone?: 'sage'|'peach'|'lavender'|'blue'; defaultOpen?: boolean; meta?: ReactNode;
}) {
  const [open,setOpen]=useState(defaultOpen);
  return <details className={`teacher-section teacher-tone-${tone}`} open={open} onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary><span>{title}</span>{meta&&<span className="teacher-section-meta">{meta}</span>}</summary>
    <div className="teacher-section-body">{children}</div>
  </details>;
}
