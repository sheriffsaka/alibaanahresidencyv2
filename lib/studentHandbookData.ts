import { Language, StudentDocument } from '../types';

export interface HandbookChapter {
  id: string;
  number: number | string;
  title: string;
  sections?: {
    id: string;
    number?: string;
    title: string;
    content: string;
  }[];
  content: string;
}

export interface HandbookTranslation {
  title: string;
  subtitle: string;
  category: string;
  updated: string;
  description: string;
  version: string;
  effectiveDate: string;
  approvedBy: string;
  bismillah: string;
  bismillahTranslation: string;
  fullMarkdown: string;
  chapters: HandbookChapter[];
}

export const STUDENT_HANDBOOK_TRANSLATIONS: Record<Language, HandbookTranslation> = {
  en: {
    title: 'Student Accommodation Handbook',
    subtitle: 'Living Together in Safety, Brotherhood and Excellence',
    category: 'Policy & Safety',
    updated: 'Version 1.0 (July 20, 2026)',
    description: 'Official residency guide of Al Ibaanah Arabic Centre. Details community standards, Islamic values, housekeeping, quiet hours, Egyptian security regulations, maintenance, and emergency protocols.',
    version: '1.0',
    effectiveDate: 'July 20, 2026',
    approvedBy: 'Accommodation Manager, Al Ibaanah Arabic Centre',
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    bismillahTranslation: 'In the Name of Allah, the Most Gracious, the Most Merciful',
    fullMarkdown: `AL IBAANAH ARABIC CENTRE — STUDENT ACCOMMODATION HANDBOOK
Living Together in Safety, Brotherhood and Excellence

Official Publication of Al Ibaanah Arabic Centre
Version: 1.0 | Effective Date: July 20, 2026
Approved by: Accommodation Manager, Al Ibaanah Arabic Centre

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
In the Name of Allah, the Most Gracious, the Most Merciful

============================================================
TABLE OF CONTENTS
============================================================
Chapter 1 — Welcome
Chapter 2 — Our Values & Islamic Foundations
Chapter 3 — Living in the Accommodation
Chapter 4 — Living Together
Chapter 5 — Safety & Stewardship
Chapter 6 — Management & Accountability
Chapter 7 — Resident Declaration
Appendices:
  A. Important Contacts
  B. Cleaning Schedule
  C. Check-in / Check-out Procedures
  D. Frequently Asked Questions (FAQ)

============================================================
CHAPTER 1: WELCOME
============================================================
As-salāmu ʿalaykum wa raḥmatullāhi wa barakātuh.
Welcome to Al Ibaanah Student Accommodation.

On behalf of the management and staff of Al Ibaanah Arabic Centre, we are pleased to welcome you to a community of students united by a shared purpose: seeking beneficial knowledge and learning the language of the Qur'an.

For many students, this accommodation becomes far more than a place to sleep. It becomes a second home — a place where friendships are formed, knowledge is pursued, worship is strengthened, and character is refined.

The atmosphere of this residence does not depend on the building itself; it depends on the people who live within it. Every resident therefore contributes to the environment experienced by everyone else.

A clean room encourages comfort. A quiet hallway allows another student to revise. A kind word strengthens brotherhood. A thoughtful action may become a source of reward with Allah.

For this reason, living in Al Ibaanah Student Accommodation is both a privilege and a responsibility. We ask every resident to help preserve an environment characterised by:
• Safety
• Cleanliness
• Respect
• Brotherhood
• Excellence in conduct

Our sincere hope is that every student who leaves Al Ibaanah departs not only with stronger Arabic, but also with stronger character.

About Al Ibaanah Arabic Centre:
Established to serve students from around the world, Al Ibaanah Arabic Centre is dedicated to teaching the Arabic language through an immersive environment rooted in the Qur'an, the Sunnah, and authentic Islamic values.

Our mission extends beyond language acquisition. We strive to cultivate students whose character reflects the knowledge they seek — students distinguished by sincerity, discipline, respect, and excellence in conduct.

The Student Accommodation is an extension of that educational mission. It is intended to provide an environment that supports learning, worship, brotherhood, and personal development. Every policy contained within this handbook has been designed with that objective in mind.

Purpose of this Handbook:
This handbook governs conduct and community life within the accommodation. Financial and contractual terms of residence are set out separately in the Tenancy Agreement; where the two documents address the same matter, the Tenancy Agreement governs financial and contractual terms, and this Handbook governs day-to-day conduct.

This handbook has been prepared to help every resident understand the standards expected while living in Al Ibaanah Student Accommodation. Its objectives are to:
• Establish clear expectations for all residents;
• Protect the rights and wellbeing of everyone living in the accommodation;
• Preserve the facilities entrusted to us;
• Promote mutual respect and cooperation;
• Provide a safe and peaceful environment for worship, study, and rest.

These guidelines are intended not merely to regulate behaviour, but to cultivate a community that reflects the manners and values taught by Islam. Every resident is expected to read this handbook carefully and to observe its guidance throughout his stay.

Our Shared Commitment:
The principles in this handbook are designed to preserve five essential objectives:
1. Safety: Every resident should feel secure within the accommodation, knowing that the environment has been organised with his wellbeing in mind.
2. Cleanliness: Cleanliness promotes health, comfort, and dignity. Every resident shares responsibility for maintaining a pleasant living environment.
3. Brotherhood: Living together requires patience, kindness, forgiveness, and consideration for others. Strong communities are built through mutual respect and sincere concern for one another.
4. Respect for Property: The accommodation and everything within it are trusts that should be cared for responsibly. Preserving shared property benefits every current and future resident.
5. An Environment for Learning and Worship: This accommodation exists to support students in seeking knowledge. Every resident should contribute to an atmosphere that encourages study, reflection, worship, and personal development.

============================================================
CHAPTER 2: OUR VALUES & ISLAMIC FOUNDATIONS
============================================================
Knowledge is not measured solely by what a person memorises. Its true effect appears in his character. At Al Ibaanah, we believe that the conduct of a student should reflect the knowledge he seeks. Accordingly, every resident is encouraged to uphold the following values:

• Amānah (Trust): Everything entrusted to us — including this accommodation, its facilities, and the rights of fellow residents — is a trust from Allah. A believer honours trusts whether or not others are watching.
• Iḥsān (Excellence): A Muslim strives to do what is right with excellence. This includes keeping shared spaces clean, respecting others, fulfilling responsibilities, and contributing positively to the community.
• Raḥmah (Mercy): Living with others requires compassion, patience, and forgiveness. Residents are encouraged to overlook minor faults, assist one another, and treat every member of the community with kindness.
• Respect: Every resident deserves to be treated with dignity. Differences in nationality, language, culture, or background should strengthen our appreciation for one another rather than become causes of division.
• Responsibility: Every action affects someone else. Responsible residents seek solutions rather than create problems, report concerns promptly, and willingly fulfil their obligations.

Islamic Foundations:
The principles contained in this handbook are rooted in the guidance of the Qur'an and the Sunnah:
- "Indeed, Allah commands you to render trusts to whom they are due..." (Surah An-Nisā' 4:58)
- "Eat and drink, but do not be wasteful. Indeed, He does not love the wasteful." (Surah Al-A'rāf 7:31)
- "Each of you is a shepherd, and each of you is responsible for his flock." (Al-Bukhārī and Muslim)
- "There should be neither harming nor reciprocating harm." (Ibn Mājah)

These principles provide the ethical foundation upon which the remainder of this handbook is built.

============================================================
CHAPTER 3: LIVING IN THE ACCOMMODATION
============================================================
Living in shared accommodation requires consideration, cooperation, and personal responsibility. Every resident contributes to the quality of life experienced by everyone else. Small daily actions have a significant impact on the comfort and wellbeing of the entire community.

3.1 Resident Responsibilities:
Every resident is expected to:
• Treat fellow residents with respect, kindness, and courtesy.
• Maintain the cleanliness of both private and shared spaces.
• Respect the rights, privacy, and belongings of others.
• Protect the accommodation and its facilities from damage.
• Use electricity and water responsibly.
• Observe quiet hours.
• Report maintenance issues promptly.
• Cooperate with management whenever assistance is required.
• Conduct himself in a manner befitting a student of knowledge.

3.2 Cleanliness & Housekeeping:
Islam places great emphasis on cleanliness. Maintaining cleanliness remains a shared responsibility between management and residents.

Management's Responsibilities:
• Professional cleaning of the apartments three times each week.
• Cleaning of shared areas, including kitchens, bathrooms, corridors, and living rooms.
• Regular inspections to ensure the accommodation remains clean, safe, and properly maintained.

Residents' Responsibilities:
• Keep his bedroom clean and organised.
• Make his bed daily.
• Keep desks, wardrobes, and personal belongings tidy.
• Dispose of rubbish properly.
• Return shared spaces to a clean condition after use.
• Inform management if cleaning standards are not being maintained.

3.3 Kitchen Use & Food Hygiene:
The kitchen is a shared facility intended for the benefit of all residents:
After Preparing Food:
• Wash all dishes, utensils, pots, and pans immediately after use.
• Wipe kitchen surfaces and countertops.
• Return shared utensils to their designated places.
• Leave sinks free of dirty dishes.
• Clean the cooking area before leaving.

Food Storage:
• Store food neatly.
• Label personal food where appropriate.
• Dispose of expired food promptly.
• Avoid leaving cooked food uncovered.
• Ensure refrigerators remain clean and organised.

Waste Disposal:
• Kitchen rubbish should be placed only in the designated bins.
• When bins become full, empty them into larger outdoor waste containers without delay. Leaving rubbish inside attracts pests and creates unnecessary health risks.

3.4 Bathrooms:
Bathrooms are shared facilities and should be left clean for the next person:
• Leave bathroom floors reasonably dry after use.
• Dispose of tissues and sanitary waste in the bins provided.
• NEVER dispose of tissues in the toilet, as this frequently causes blockages in local Egyptian plumbing systems.
• Leave wash basins and toilets clean after use.
• Promptly report leaking taps, blocked drains, or broken plumbing fixtures.

3.5 Shared Living Areas:
• Return furniture to its proper place after use.
• Remove personal belongings when leaving.
• Keep tables and seating areas tidy.
• Avoid occupying shared spaces unnecessarily for extended periods when others are waiting to use them.
• Use the private room desk for long study sessions to keep communal dining tables accessible.

3.6 Respect for Personal Property:
• Do not use another person's food, drinks, clothing, books, electronic devices, chargers, or belongings without clear permission.
• Return borrowed items promptly and in original condition.

3.7 Care of Accommodation Property & Pets:
• Handle all Centre-provided furniture, appliances, and fixtures carefully.
• Do not move furniture between rooms without prior approval.
• Pets are strictly NOT permitted in the accommodation (including cats), ensuring cleanliness and accommodating residents with allergies.

============================================================
CHAPTER 4: LIVING TOGETHER
============================================================
"The believer to another believer is like a building, each part strengthening the other." (Al-Bukhārī and Muslim)

4.1 Brotherhood & Mutual Respect:
• Greet fellow residents with Salām when entering or leaving.
• Respect diversity of nationality, language, culture, and personal habits.
• Speak politely, avoid offensive language, and overlook minor mistakes with mercy.

4.2 Quiet Hours:
• Daily Quiet Hours: 10:00 PM to 6:00 AM.
• Avoid loud conversations, speaker audio, door slamming, or disruptive activities. Respect those resting, studying for exams, or waking early for Fajr and Tahajjud.

4.3 Guests & Visitors:
• Visitors must remain in designated common reception areas.
• Overnight guests are strictly not permitted.
• Residents are fully responsible for the conduct of their visitors.

4.4 Personal Conduct:
• Speak truthfully, fulfil commitments, dress modestly in shared spaces, and avoid arguments.

4.5 Resolving Differences:
• Speak privately, listen before responding, avoid assuming negative intentions, and seek reconciliation.
• Involve management if matters cannot be resolved amicably. (Surah Al-Ḥujurāt 49:10)

4.6 Respect for Privacy:
• Knock and wait for clear permission before entering another room.
• Respect study time and keep fellow residents' private affairs confidential.

4.7 Living with Iḥsān:
• Smile generously, spread salām, assist others unasked, keep shared areas spotless, be punctual, honour neighbours' rights, offer gentle advice, make excuses for others' shortcomings, thank service staff, and make du'ā for fellow residents.

============================================================
CHAPTER 5: SAFETY & STEWARDSHIP
============================================================
5.1 Stewardship of Allah's Blessings:
Use shelter, water, and electricity with gratitude, avoiding wastefulness.

5.2 Electricity Conservation:
• Turn off lights and air conditioners when leaving a room.
• Disconnect unused chargers and appliances.
• Report electrical faults immediately.

5.3 Water Conservation:
• Close taps completely; avoid leaving water running.
• Report leaking pipes or taps immediately.

5.4 Security:
• Lock apartment entrance doors at all times.
• Close windows before leaving; secure valuables.
• Never copy keys or provide access to unauthorised individuals.

5.5 Entry of Private Tutors (Egyptian Security Regulation):
• In strict compliance with Egyptian security regulations governing foreign student accommodation, Egyptian private tutors and instructors are NOT permitted to enter the accommodation to give private lessons.
• Private lessons with tutors must be conducted at external approved facilities.

5.6 Periodic Room Inspections:
• Management conducts periodic room inspections for cleanliness, safety, and inventory. Prior notice is provided where practical.

5.7 Maintenance Reporting:
• Immediately notify management regarding plumbing leaks, drain clogs, broken locks, faulty switches, or AC malfunctions.

5.8 Fire & Emergency Safety:
• In case of smoke, gas smell, or fire risk: notify management immediately, switch off electrical mains if safe, evacuate calmly, and call emergency services if required.
• Never tamper with electrical wiring or gas connections.

5.9 Smoking & Vaping:
• Smoking and vaping are strictly prohibited in all indoor areas of the residence.

5.10 Health & Hygiene:
• Maintain personal hygiene, ventilate rooms, dispose of rubbish daily, and report pests immediately.

5.11 Leaving Apartment Checklist:
✓ Lights & AC switched off
✓ Electrical appliances unplugged
✓ Windows closed
✓ Entrance door locked securely
✓ Rubbish emptied

============================================================
CHAPTER 6: MANAGEMENT & ACCOUNTABILITY
============================================================
6.1 Management's Commitment:
Provide clean, well-maintained housing, prompt maintenance, fair treatment, and continuous support for student welfare.

6.2 Residents' Commitment:
Comply with handbook guidelines, respect staff, care for facilities, and uphold Islamic student etiquette.

6.3 Behavioural Review Process:
• Stage 1: Friendly Verbal Reminder
• Stage 2: Formal Written Warning
• Stage 3: Final Administrative Review (May require vacating accommodation or loss of residency eligibility)

6.4 Property Damage:
Negligent or intentional damage requires full reimbursement for repair or replacement.

6.5 Lost Keys:
Report lost keys immediately; replacement fee applies.

6.6 Complaints & Suggestions:
Direct concerns to Accommodation Management; all matters are addressed in good faith.

6.7 Legal Compliance:
Strict adherence to Egyptian laws is mandatory.

6.8 Check-out Protocol:
Return keys, remove personal belongings, leave room clean, clear outstanding balances, and complete departure inspection.

A Message from Management:
"Dear Brother, You have travelled to seek beneficial knowledge. Our sincere hope is that your stay leaves you with improved Arabic, stronger faith, better manners, and lifelong brotherhood. May Allah bless your studies and grant you success in this life and the Hereafter. Āmīn."

============================================================
CHAPTER 7: RESIDENT DECLARATION
============================================================
"I acknowledge that I have received a copy of the Al Ibaanah Student Accommodation Handbook. I confirm that I have read, understood, and agree to comply with the policies and expectations contained within this handbook throughout my stay. I ask Allah to assist me in fulfilling these responsibilities with sincerity, honesty, and excellence."

============================================================
APPENDICES
============================================================
Appendix A — Important Contacts:
• Accommodation Manager: Ubayd — +20 103 007 2440
• Student Affairs Office: +20 111 233 5628 / al.ibaanah.housing4brothers@gmail.com
• Maintenance Contact: Same as Student Affairs Office above
• Nearest Hospital: Saudi German Hospital, Cairo — Hotline: 16259 (Location: https://maps.app.goo.gl/bzaGtpKpJVmmkf7i9)
• Fire Department: 180 | Police: 122 | Ambulance: 123

Appendix B — Cleaning Schedule:
• Professional cleaning of shared areas: Sunday, Tuesday, and Thursday.
• Residents remain responsible for their own bedroom and washing their own dishes.

Appendix C — Check-in & Check-out Procedures:
• Check-in: Room allocation, inventory verification, key handover, handbook acknowledgement.
• Check-out: Room inspection, key return, fee settlement, departure confirmation.

Appendix D — Frequently Asked Questions (FAQ):
• Can I change rooms? Yes, subject to availability and Accommodation Manager approval.
• Can I receive visitors? Yes, in common areas only; no overnight guests.
• What if something breaks? Report immediately to management via WhatsApp / Student Portal.
• What happens if I lose my key? Report immediately; replacement fee applies.
• How to extend stay? Contact Accommodation Manager directly for term renewal availability.`,
    chapters: [
      {
        id: 'ch1',
        number: 1,
        title: 'Welcome & About Al Ibaanah',
        content: `As-salāmu ʿalaykum wa raḥmatullāhi wa barakātuh.\nWelcome to Al Ibaanah Student Accommodation.\n\nOn behalf of the management and staff of Al Ibaanah Arabic Centre, we are pleased to welcome you to a community of students united by a shared purpose: seeking beneficial knowledge and learning the language of the Qur'an.\n\nFor many students, this accommodation becomes far more than a place to sleep. It becomes a second home — a place where friendships are formed, knowledge is pursued, worship is strengthened, and character is refined.\n\nOur Shared Commitment Preserves:\n1. Safety\n2. Cleanliness\n3. Brotherhood\n4. Respect for Property\n5. An Environment for Learning and Worship`
      },
      {
        id: 'ch2',
        number: 2,
        title: 'Our Values & Islamic Foundations',
        content: `Knowledge is not measured solely by memorisation; its true effect appears in character.\n\nCore Islamic Values:\n• Amānah (Trust) — Surah An-Nisā' 4:58\n• Iḥsān (Excellence)\n• Raḥmah (Mercy)\n• Respect\n• Responsibility\n\nProphetic Guidance:\n"Each of you is a shepherd, and each of you is responsible for his flock." (Al-Bukhārī & Muslim)\n"There should be neither harming nor reciprocating harm." (Ibn Mājah)`
      },
      {
        id: 'ch3',
        number: 3,
        title: 'Living in the Accommodation',
        content: `3.1 Resident Responsibilities & House Rules\n3.2 Cleanliness & Housekeeping (Professional cleaning 3x per week; daily personal bedroom tidiness)\n3.3 Kitchen Use & Food Hygiene (Wash dishes immediately, label food, dispose waste into outdoor bins)\n3.4 Bathrooms (Never flush tissues into toilets; keep dry)\n3.5 Shared Living Areas (Keep tidy, long study sessions in personal room)\n3.6 Respect for Personal Property\n3.7 Care of Property & No Pets Allowed`
      },
      {
        id: 'ch4',
        number: 4,
        title: 'Living Together & Brotherhood',
        content: `"The believer to another believer is like a building, each part strengthening the other." (Al-Bukhārī)\n\n4.1 Brotherhood & Mutual Respect\n4.2 Quiet Hours: 10:00 PM to 6:00 AM daily\n4.3 Guests & Visitors: Common areas only; NO overnight guests\n4.4 Personal Conduct & Modest Dress\n4.5 Resolving Differences with Wisdom (Surah Al-Ḥujurāt 49:10)\n4.6 Respect for Privacy\n4.7 Living with Iḥsān: 10 Practical Good Deeds`
      },
      {
        id: 'ch5',
        number: 5,
        title: 'Safety & Stewardship',
        content: `5.1 Stewardship of Allah's Blessings\n5.2 Electricity Conservation (Turn off AC and lights when leaving)\n5.3 Water Conservation\n5.4 Security (Keep apartment entrance locked)\n5.5 Entry of Private Tutors (Egyptian Security Regulation: Egyptian tutors not permitted inside accommodation; lessons must be external)\n5.6 Periodic Room Inspections\n5.7 Maintenance Reporting\n5.8 Fire Safety & Emergency Response\n5.9 Smoking & Vaping: Strictly Prohibited\n5.10 Health & Hygiene\n5.11 Leaving the Apartment Checklist`
      },
      {
        id: 'ch6',
        number: 6,
        title: 'Management & Accountability',
        content: `6.1 Management's Commitment to Quality\n6.2 Residents' Obligations\n6.3 Behavioural Review Process (Stage 1: Reminder, Stage 2: Warning, Stage 3: Final Review/Eviction)\n6.4 Property Damage & Financial Liability\n6.5 Lost Key Policy\n6.6 Complaints, Suggestions & Fairness\n6.7 Legal Compliance with Egyptian Law\n6.8 Departure & Check-out Protocol\n\nA Message from Management:\nMay Allah bless your studies, grant you beneficial knowledge, increase you in wisdom, and make your stay among us a source of goodness in this life and the Hereafter. Āmīn.`
      },
      {
        id: 'ch7',
        number: 7,
        title: 'Resident Declaration',
        content: `I acknowledge that I have received a copy of the Al Ibaanah Student Accommodation Handbook.\nI confirm that I have read, understood, and agree to comply with all policies and expectations.\nI ask Allah to assist me in fulfilling these responsibilities with sincerity, honesty, and excellence.`
      },
      {
        id: 'appendices',
        number: 'App',
        title: 'Appendices (Contacts, Cleaning & FAQ)',
        content: `Appendix A — Important Contacts:\n• Accommodation Manager: Ubayd (+20 103 007 2440)\n• Student Affairs: +20 111 233 5628 / al.ibaanah.housing4brothers@gmail.com\n• Nearest Hospital: Saudi German Hospital Cairo (Hotline 16259)\n• Emergency: Fire (180), Police (122), Ambulance (123)\n\nAppendix B — Cleaning Days: Sunday, Tuesday, Thursday\nAppendix C — Check-in & Check-out Protocols\nAppendix D — Frequently Asked Questions`
      }
    ]
  },
  ar: {
    title: 'دليل سكن طلاب مركز الإبانة لتعليم اللغة العربية',
    subtitle: 'العيش المشترك في أمان وأخوة وتميز',
    category: 'السياسات والسلامة',
    updated: 'الإصدار 1.0 (20 يوليو 2026)',
    description: 'الدليل الرسمي الشامل لسكن طلاب مركز الإبانة بالقاهرة. يتضمن قيم الأخوة والأمانة، مواعيد الهدوء، إرشادات النظافة، اللوائح الأمنية المصرية، إجراءات الصيانة والطوارئ.',
    version: '1.0',
    effectiveDate: '20 يوليو 2026',
    approvedBy: 'مدير السكن الطلابي - مركز الإبانة لتعليم اللغة العربية',
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    bismillahTranslation: 'بسم الله الرحمن الرحيم',
    fullMarkdown: `مركز الإبانة لتعليم اللغة العربية — دليل سكن الطلاب
العيش المشترك في أمان وأخوة وتميز

إصدار رسمي معتمد من مركز الإبانة لتعليم اللغة العربية
الإصدار: 1.0 | تاريخ السريان: 20 يوليو 2026
معتمد من: إدارة السكن الطلابي - مركز الإبانة لتعليم اللغة العربية

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ

============================================================
فهرس المحتويات
============================================================
الفصل الأول — الترحيب
الفصل الثاني — قيمنا وأسسنا الإسلامية
الفصل الثالث — الحياة في السكن
الفصل الرابع — العيش المشترك
الفصل الخامس — السلامة وحفظ النعم
الفصل السادس — الإدارة والمسؤولية
الفصل السابع — إقرار وتعهد الطالب
الملاحق:
  أ. أرقام الاتصال الهامة
  ب. جدول النظافة الأسبوعي
  ج. إجراءات استلام وتسليم السكن
  د. الأسئلة الشائعة

============================================================
الفصل الأول: الترحيب
============================================================
السلام عليكم ورحمة الله وبركاته.
مرحباً بكم في سكن طلاب مركز الإبانة لتعليم اللغة العربية.

يسر إدارة ومنسوبي مركز الإبانة أن ترحب بكم في مجتمع طلابي يوحده هدف سامٍ: طلب العلم النافع وتعلم لغة القرآن الكريم.

إن هذا السكن ليس مجرد مكان للمبيت؛ بل هو بيت ثانٍ تنعقد فيه أواصر الأخوة، وتصقل فيه الأخلاق، وتزكو فيه النفوس بالعبادة وتحصيل العلم.

إن جودة بيئة السكن لا تصنعها المباني والجدران، بل يصنعها قاطنوها بتعاملهم وسلوكهم اليومي. لذا فإن كل طالب يسهم مباشرة في صناعة بيئة إيجابية للجميع.

الغرفة النظيفة تورث الراحة، والممر الهادئ يعين أخاك على المراجعة، والكلمة الطيبة تشد وثاق الأخوة، والعمل الصالح يرجى به عظيم الأجر عند الله.

لذا نرجو من الجميع الحفاظ على بيئة تتميز بـ:
• الأمان والسلامة
• النظافة والطهارة
• الاحترام المتبادل
• الأخوة الصادقة
• التميز في السلوك والأدب

عن مركز الإبانة:
تأسس المركز لخدمة طلاب العلم من مختلف أرجاء العالم، مكرساً جهوده لتعليم لغة الضاد في بيئة علمية أصيلة مستمدة من القرآن والسنة وقيم الإسلام الحنيف.

التزاماتنا الخمسة المشتركة:
1. الأمان: شعور كل طالب بالطمأنينة والسكينة.
2. النظافة: مسؤولية تشاركية لحفظ الصحة والراحة.
3. الأخوة: قيام المجتمع على التراحم والمسامحة والتعاون.
4. رعاية الممتلكات: الحفاظ على أثاث ومرافق السكن كأمانة شرعية.
5. بيئة مناسبة للعلم والعبادة: توفير الأجواء الملائمة للمذاكرة وتلاوة القرآن.

============================================================
الفصل الثاني: قيمنا وأسسنا الإسلامية
============================================================
إن العلم الحقيقي يظهر أثره في سمك وخلق صاحبه:
• الأمانة: حفظ مرافق السكن وحقوق الزملاء أمانة أمام الله (النساء: 58).
• الإحسان: إتقان العمل والمحافظة على نظافة الأماكن المشتركة والرفق بالإخوان.
• الرحمة: التغاضي عن الهفوات وتقديم العون والمحبة.
• الاحترام: تقدير جميع الطلاب بغض النظر عن الجنسية أو اللغة أو الثقافة.
• المسؤولية: المبادرة بحل الإشكالات والإبلاغ عن الأعطال فوراً.

الأسس الشرعية:
- «إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا» (النساء: 58)
- «وَكُلُوا وَاشْرَبُوا وَلَا تُسْرِفُوا إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ» (الأعراف: 31)
- «كُلُّكُمْ رَاعٍ وَكُلُّكُمْ مَسْؤولٌ عَنْ رَعِيَّتِهِ» (متفق عليه)
- «لَا ضَرَرَ وَلَا ضِرَارَ» (رواه ابن ماجه)

============================================================
الفصل الثالث: الحياة في السكن والنظافة
============================================================
3.1 مسؤوليات المقيم:
• حسن المعاملة وإفشاء السلام.
• المحافظة على نظافة الغرف الخاصة والمرافق المشتركة.
• ترشيد استهلاك الكهرباء والماء.
• الالتزام التام بساعات الهدوء.
• الإبلاغ الفوري عن أي عطل أو تلف.

3.2 النظافة والتدبير المنزلي:
• توفر الإدارة خدمة نظافة احترافية للشقق والمرافق المشتركة (3 مرات أسبوعياً).
• يلتزم كل طالب بترتيب سريره يومياً ونظافة مكتبه وغرفته.
• إخراج القمامة ووضعها في الحاويات الخارجية المخصصة وتجنب تراكمها داخل الشقة.

3.3 استخدام المطبخ وحفظ الأطعمة:
• غسل الأواني والأطباق وأدوات الطهي فور الانتهاء منها مباشرة.
• مسح أسطح المطبخ وترك حوض الغسيل نظيفاً وخالياً من الصحون المتسخة.
• حفظ الأطعمة في علب محكمة ووضع الاسم على الأغذية الخاصة بالثلاجة.

3.4 دورات المياه:
• ترك أرضية الحمام جافة ونظيفة بعد الاستخدام.
• يمنع منعاً باتاً إلقاء المناديل الورقية داخل المرحاض تجنباً لانسداد شبكة الصرف الصحي.
• إلقاء المناديل والمخلفات داخل السلات المخصصة لذلك فقط.

3.5 الصالة وغرف المعيشة:
• إعادة الأثاث إلى موضعه بعد الاستخدام والمحافظة على ترتيب الطاولات.
• تجعل طاولة الطعام للوجبات والقراءة الخفيفة؛ وتخصص المذاكرة الطويلة لمكاتب الغرف الخاصة.

3.6 احترام الملكية الخاصة:
• لا يجوز استخدام طعام أو أجهزة أو ملابس أو كتب الآخرين إلا بإذن صريح مسبق.

3.7 رعاية أثاث السكن والحيوانات:
• التعامل بعناية مع المكيفات والأجهزة والأثاث.
• يمنع منعاً باتاً تربية أو إدخال الحيوانات الأليفة (بما في ذلك القطط) إلى السكن حفاظاً على النظافة وصحة من يعانون من الحساسية.

============================================================
الفصل الرابع: العيش المشترك والأخوة
============================================================
«المؤمن للمؤمن كالبنيان يشد بعضه بعضاً» (متفق عليه)

4.1 الأخوة وحسن الخلق:
• إفشاء السلام وحسن الاستماع والبعد عن الجدال والعبارات الجارحة.

4.2 ساعات الهدوء:
• تُراعى ساعات الهدوء يومياً من الساعة 10:00 مساءً وحتى 6:00 صباحاً.
• يُمنع رفع الأصوات أو استخدام مكبرات الصوت أو إغلاق الأبواب بشدة مراعاةً للنائمين والمراجعين والقائمين لصلاة الفجر.

4.3 الزوار والضيوف:
• يُسمح باستقبال الزوار في الأماكن العامة المخصصة فقط.
• يُمنع منعاً باتاً مبيت الضيوف أو الزوار داخل السكن.

4.4 حل الخلافات:
• التناصح بالرفق والستر والبحث عن الصلح والمودة (الحجرات: 10).
• اللجوء لإدارة السكن في حال تعذر التوصل لحل ودي.

4.5 احترام الخصوصية:
• الاستئذان وطرق الباب قبل الدخول واحترام أوقات راحة ومذاكرة الزملاء.

============================================================
الفصل الخامس: السلامة وحفظ النعم
============================================================
5.1 حفظ نعم الله وترشيد الاستهلاك:
• إطفاء الأنوار والمكيفات عند مغادرة الغرفة فوراً.
• إحكام غلق صنابير المياه وعدم تركها تقطر.

5.2 أمن السكن:
• التأكد من إغلاق وقفل باب الشقة الرئيسي دائماً عند الدخول والخروج.
• عدم إعطاء المفاتيح أو السماح بالدخول لأي شخص غير مصرح له.

5.3 دخول المعلمين والدروس الخصوصية (تعليمات الأمن المصرية):
• التزاماً باللوائح والتعليمات الأمنية الرسمية المطبقة في جمهورية مصر العربية والخاصة بسكن الطلاب الأجانب، يمنع منعاً باتاً دخول المعلمين والأساتذة المصريين إلى داخل السكن لإعطاء دروس خاصة.
• يجب على الطلاب الراغبين في أخذ دروس خاصة مع مدرسين مصريين تنسيق ذلك في مقرات وأماكن تعليمية خارج السكن الطلابي.

5.4 التفتيش والمتابعة الدورية:
• تجري الإدارة جولات متابعة وتفتيش دورية للتأكد من سلامة المرافق والنظافة.

5.5 الإبلاغ عن الأعطال:
• الإبلاغ الفوري عن أي تسريب مياه أو انسداد صرف أو عطل في التكييف أو الكهرباء.

5.6 منع التدخين والشيشة الإلكترونية:
• التدخين والتدخين الإلكتروني (الفيب) ممنوع منعاً باتاً ومطلقاً في كافة أرجاء السكن والشرفات.

5.7 قائمة الخروج من الشقة:
✓ إطفاء الأنوار والمكيفات
✓ فصل الأجهزة الكهربائية والشواحن
✓ إغلاق النوافذ
✓ قفل الباب الخارجي بإحكام

============================================================
الفصل السادس: الإدارة والمسؤولية واللوائح
============================================================
6.1 تدرج معالجة المخالفات:
• المرحلة الأولى: تذكير وتنبيه شفهي ودي.
• المرحلة الثانية: إنذار كتابي رسمي.
• المرحلة الثالثة: مراجعة إدارية نهائية (قد تصل إلى إلغاء السكن أو عدم التجديد).

6.2 المسؤولية المالية وتلف الممتلكات:
• أي تلف ناتج عن إهمال أو سوء استخدام يتحمل المتسبب تكلفة إصلاحه أو استبداله بالكامل.

6.3 فقدان المفاتيح:
• يجب الإبلاغ فوراً، وتطبق رسوم استخراج نسخة بديلة.

6.4 إجراءات المغادرة النهائية:
• تسليم المفاتيح، إخلاء المتعلقات، ترك الغرفة نظيفة، وسداد أي التزامات مالية مستحقة.

رسالة الإدارة:
«أخي الطالب الكريم: لقد هاجرت من بلدك طلباً لأشرف المقاصد وهو العلم الشرعي ولغة القرآن. ورجاؤنا أن تغادر مركز الإبانة وقد ازددت علماً وفهماً وخلقاً رفيعاً وصحبة صالحة تدوم في الدنيا والآخرة. نسأل الله أن يبارك في دراستك ويجعلك مباركاً أينما كنت. آمين.»

============================================================
الفصل السابع: إقرار وتعهد الطالب المقيم
============================================================
«أقر أنا الطالب المقيم بأني استلمت نسخة من دليل سكن طلاب مركز الإبانة، وقرأت كافة بنوده وتعهدات العيش المشترك، وألتزم بالامتثال التام لجميع القواعد والتعليمات الواردة فيه طوال فترة إقامتي، سائلاً الله التوفيق والسداد.»

============================================================
الملاحق
============================================================
الملحق (أ) — أرقام الاتصال الهامة:
• مدير السكن (الأستاذ عبيد): 2440 007 103 20+
• مكتب شؤون الطلاب: 5628 233 111 20+ | البريد: al.ibaanah.housing4brothers@gmail.com
• أقرب مستشفى: المستشفى السعودي الألماني بالقاهرة — الخط الساخن: 16259
• الدفاع المدني والإطفاء: 180 | الإسعاف: 123 | الشرطة: 122

الملحق (ب) — أيام النظافة المشتركة:
• الأحد، الثلاثاء، الخميس (مع مسؤولية الطالب المستمرة عن غرفته وأوانيه الخاصة).

الملحق (ج) — استلام وتسليم الغرفة:
• فحص محتويات الغرفة والأثاث والتكييف والتوقيع على نموذج الاستلام.

الملحق (د) — إجابات الأسئلة المتكررة (تغيير الغرف، الزيارات، تجديد الإقامة).`,
    chapters: [
      {
        id: 'ch1',
        number: 1,
        title: 'الترحيب وعن مركز الإبانة',
        content: `السلام عليكم ورحمة الله وبركاته.\nمرحباً بكم في سكن طلاب مركز الإبانة لتعليم اللغة العربية بالقاهرة.\n\nيسر إدارة ومنسوبي مركز الإبانة أن ترحب بكم في مجتمع طلابي يوحده طلب العلم النافع ولغة القرآن.\n\nالتزاماتنا الخمسة:\n1. الأمان والسلامة\n2. النظافة والطهارة\n3. الأخوة والتراحم\n4. رعاية الممتلكات كأمانة\n5. توفير بيئة ملائمة للعلم والعبادة`
      },
      {
        id: 'ch2',
        number: 2,
        title: 'قيمنا وأسسنا الإسلامية',
        content: `القيم الإسلامية الأصيلة:\n• الأمانة (النساء: 58)\n• الإحسان في العمل والتعامل\n• الرحمة والتغاضي عن الهفوات\n• الاحترام المتبادل لجميع الجنسيات\n• المسؤولية والمبادرة\n\n«كلكم راع وكلكم مسؤول عن رعيته» (متفق عليه)\n«لا ضرر ولا ضرار» (ابن ماجه)`
      },
      {
        id: 'ch3',
        number: 3,
        title: 'الحياة في السكن وإرشادات النظافة',
        content: `3.1 واجبات المقيم والآداب اليومية\n3.2 النظافة الدورية (نظافة الشقق 3 مرات أسبوعياً، مع ترتيب الغرفة والسرير يومياً)\n3.3 المطبخ (غسل الصحون فوراً، وضع علامات على الأطعمة بالثلاجة، تفريغ القمامة في الحاويات الخارجية)\n3.4 دورات المياه (عدم إلقاء المناديل بالمرحاض إطلاقاً؛ حفظ الأرضيات جافة)\n3.5 الصالات وغرف المعيشة\n3.6 احترام الملكيات الخاصة\n3.7 الحفاظ على الأثاث ومنع تربية أو إدخال الحيوانات الأليفة`
      },
      {
        id: 'ch4',
        number: 4,
        title: 'العيش المشترك وحقوق الأخوة',
        content: `«المؤمن للمؤمن كالبنيان يشد بعضه بعضاً»\n\n4.1 الأخوة وإفشاء السلام\n4.2 ساعات الهدوء: يومياً من 10:00 مساءً إلى 6:00 صباحاً\n4.3 الزوار: في الأماكن العامة فقط؛ يمنع مبيت الزوار منعاً باتاً\n4.4 السلوك الشخصي وحسن المظهر\n4.5 حل الخلافات بالرفق والتناصح (الحجرات: 10)\n4.6 حفظ الخصوصية والاستئذان\n4.7 العيش بإحسان: 10 أعمال صالحة يومية`
      },
      {
        id: 'ch5',
        number: 5,
        title: 'السلامة وحفظ النعم واللوائح الأمنية',
        content: `5.1 ترشيد استهلاك الكهرباء والماء\n5.2 إحكام قفل أبواب الشقة دائماً\n5.3 دخول المعلمين المصريين (تعليمات الأمن المصرية: يمنع دخول المدرسين والأساتذة المصريين للسكن لإعطاء دروس خاصة؛ ويجب أن تتم الدروس خارج السكن)\n5.4 التفتيش والمتابعة الدورية\n5.5 الإبلاغ الفوري عن الأعطال\n5.6 منع التدخين والفيب منعاً قاطعاً\n5.7 قائمة تفقد الشقة قبل الخروج`
      },
      {
        id: 'ch6',
        number: 6,
        title: 'الإدارة والمسؤولية وإجراءات المغادرة',
        content: `6.1 التزامات الإدارة نحو الطلاب\n6.2 التدرج في التنبيهات (تذكير ودي -> إنذار كتابي -> مراجعة إدارية)\n6.3 المسؤولية المالية عن تلف الممتلكات\n6.4 مفاتيح السكن المفقودة\n6.5 الالتزام بالقوانين المصرية\n6.6 إجراءات إخلاء الطرف وتسليم الغرفة عند المغادرة\n\nدعاء ورسالة من الإدارة للطالب الكريم بالتوفيق والبركة.`
      },
      {
        id: 'ch7',
        number: 7,
        title: 'إقرار وتعهد الطالب المقيم',
        content: `نص الإقرار الرسمي باستلام الدليل والاطلاع على بنوده والتعهد بالالتزام بكافة اللوائح والآداب طوال فترة الإقامة.`
      },
      {
        id: 'appendices',
        number: 'ملاحق',
        title: 'الملاحق (أرقام الطوارئ، جدول النظافة، والأسئلة الشائعة)',
        content: `أرقام الاتصال الهامة:\n• الأستاذ عبيد (مدير السكن): 2440 007 103 20+\n• مكتب شؤون الطلاب: 5628 233 111 20+\n• المستشفى السعودي الألماني: 16259\n• المطافئ: 180 | الإسعاف: 123 | النجدة: 122\n\nأيام النظافة: الأحد، الثلاثاء، الخميس`
      }
    ]
  },
  fr: {
    title: 'Manuel de Résidence Étudiante',
    subtitle: 'Vivre ensemble dans la sécurité, la fraternité et l’excellence',
    category: 'Règlement & Sécurité',
    updated: 'Version 1.0 (20 Juillet 2026)',
    description: 'Guide officiel de résidence du Centre Arabe Al Ibaanah au Caire. Décrit les normes communautaires, les valeurs islamiques, les heures de calme, la réglementation de sécurité égyptienne et les contacts d’urgence.',
    version: '1.0',
    effectiveDate: '20 Juillet 2026',
    approvedBy: 'Responsable du Logement, Centre Arabe Al Ibaanah',
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    bismillahTranslation: 'Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux',
    fullMarkdown: `CENTRE ARABE AL IBAANAH — MANUEL DE RÉSIDENCE ÉTUDIANTE
Vivre ensemble dans la sécurité, la fraternité et l'excellence

Publication Officielle du Centre Arabe Al Ibaanah
Version : 1.0 | Date d'entrée en vigueur : 20 Juillet 2026
Approuvé par : Responsable de l'hébergement, Centre Arabe Al Ibaanah

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux

TABLE DES MATIÈRES :
Chapitre 1 — Bienvenue & À propos d'Al Ibaanah
Chapitre 2 — Nos Valeurs & Fondements Islamiques
Chapitre 3 — La Vie dans la Résidence & Entretien
Chapitre 4 — Vivre Ensemble & Fraternité
Chapitre 5 — Sécurité & Réglementations Officielles
Chapitre 6 — Gestion, Responsabilité & Procédures
Chapitre 7 — Déclaration du Résident
Annexes (Contacts Importants, Planning de Ménage, FAQ)

POINTS CLÉS :
• Heures de calme : De 22h00 à 06h00 tous les jours.
• Interdiction formelle de fumer et vapoter.
• Visiteurs autorisés uniquement dans les espaces communs d'accueil ; aucun invité pour la nuit.
• Règlementation sécuritaire égyptienne : Les tuteurs et professeurs particuliers égyptiens ne sont pas autorisés à entrer dans la résidence pour dispenser des cours privés (les cours doivent avoir lieu à l'extérieur).
• Ménage professionnel des espaces partagés effectué 3 fois par semaine (dimanche, mardi, jeudi).
• Ne jamais jeter de papier ou lingettes dans les toilettes pour éviter d'obstruer la plomberie.
• Contact Responsable Résidence (Ubayd) : +20 103 007 2440 | Hôpital Saudi German : 16259 | Pompiers : 180.`,
    chapters: [
      {
        id: 'ch1',
        number: 1,
        title: 'Bienvenue & À propos d’Al Ibaanah',
        content: `As-salāmu ʿalaykum wa raḥmatullāhi wa barakātuh.\nBienvenue à la Résidence Étudiante d'Al Ibaanah au Caire.\n\nNos 5 engagements partagés :\n1. Sécurité\n2. Propreté\n3. Fraternité\n4. Respect des biens\n5. Cadre propice à l'apprentissage et à l'adoration`
      },
      {
        id: 'ch2',
        number: 2,
        title: 'Valeurs & Fondements Islamiques',
        content: `Valeurs fondamentales :\n• Amānah (Dépôt de confiance)\n• Iḥsān (Excellence)\n• Raḥmah (Miséricorde et bienveillance)\n• Respect mutuel\n• Responsabilité personnelle`
      },
      {
        id: 'ch3',
        number: 3,
        title: 'Vie Quotidienne, Cuisine & Sanitaires',
        content: `• Ménage des espaces communs assuré 3x par semaine.\n• Faire la vaisselle immédiatement après chaque repas.\n• Ne jamais jeter de mouchoirs dans les toilettes (utiliser les poubelles).\n• Animaux strictement interdits.`
      },
      {
        id: 'ch4',
        number: 4,
        title: 'Vivre Ensemble & Heures de Calme',
        content: `• Heures de calme strictes : 22h00 à 06h00.\n• Visiteurs uniquement dans les réceptions communes ; interdiction absolue d'invités pour la nuit.\n• Éviter les disputes et régler les différends avec sagesse.`
      },
      {
        id: 'ch5',
        number: 5,
        title: 'Sécurité & Réglementation Égyptienne',
        content: `• Verrouiller systématiquement la porte d'entrée.\n• Extinction des lumières et climatiseurs en quittant la pièce.\n• Réglementation égyptienne : Les professeurs particuliers égyptiens ne peuvent pas pénétrer dans la résidence pour des cours.\n• Interdiction formelle du tabac et de la vape.`
      },
      {
        id: 'ch6',
        number: 6,
        title: 'Gestion, Procédures & Départ',
        content: `• Signalement immédiat de toute panne ou fuite.\n• Restitution des clés et vérification d'inventaire lors du départ.\n• Respect absolu des lois égyptiennes.`
      },
      {
        id: 'appendices',
        number: 'Annexe',
        title: 'Contacts d’Urgence & FAQ',
        content: `• Responsable Logement (Ubayd) : +20 103 007 2440\n• Bureau des Affaires Étudiantes : +20 111 233 5628\n• Hôpital Saudi German : 16259\n• Urgences : Pompiers (180), Police (122), Ambulance (123)`
      }
    ]
  },
  ru: {
    title: 'Справочник студенческого общежития',
    subtitle: 'Совместное проживание в безопасности, братстве и совершенстве',
    category: 'Правила и безопасность',
    updated: 'Версия 1.0 (20 июля 2026)',
    description: 'Официальное руководство для студентов арабского центра Аль-Ибаана в Каире. Описывает правила общежития, исламские ценности, часы тишины, египетские нормы безопасности и экстренные контакты.',
    version: '1.0',
    effectiveDate: '20 июля 2026',
    approvedBy: 'Управляющий общежитием, Арабский центр Аль-Ибаана',
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    bismillahTranslation: 'С именем Аллаха, Милостивого, Милосердного',
    fullMarkdown: `АРАБСКИЙ ЦЕНТР АЛЬ-ИБААНА — СПРАВОЧНИК СТУДЕНЧЕСКОГО ОБЩЕЖИТИЯ
Совместное проживание в безопасности, братстве и совершенстве

Официальное издание Арабского центра Аль-Ибаана
Версия: 1.0 | Дата вступления в силу: 20 июля 2026 г.
Утверждено: Управляющий общежитием, Арабский центр Аль-Ибаана

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
С именем Аллаха, Милостивого, Милосердного

СОДЕРЖАНИЕ:
Глава 1 — Приветствие и о центре Аль-Ибаана
Глава 2 — Наши ценности и исламские основы (Аманат, Ихсан, Рахма)
Глава 3 — Проживание в общежитии и чистота
Глава 4 — Совместная жизнь и братство
Глава 5 — Безопасность и правила
Глава 6 — Администрация и ответственность
Глава 7 — Декларация студента
Приложения (Контакты, График уборки, Частые вопросы)

ОСНОВНЫЕ ПРАВИЛА:
• Часы тишины: ежедневно с 22:00 до 06:00.
• Курение и вейпинг категорически запрещены на всей территории.
• Гости допускаются только в специально отведенные общие зоны; ночевка посторонних строго запрещена.
• Правила безопасности Египта: Египетским частным репетиторам запрещено входить в общежитие для проведения уроков. Уроки должны проходить за пределами общежития.
• Профессиональная уборка общих зон проводится 3 раза в неделю (вс, вт, чт).
• Запрещено смывать салфетки и бумагу в унитаз во избежание засоров.
• Контакт управляющего (Убайд): +20 103 007 2440 | Больница Saudi German: 16259 | Пожарная служба: 180.`,
    chapters: [
      {
        id: 'ch1',
        number: 1,
        title: 'Приветствие и о центре',
        content: `Ас-саляму алейкум ва рахматуллахи ва баракатух.\nДобро пожаловать в студенческое общежитие Аль-Ибаана в Каире.\n\nНаши 5 общих обязательств:\n1. Безопасность\n2. Чистота\n3. Братство\n4. Бережное отношение к имуществу\n5. Среда для учебы и поклонения`
      },
      {
        id: 'ch2',
        number: 2,
        title: 'Исламские ценности и основы',
        content: `Ключевые ценности:\n• Аманат (Доверие и ответственность)\n• Ихсан (Стремление к наилучшему)\n• Рахма (Милосердие и взаимовыручка)\n• Уважение различий в культуре и языках\n• Личная ответственность`
      },
      {
        id: 'ch3',
        number: 3,
        title: 'Быт, кухня и гигиена',
        content: `• Мыть посуду сразу после еды.\n• Не выбрасывать салфетки в унитаз.\n• Уборка общих зон 3 раза в неделю.\n• Содержание животных строго запрещено.`
      },
      {
        id: 'ch4',
        number: 4,
        title: 'Братство и часы тишины',
        content: `• Часы тишины: 22:00 – 06:00.\n• Приветствие салямом, проявление терпения.\n• Запрет на ночлег гостей.`
      },
      {
        id: 'ch5',
        number: 5,
        title: 'Безопасность и правила Египта',
        content: `• Выключать свет и кондиционеры при выходе.\n• Требование безопасности Египта: частные преподаватели не допускаются в общежитие.\n• Полный запрет на курение и электронные сигареты.`
      },
      {
        id: 'appendices',
        number: 'Прил.',
        title: 'Контакты и экстренные службы',
        content: `• Управляющий общежитием (Убайд): +20 103 007 2440\n• Отдел по работе со студентами: +20 111 233 5628\n• Госпиталь Saudi German: 16259\n• Пожарная служба: 180 | Скорая помощь: 123`
      }
    ]
  },
  uz: {
    title: "Talabalar turar joyi qo'llanmasi",
    subtitle: "Xavfsizlik, birodarlik va kamolotda birga yashash",
    category: "Qoidalar va xavfsizlik",
    updated: "1.0-nashr (2026-yil 20-iyul)",
    description: "Qohiradagi Al-Ibaanah arab tili markazi talabalar turar joyi rasmiy qo'llanmasi. Tartib-qoidalar, islomiy qadriyatlar, sukunat soatlari va favqulodda aloqa raqamlari.",
    version: '1.0',
    effectiveDate: '2026-yil 20-iyul',
    approvedBy: "Turar joy menejeri, Al-Ibaanah arab tili markazi",
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    bismillahTranslation: 'Mehribon va rahmli Alloh nomi bilan',
    fullMarkdown: `AL-IBAANAH ARAB TILI MARKAZI — TALABALAR TURAR JOYI QO'LLANMASI
Xavfsizlik, birodarlik va kamolotda birga yashash

Al-Ibaanah arab tili markazining rasmiy nashri
Nashr: 1.0 | Kuchga kirish sanasi: 2026-yil 20-iyul
Tasdiqlagan: Turar joy menejeri, Al-Ibaanah arab tili markazi

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
Mehribon va rahmli Alloh nomi bilan

MUNDARIJA:
1-bob — Xush kelibsiz va Al-Ibaanah haqida
2-bob — Islomiy qadriyatlarimiz va asoslarimiz (Omonat, Ehson, Rahmat)
3-bob — Turar joyda yashash va tozalik
4-bob — Birga yashash va birodarlik
5-bob — Xavfsizlik va rasmiy qoidalar
6-bob — Ma'muriyat va mas'uliyat
7-bob — Talaba rozilik arizasi
Ilovalar (Muhim kontaktlar, Tozalash jadvali, Ko'p beriladigan savollar)

ASOSIY QOIDALAR:
• Sukunat soatlari: Har kuni soat 22:00 dan 06:00 gacha.
• Chekish va veyp (elektron sigareta) butunlay taqiqlangan.
• Mehmonlar faqat umumiy qabul hududida ruxsat etiladi; tunab qolish qat'iyan man etiladi.
• Misr xavfsizlik qoidasi: Misrlik xususiy repetitorlarning dars berish uchun turar joyga kirishi taqiqlanadi (darslar tashqarida tashkil etilishi kerak).
• Umumiy xonalar haftasiga 3 marta tozalanadi (yakshanba, seshanba, payshanba).
• Salfetkalarni unitazga tashlash qat'iyan man etiladi.
• Aloqa (Ubayd): +20 103 007 2440 | Saudi German shifoxonasi: 16259 | O't o'chirish: 180.`,
    chapters: [
      {
        id: 'ch1',
        number: 1,
        title: 'Xush kelibsiz',
        content: `Assalomu alaykum va rahmatullohi va barakotuh.\nAl-Ibaanah talabalar turar joyiga xush kelibsiz.\n\n5 asosiy burchimiz:\n1. Xavfsizlik\n2. Tozalik\n3. Birodarlik\n4. Mulkni asrash\n5. Ilm va ibodat muhiti`
      },
      {
        id: 'ch2',
        number: 2,
        title: 'Islomiy qadriyatlar',
        content: `Asosiy qadriyatlar:\n• Omonatdorlik\n• Ehson (har bir ishni chiroyli bajarish)\n• Rahmat va kechirimlilik\n• O'zaro hurmat\n• Mas'uliyat`
      },
      {
        id: 'ch3',
        number: 3,
        title: 'Turmush tarzi va tozalik',
        content: `• Ovqatdan so'ng idishlarni darhol yuvish.\n• Salfetkalarni hojatxona unitaziga tashlamaslik.\n• Haftasiga 3 marta tozalash xizmati.\n• Uy hayvonlari boqish taqiqlanadi.`
      },
      {
        id: 'ch4',
        number: 4,
        title: 'Birodarlik va sukunat soatlari',
        content: `• Sukunat soatlari: 22:00 dan 06:00 gacha.\n• Mehmonlarning kechasi qolishi taqiqlanadi.`
      },
      {
        id: 'ch5',
        number: 5,
        title: 'Xavfsizlik va Misr qonunlari',
        content: `• Chiqishda chiroq va konditsionerlarni o'chirish.\n• Misr xavfsizlik qoidasi: Misrlik ustozlarning turar joy ichida xususiy dars o'tishi taqiqlanadi.\n• Chekish mutlaqo man etiladi.`
      },
      {
        id: 'appendices',
        number: 'Ilova',
        title: 'Favqulodda raqamlar',
        content: `• Turar joy menejeri (Ubayd): +20 103 007 2440\n• Talabalar bo'limi: +20 111 233 5628\n• Saudi German shifoxonasi: 16259\n• Qutqaruv / O't o'chirish: 180`
      }
    ]
  },
  zh: {
    title: '学生住宿手册',
    subtitle: '在安全、兄弟情谊与卓越中共同生活',
    category: '政策与安全',
    updated: '版本 1.0 (2026年7月20日)',
    description: '开罗阿尔伊巴纳阿拉伯语中心官方学生住宿指南。详细说明社区准则、伊斯兰价值观、安静时间、埃及安全法规、清洁及应急联络。',
    version: '1.0',
    effectiveDate: '2026年7月20日',
    approvedBy: '住宿管理主管，阿尔伊巴纳阿拉伯语中心',
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    bismillahTranslation: '奉至仁至慈的安拉之名',
    fullMarkdown: `阿尔伊巴纳阿拉伯语中心 — 学生住宿手册
在安全、兄弟情谊与卓越中共同生活

阿尔伊巴纳阿拉伯语中心官方刊物
版本：1.0 | 生效日期：2026年7月20日
批准人：阿尔伊巴纳阿拉伯语中心住宿主管

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
奉至仁至慈的安拉之名

目录：
第一章 — 欢迎与中心介绍
第二章 — 我们的价值观与伊斯兰基础 (信托、善行、仁慈)
第三章 — 宿舍生活与卫生管理
第四章 — 共同生活与兄弟情谊
第五章 — 安全与埃及法规
第六章 — 管理与责任
第七章 — 住宿学生声明
附录 (重要联络电话、保洁时间表、常见问答)

核心要点：
• 安静时间：每日 22:00 至 06:00。
• 全面严禁吸烟与电子烟。
• 访客仅限在公共会客区；严禁留宿访客。
• 埃及安全法规：严格遵守埃及有关留学生住宿的法规，埃及私人教师不得进入宿舍授课（辅导须在宿舍外进行）。
• 公共区域每周提供 3 次专业保洁（周日、周二、周四）。
• 切勿将纸巾丢入马桶以防堵塞。
• 住宿主管 (Ubayd)：+20 103 007 2440 | 沙特德国医院：16259 | 消防：180。`,
    chapters: [
      {
        id: 'ch1',
        number: 1,
        title: '欢迎与关于中心',
        content: `As-salāmu ʿalaykum wa raḥmatullāhi wa barakātuh.\n欢迎来到开罗阿尔伊巴纳学生宿舍。\n\n五项共同承诺：\n1. 安全保障\n2. 清洁卫生\n3. 兄弟情谊\n4. 爱护公物\n5. 良好的求知与敬拜环境`
      },
      {
        id: 'ch2',
        number: 2,
        title: '价值观与伊斯兰基础',
        content: `核心价值观：\n• 信托 (Amānah)\n• 卓越与善行 (Iḥsān)\n• 仁慈 (Raḥmah)\n• 互相尊重\n• 个人责任`
      },
      {
        id: 'ch3',
        number: 3,
        title: '生活日常与厨房卫生',
        content: `• 用餐后立即清洗碗碟。\n• 纸巾扔入垃圾桶，禁止投入马桶。\n• 公共区域每周保洁3次。\n• 严禁饲养或带入宠物。`
      },
      {
        id: 'ch4',
        number: 4,
        title: '共同生活与安静时间',
        content: `• 严格安静时间：22:00 至 06:00。\n• 访客仅限白天在公共区域；严禁留宿他人。`
      },
      {
        id: 'ch5',
        number: 5,
        title: '安全保障与埃及安全法规',
        content: `• 离开房间时关闭空调和电灯。\n• 埃及安全规定：埃及私人辅导老师不得进入宿舍进行私教，须在外安排。\n• 宿舍内全域严禁吸烟与电子烟。`
      },
      {
        id: 'appendices',
        number: '附录',
        title: '紧急联络与常见问答',
        content: `• 住宿主管 (Ubayd): +20 103 007 2440\n• 学生事务处: +20 111 233 5628\n• 沙特德国医院 (开罗): 16259\n• 紧急电话: 消防 (180), 警察 (122), 救护车 (123)`
      }
    ]
  }
};

