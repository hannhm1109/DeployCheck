import { CircleCheck, History, ListTodo } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { isReadOnlyDemo } from "@/server/demo-access";

export default async function AboutPage() {
  const t = await getTranslations("About");
  const steps = [
    { title: t("step1Title"), body: t("step1Body"), icon: ListTodo },
    { title: t("step2Title"), body: t("step2Body"), icon: CircleCheck },
    { title: t("step3Title"), body: t("step3Body"), icon: History },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
      <header className="max-w-3xl border-b border-[#dce5df] pb-9">
        <h1 className="text-[32px] font-semibold leading-tight text-[#192822]">{t("title")}</h1>
        <p className="mt-4 text-base leading-7 text-[#42574c]">{t("intro")}</p>
      </header>

      <section aria-labelledby="workflow-heading" className="py-9">
        <h2 id="workflow-heading" className="text-lg font-semibold text-[#192822]">{t("workflow")}</h2>
        <div className="mt-6 grid gap-7 border-y border-[#dce5df] py-7 md:grid-cols-3 md:gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="min-w-0">
                <Icon size={21} className="text-[#0b7059]" strokeWidth={1.8} aria-hidden="true" />
                <h3 className="mt-4 text-sm font-semibold text-[#192822]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#607269]">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-8 border-b border-[#dce5df] pb-10 md:grid-cols-2 md:gap-12">
        <section aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="text-lg font-semibold text-[#192822]">{t("scope")}</h2>
          <p className="mt-3 text-sm leading-6 text-[#607269]">{t("scopeBody")}</p>
        </section>
        <section aria-labelledby="rules-heading">
          <h2 id="rules-heading" className="text-lg font-semibold text-[#192822]">{t("rules")}</h2>
          <p className="mt-3 text-sm leading-6 text-[#607269]">{t("rulesBody")}</p>
        </section>
      </div>
      {isReadOnlyDemo() && <p className="py-6 text-sm text-[#607269]">{t("demo")}</p>}
    </main>
  );
}
