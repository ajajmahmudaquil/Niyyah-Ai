import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-4 px-6 text-center" data-testid="footer">
      <p className="text-sm text-muted-foreground">
        {t("footer.copyright", { year: String(year) })}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("footer.tagline")}
      </p>
    </footer>
  );
}