export const OFFICIAL_STUDENT_HANDBOOK_DOCUMENT: StudentDocument = {
  id: 'student-accommodation-handbook',
  title: 'Student Accommodation Handbook',
  category: 'Policy & Safety',
  updated: 'Version 1.0 (July 20, 2026)',
  description: 'Official residency guide of Al Ibaanah Arabic Centre (Living Together in Safety, Brotherhood and Excellence). Contains complete chapters on community rules, quiet hours, housekeeping, Egyptian security rules, emergency contacts, and checklists.',
  content: STUDENT_HANDBOOK_TRANSLATIONS.en.fullMarkdown,
  is_published: true,
  is_handbook: true,
  order: 0,
  created_at: '2026-07-20T00:00:00.000Z',
  updated_at: '2026-07-20T00:00:00.000Z',
  translations: {
    en: {
      title: STUDENT_HANDBOOK_TRANSLATIONS.en.title,
      category: STUDENT_HANDBOOK_TRANSLATIONS.en.category,
      updated: STUDENT_HANDBOOK_TRANSLATIONS.en.updated,
      description: STUDENT_HANDBOOK_TRANSLATIONS.en.description,
      content: STUDENT_HANDBOOK_TRANSLATIONS.en.fullMarkdown
    },
    ar: {
      title: STUDENT_HANDBOOK_TRANSLATIONS.ar.title,
      category: STUDENT_HANDBOOK_TRANSLATIONS.ar.category,
      updated: STUDENT_HANDBOOK_TRANSLATIONS.ar.updated,
      description: STUDENT_HANDBOOK_TRANSLATIONS.ar.description,
      content: STUDENT_HANDBOOK_TRANSLATIONS.ar.fullMarkdown
    },
    fr: {
      title: STUDENT_HANDBOOK_TRANSLATIONS.fr.title,
      category: STUDENT_HANDBOOK_TRANSLATIONS.fr.category,
      updated: STUDENT_HANDBOOK_TRANSLATIONS.fr.updated,
      description: STUDENT_HANDBOOK_TRANSLATIONS.fr.description,
      content: STUDENT_HANDBOOK_TRANSLATIONS.fr.fullMarkdown
    },
    ru: {
      title: STUDENT_HANDBOOK_TRANSLATIONS.ru.title,
      category: STUDENT_HANDBOOK_TRANSLATIONS.ru.category,
      updated: STUDENT_HANDBOOK_TRANSLATIONS.ru.updated,
      description: STUDENT_HANDBOOK_TRANSLATIONS.ru.description,
      content: STUDENT_HANDBOOK_TRANSLATIONS.ru.fullMarkdown
    },
    uz: {
      title: STUDENT_HANDBOOK_TRANSLATIONS.uz.title,
      category: STUDENT_HANDBOOK_TRANSLATIONS.uz.category,
      updated: STUDENT_HANDBOOK_TRANSLATIONS.uz.updated,
      description: STUDENT_HANDBOOK_TRANSLATIONS.uz.description,
      content: STUDENT_HANDBOOK_TRANSLATIONS.uz.fullMarkdown
    },
    zh: {
      title: STUDENT_HANDBOOK_TRANSLATIONS.zh.title,
      category: STUDENT_HANDBOOK_TRANSLATIONS.zh.category,
      updated: STUDENT_HANDBOOK_TRANSLATIONS.zh.updated,
      description: STUDENT_HANDBOOK_TRANSLATIONS.zh.description,
      content: STUDENT_HANDBOOK_TRANSLATIONS.zh.fullMarkdown
    }
  }
};
