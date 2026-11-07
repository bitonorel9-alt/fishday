import type { ComponentType } from "preact";
import { useEffect, useState } from "preact/hooks";

/**
 * מסך שנטען רק כשנכנסים אליו. כך הטעינה הראשונה מורידה רק את מה שצריך למסך הבית.
 * אחרי הטעינה הראשונה המסך נשמר בזיכרון, והמעבר אליו מיידי.
 */
export function lazy<P extends object>(load: () => Promise<ComponentType<P>>): ComponentType<P> {
  let loaded: ComponentType<P> | null = null;
  let pending: Promise<ComponentType<P>> | null = null;
  return function Lazy(props: P) {
    const [, setReady] = useState(false);
    useEffect(() => {
      if (loaded) return;
      pending ??= load();
      let alive = true;
      pending.then((c) => {
        loaded = c;
        if (alive) setReady(true);
      }).catch(() => {
        // בלי רשת ובלי מטמון: ננסה שוב בכניסה הבאה.
        pending = null;
      });
      return () => { alive = false; };
    }, []);
    const C = loaded;
    return C ? <C {...props} /> : <div class="card skeleton" role="status" aria-label="טוען" />;
  };
}
