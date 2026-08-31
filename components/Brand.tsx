import Link from "next/link";
import { getDictionary, type Locale } from "@/lib/i18n";

export function Brand({ locale = "sk" }: { locale?: Locale }) {
  const name = getDictionary(locale).brand;
  return <Link href="/" className="brand" aria-label={`${name} home`}><span className="brand-mark">{name[0]}</span><span>{name}</span></Link>;
}
