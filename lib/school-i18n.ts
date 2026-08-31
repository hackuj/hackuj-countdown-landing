import type { Locale } from "@/lib/i18n";

const schoolCopy = {
  en: {
    pageTitle: "Schools", pageKicker: "VERIFIED LEARNING COMMUNITIES", layerTitle: "School communities", layerBody: "Your player profile stays yours. Connect it to a verified school when you are ready.", verifyAction: "Verify a school", players: "players", rating: "team average", pendingRegion: "Region pending", submitted: "Your request was sent. You can keep learning while it is reviewed.",
    verifyTitle: "Verify your school", verifyKicker: "SCHOOL VERIFICATION", formTitle: "School details", intro: "Tell us enough to confirm that the school exists and that your connection to it is genuine.", name: "School name", city: "City", region: "Region or county", domain: "Official school email domain", role: "Your role", evidence: "Verification evidence", optional: "Optional", student: "Student", teacher: "Teacher", coach: "Coach or club mentor", submit: "Send verification request", preview: "Preview mode", previewBody: "The database is not connected, so this form cannot save a request yet.",
    guideTitle: "What happens next", steps: ["An administrator checks the school and the evidence you provide.", "Once approved, your school membership becomes active.", "Your personal progress remains available while the review is pending."], safetyTitle: "Share only school information", safetyBody: "Do not submit passwords, identity documents, student records, or other sensitive personal data.", back: "Back to schools",
    placeholders: { name: "Example Secondary School", city: "Cluj-Napoca", region: "Cluj", domain: "school.edu", evidence: "School website, official email context, or a staff contact an administrator can verify." },
    errors: { database: "School verification needs the database. Configure DATABASE_URL first, then try again.", role: "Choose a valid school role.", save: "The request could not be saved. Check the details and try again." },
  },
  ro: {
    pageTitle: "Școli", pageKicker: "COMUNITĂȚI EDUCAȚIONALE VERIFICATE", layerTitle: "Comunități școlare", layerBody: "Profilul tău rămâne al tău. Îl poți conecta la o școală verificată când ești pregătit.", verifyAction: "Verifică o școală", players: "jucători", rating: "media echipelor", pendingRegion: "Județ în așteptare", submitted: "Cererea a fost trimisă. Poți continua să înveți cât timp o verificăm.",
    verifyTitle: "Verifică școala", verifyKicker: "VERIFICARE ȘCOLARĂ", formTitle: "Datele școlii", intro: "Oferă-ne informațiile necesare pentru a confirma că școala există și că legătura ta cu ea este reală.", name: "Numele școlii", city: "Localitate", region: "Județ", domain: "Domeniul oficial de e-mail", role: "Rolul tău", evidence: "Dovezi pentru verificare", optional: "Opțional", student: "Elev", teacher: "Profesor", coach: "Mentor sau coordonator de club", submit: "Trimite cererea", preview: "Mod demonstrativ", previewBody: "Baza de date nu este conectată, deci cererea nu poate fi salvată încă.",
    guideTitle: "Ce se întâmplă după trimitere", steps: ["Un administrator verifică școala și informațiile oferite.", "După aprobare, apartenența ta la școală devine activă.", "Progresul personal rămâne disponibil pe durata verificării."], safetyTitle: "Trimite doar informații despre școală", safetyBody: "Nu trimite parole, acte de identitate, situații școlare sau alte date personale sensibile.", back: "Înapoi la școli",
    placeholders: { name: "Colegiul Național…", city: "București", region: "București", domain: "scoala.ro", evidence: "Site-ul școlii, contextul adresei oficiale de e-mail sau o persoană de contact care poate confirma informațiile." },
    errors: { database: "Verificarea școlii necesită baza de date. Configurează DATABASE_URL și încearcă din nou.", role: "Alege un rol școlar valid.", save: "Cererea nu a putut fi salvată. Verifică informațiile și încearcă din nou." },
  },
  sk: {
    pageTitle: "Školy", pageKicker: "OVERENÉ VZDELÁVACIE KOMUNITY", layerTitle: "Školské komunity", layerBody: "Tvoj hráčsky profil zostáva tvoj. Keď budeš pripravený, pripoj ho k overenej škole.", verifyAction: "Overiť školu", players: "hráčov", rating: "priemer tímov", pendingRegion: "Región čaká na doplnenie", submitted: "Žiadosť bola odoslaná. Počas kontroly môžeš ďalej trénovať.",
    verifyTitle: "Over svoju školu", verifyKicker: "OVERENIE ŠKOLY", formTitle: "Údaje o škole", intro: "Uveď informácie, podľa ktorých vieme potvrdiť existenciu školy a tvoje skutočné prepojenie so školou.", name: "Názov školy", city: "Mesto", region: "Kraj", domain: "Oficiálna školská e-mailová doména", role: "Tvoja rola", evidence: "Podklady na overenie", optional: "Voliteľné", student: "Študent", teacher: "Učiteľ", coach: "Tréner alebo vedúci klubu", submit: "Odoslať žiadosť", preview: "Ukážkový režim", previewBody: "Databáza nie je pripojená, preto sa žiadosť zatiaľ nedá uložiť.",
    guideTitle: "Čo bude nasledovať", steps: ["Administrátor skontroluje školu a poskytnuté podklady.", "Po schválení sa tvoje členstvo v škole aktivuje.", "Osobný pokrok zostáva počas kontroly dostupný."], safetyTitle: "Zdieľaj iba informácie o škole", safetyBody: "Neposielaj heslá, doklady totožnosti, školské záznamy ani iné citlivé osobné údaje.", back: "Späť na školy",
    placeholders: { name: "Gymnázium…", city: "Bratislava", region: "Bratislavský kraj", domain: "skola.sk", evidence: "Web školy, kontext oficiálneho e-mailu alebo kontakt na pracovníka školy, ktorý vie údaje potvrdiť." },
    errors: { database: "Overenie školy potrebuje databázu. Najprv nastav DATABASE_URL a skús to znova.", role: "Vyber platnú školskú rolu.", save: "Žiadosť sa nepodarilo uložiť. Skontroluj údaje a skús to znova." },
  },
} as const;

export function getSchoolCopy(locale: Locale) {
  return schoolCopy[locale];
}
