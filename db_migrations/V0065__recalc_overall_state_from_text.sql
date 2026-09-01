-- Ретроспективный пересчёт overall_state для отчётов, где оценка ещё не проставлена (NULL),
-- по тексту problems_identified через те же словари корней слов, что использует бот (red > yellow > green).
UPDATE t_p59822815_nonprofit_website_de.patient_daily_reports
SET overall_state = CASE
    WHEN problems_identified ~* '(жертв|чёрн|тёмн|нечестност|оправдан|маск|тяг|обид|провал|агресс|срыв|корон|хитр|грузит|закрыт|отрицани|презрени|угодничеств|бардак|глухонем|безответствен|х2|пхд|режим тишины|последстви|верёвк)' THEN 3
    WHEN problems_identified ~* '(устал|подустал|вымотал|сует|отвлека|нестабильн|инфантильн|детск|качел|ручник|напряжен|поникш|задумчив|пассивн)' THEN 6
    WHEN problems_identified ~* '(молодец|справил|стабильн|ресурс|бодрячк|включен|активн|помог|честн|ровн|умниц|прогресс|втягива|движени|уверен)' THEN 8
    ELSE overall_state
END
WHERE overall_state IS NULL
  AND problems_identified IS NOT NULL
  AND problems_identified <> '';