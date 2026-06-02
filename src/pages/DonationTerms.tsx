import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import SiteNav from "@/components/shared/SiteNav";
import SiteFooter from "@/components/shared/SiteFooter";
import Icon from "@/components/ui/icon";

export default function DonationTerms() {
  usePageMeta({
    title: "Условия внесения пожертвования — АНО «Спасение надежды»",
    description: "Условия внесения добровольных пожертвований в пользу АНО «Спасение надежды». Порядок, цели и возврат пожертвований.",
    canonical: "https://spasenie58.ru/donation-terms",
  });

  return (
    <div className="min-h-screen bg-beige font-golos">
      <SiteNav />

      <div className="pt-28 pb-24 max-w-3xl mx-auto px-6">
        <Link to="/#podderzhka" className="inline-flex items-center gap-2 text-sage text-sm mb-8 hover:opacity-75 transition-opacity">
          <Icon name="ArrowLeft" size={14} />
          Вернуться к пожертвованию
        </Link>

        <h1 className="font-cormorant text-ink text-4xl font-semibold mb-2">Условия внесения пожертвования</h1>
        <p className="text-foreground/50 text-sm mb-10">АНО «Спасение надежды» · ИНН 5800011843</p>

        <div className="space-y-8 text-foreground/75 leading-relaxed">

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">1. Общие положения</h2>
            <p>
              Автономная некоммерческая организация «Спасение надежды» (далее — Организация) принимает добровольные
              пожертвования от физических и юридических лиц в соответствии с Федеральным законом от 11.08.1995 № 135-ФЗ
              «О благотворительной деятельности и добровольчестве (волонтёрстве)» и Гражданским кодексом Российской Федерации (ст. 582).
            </p>
            <p className="mt-3">
              Пожертвование является добровольным безвозмездным взносом и не влечёт за собой возникновения каких-либо
              обязательств Организации перед жертвователем, кроме случаев, прямо предусмотренных настоящими условиями.
            </p>
          </section>

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">2. Цели использования пожертвований</h2>
            <p>Все поступившие пожертвования направляются исключительно на уставную деятельность Организации:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                "Оказание помощи женщинам и семьям, оказавшимся в трудной жизненной ситуации",
                "Организация кризисного приюта и временного проживания",
                "Психологическая, юридическая и социальная поддержка подопечных",
                "Реабилитационные программы и сопровождение семей",
                "Административные расходы, необходимые для реализации уставных целей (не более 20% от суммы пожертвований)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Icon name="CheckCircle" size={16} className="text-sage flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">3. Порядок внесения пожертвования</h2>
            <p>
              Пожертвование считается совершённым с момента поступления денежных средств на расчётный счёт Организации.
              Направив пожертвование, жертвователь подтверждает своё согласие с настоящими условиями.
            </p>
            <p className="mt-3">
              Организация принимает пожертвования в рублях Российской Федерации через платёжные системы, указанные
              на сайте. Минимальная сумма пожертвования не установлена.
            </p>
            <p className="mt-3">
              При оформлении регулярного (ежемесячного) пожертвования жертвователь даёт согласие на автоматическое
              списание указанной суммы каждый месяц. Отказаться от регулярных списаний можно в любой момент,
              обратившись по адресу <a href="mailto:spasenienadezhdi@bk.ru" className="text-sage hover:underline">spasenienadezhdi@bk.ru</a>.
            </p>
          </section>

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">4. Налоговые льготы для жертвователей</h2>
            <p>
              Физические лица, осуществившие пожертвование, имеют право на социальный налоговый вычет в размере фактически
              произведённых расходов, но не более 25% суммы дохода, полученного в налоговом периоде (пп. 1 п. 1 ст. 219 НК РФ).
            </p>
            <p className="mt-3">
              Юридические лица вправе учитывать расходы на благотворительность в порядке, предусмотренном
              действующим законодательством. Для получения подтверждающих документов обратитесь на
              электронный адрес <a href="mailto:spasenienadezhdi@bk.ru" className="text-sage hover:underline">spasenienadezhdi@bk.ru</a>.
            </p>
          </section>

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">5. Возврат пожертвования</h2>
            <p>
              Пожертвование может быть возвращено жертвователю по его письменному заявлению в следующих случаях:
            </p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                "Пожертвование было внесено ошибочно (техническая ошибка, дублирующий платёж)",
                "Жертвователь — физическое лицо отозвал пожертвование до его фактического использования",
                "Организация не может использовать пожертвование по целевому назначению",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Icon name="Info" size={16} className="text-sage flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Для возврата необходимо направить заявление на адрес{" "}
              <a href="mailto:spasenienadezhdi@bk.ru" className="text-sage hover:underline">spasenienadezhdi@bk.ru</a>{" "}
              с указанием даты, суммы платежа и реквизитов для возврата. Срок рассмотрения заявления — 10 рабочих дней.
            </p>
          </section>

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">6. Защита персональных данных</h2>
            <p>
              Персональные данные жертвователя (имя, email, номер телефона) обрабатываются исключительно в целях
              исполнения договора пожертвования, направления отчётности и благодарственных уведомлений.
              Данные не передаются третьим лицам и не используются в коммерческих целях.
            </p>
            <p className="mt-3">
              Обработка персональных данных осуществляется в соответствии с Федеральным законом от 27.07.2006
              № 152-ФЗ «О персональных данных».
            </p>
          </section>

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">7. Реквизиты Организации</h2>
            <div className="bg-white rounded-sm p-6 space-y-2 text-sm">
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">Наименование</span>
                <span className="text-ink font-medium">АНО «Спасение надежды»</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">ОГРН</span>
                <span className="text-ink">1245800010114</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">ИНН</span>
                <span className="text-ink">5800011843</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">КПП</span>
                <span className="text-ink">580001001</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">Адрес</span>
                <span className="text-ink">440011, г. Пенза, ул. 8 марта 17Б</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">Email</span>
                <a href="mailto:spasenienadezhdi@bk.ru" className="text-sage hover:underline">spasenienadezhdi@bk.ru</a>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <span className="text-foreground/45 uppercase tracking-wider text-xs">Телефон</span>
                <a href="tel:88003008685" className="text-sage hover:underline">8 800 300-86-85</a>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-cormorant text-ink text-2xl font-semibold mb-3">8. Контакты</h2>
            <p>
              По всем вопросам, связанным с пожертвованиями, обращайтесь по адресу{" "}
              <a href="mailto:spasenienadezhdi@bk.ru" className="text-sage hover:underline">spasenienadezhdi@bk.ru</a>{" "}
              или по телефону <a href="tel:88003008685" className="text-sage hover:underline">8 800 300-86-85</a> (бесплатно, Пн–Пт 9:00–18:00 МСК).
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-ink/10 text-foreground/35 text-xs">
          Последнее обновление: май 2026 г.
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}