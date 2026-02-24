import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-2 px-4 text-center" data-testid="footer">
      <p className="text-xs text-muted-foreground/70">
        {t("footer.copyright", { year: String(year) })}
      </p>
    </footer>
  );
}
